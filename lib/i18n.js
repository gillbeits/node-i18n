require('sugar');

var i18n = exports
	, api = ['__'];

var fmt = i18n.sprintf = require('sprintf-js')
	, Fiber = i18n.Fiber = require('fibers')
	, mongoose = i18n.mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = Schema.ObjectId;

i18n.pkg = require('../package.json');
i18n.version = i18n.pkg.version;

i18n.__dict = {};

i18n.config = {
	locale: "ru_RU",
	defaultLocale: "ru_RU",
	activeLocales: ['ru_RU'],
	project: "",
	category: "core",
	express: undefined,
	mongo: {
		host: "localhost",
		port: 27017,
		db: "test",
		collection: "localize"
	}
};

var objectSchema = {
	string: String,
	locale: {type: String, default: i18n.config.locale}
};

i18n.schemas = {
	i18nItem: new Schema( Object.extended(objectSchema).merge({main: { type: ObjectId, ref: 'i18nMain' }}))
	, i18nMain: new Schema( Object.extended(objectSchema).merge({
		r_string: [{type: ObjectId, ref: 'i18nItem'}], category: String
	}))
};

i18n.models = {
	i18nItem: mongoose.model('i18nItem', i18n.schemas.i18nItem, i18n.config.mongo.collection)
	, i18nMain: mongoose.model('i18nMain', i18n.schemas.i18nMain, i18n.config.mongo.collection)
};

// private methods

function mongoInit(){
	var host = arguments[0] != null ? arguments[0] : i18n.config.mongo.host,
		port = arguments.length == 3 ? arguments[1] : i18n.config.mongo.port,
		db = arguments.length == 3 ? arguments[2] : (arguments[1] != null ? arguments[1] : i18n.config.mongo.db);

	if(!host || !port || !db) throw "Not enough parameters for connect to MongoDB";

	var connString = "mongodb://"+host+":"+port+"/"+db+"";
	mongoose.connect(connString);
};

function applyAPItoObject(request, response) {
	var object = response || request;
	api.forEach(function (method) {
		if (!object[method]) {
			object[method] = function () {
				return i18n[method].apply(request, arguments);
			};
		}
	});
}

function i18nInit() {

	if( i18n.config.express && typeof i18n.config.express.use == 'function' && typeof i18n.config.express.all == 'function' ){
		i18n.config.express.use(function(request, response, next){
			if (typeof request === 'object') {
				//guessLanguage(request);
				if (typeof response === 'object') {
					applyAPItoObject(request, response);
					if (!response.locale) response.locale = request.locale;
					if (response.locals) {
						applyAPItoObject(request, response.locals);
						if (!response.locals.locale) response.locals.locale = request.locale;
					}
				}
			}
			if (typeof next === 'function') {
				next();
			}
		});

		i18n.config.express.all('*', function (req, res, next) {
			Fiber(function () {

				var langs = req.headers['accept-language']
					, locales = {};
				langs = langs.split(',');
				langs.each(function(l){
					var _l = l.replace(/\-/,'_').match(/(.*?)?(;q=)(.*)/);
					var locale;
					if(_l)
						locale = _l[1];
					else
						locale = l.replace(/\-/,'_');

					for (var i in i18n.config.activeLocales){
						if( i18n.config.activeLocales[i].search(locale) == 0 )
						{
							i18n.config.locale = i18n.config.activeLocales[i];
							return false;
						}
					}
				});
				next.call();
			}).run();
		});
	}

};

function addToDict(main, doc){
	if( !i18n.__dict[doc.locale] ) i18n.__dict[doc.locale] = {};
	if( !i18n.__dict[doc.locale][main.category] ) i18n.__dict[doc.locale][main.category] = {};
	i18n.__dict[doc.locale][main.category][main.string] = doc.string;
};

// export methods

i18n.configInit = function(config){
	i18n.config = Object.extended(i18n.config).merge(config);

	if( global && Object.prototype.toString.call(global) === '[object global]'){
		applyAPItoObject(global);
	}
	i18nInit();
	mongoInit();
};

i18n.i18nGetString = function (_string, locale, category, callback){
	if( typeof locale == 'function' || undefined === locale){
		callback = locale;
		locale = i18n.config.locale;
		category = i18n.config.category;
	}

	if( typeof category == 'function' ){
		callback = category;
		category = locale;
		locale = i18n.config.locale;
	}

	category = (i18n.config.project ? i18n.config.project + '.' : "") + category;

	i18n.models.i18nMain
		.findOne({ string: _string, locale: i18n.config.defaultLocale, category: category })
		.populate({path: 'r_string', select: 'string locale', match: {locale: locale}, options: { limit: 1 }})
		.exec(function(err, doc){
			if(err) throw "Error";
			if(!doc){
				var i18nMain = new i18n.models.i18nMain({
					string: _string, locale: i18n.config.defaultLocale, category: category
				});

				i18nMain.save(function (err, __doc) {
					if (err) throw "Error";
					if( typeof callback == 'function' ) callback(null, __doc);
				});
			} else {
				if( typeof callback == 'function' ) callback(null, doc);
			}
		});
};

i18n.add = function (_string, translate, locale, category, callback){
	var _strings = {};
	if( Object.isObject(_string) ){ // (_strings, locale, category, callback)
		_strings = _string;
		callback = category;
		category = locale;
		locale = translate;
	}
	if( typeof category == 'function' || undefined === category ){
		callback = category;
		category = i18n.config.category;
	}
	if( typeof locale == 'function' || undefined === locale ){
		callback = locale;
		locale = i18n.config.locale;
		category = i18n.config.category;
	}

	if( !Object.isObject(_string) && Object.isString(_string) && Object.isString(translate)){
		_strings[_string] = translate;
	}

	Object.keys(_strings).each(function(el){
		var fiber = Fiber.current;
		i18n.i18nGetString(el, locale, category, function(err, doc){
			if(doc){
				i18n.models.i18nItem
					.findOneAndUpdate(
					{ string: _strings[el], locale: locale, main: doc._id}
					, { string: _strings[el], locale: locale }
					, { new: true, upsert: true })
					.populate({path: 'main', select: 'string', match: {locale: i18n.config.defaultLocale}, options: { limit: 1 }})
					.exec(function(err, i18nItem){
						if (err) throw err.message;
						var isNew = true;
						Array.prototype.slice.call(doc.r_string, 0).each(function(el){
							if(el._id != i18nItem._id)
								isNew &= false;
						});
						if(isNew){
							doc.r_string.push(i18nItem);
							doc.save(function(err){
								if (err) throw "Error";
								if( typeof callback == 'function' && Object.keys(_strings).last() == doc.string ) callback();
								fiber.run();
							});
						} else {
							if( typeof callback == 'function' && Object.keys(_strings).last() == doc.string ) callback();
							fiber.run();
						}
					});
			}
		});
		Fiber.yield();
	});
};

i18n.i18nGetLocale = function (callback){
	var fiber = Fiber.current;
	i18n.models.i18nMain
		.find({ locale: i18n.config.defaultLocale })
		.populate({path: 'r_string', select: 'string locale'})
		.exec(function(err, main){
			if(err) throw "Error";
			if(main){
				main.each(function(doc){
					doc.r_string.each(function(item){
						try {
							addToDict(doc, item);
						} catch (e) {
						}
					});
				});
				if( typeof callback == 'function' ) callback(null, main);
				fiber.run();
			}
		});
	Fiber.yield();
};

i18n.__ = function(_string, category, locale, args ){
	if( Object.isArray(locale)){
		args = locale;
		locale = category;
		category = (i18n.config.project ? i18n.config.project + '.' : "") + i18n.config.category;
	}
	if( Object.isArray(category)){
		args = category;
		locale = i18n.config.locale;
		category = (i18n.config.project ? i18n.config.project + '.' : "") + i18n.config.category;
	}
	if(!Object.isArray(args)){
		args = [""];
		locale = i18n.config.locale;
		category = (i18n.config.project ? i18n.config.project + '.' : "") + i18n.config.category;
	}

	if( i18n.__dict[locale] && i18n.__dict[locale][category] && i18n.__dict[locale][category][_string] ) return fmt.vsprintf( i18n.__dict[locale][category][_string], args);

	var fiber = Fiber.current;
	i18n.i18nGetString(_string, locale, category, function(err, doc){
		if( doc.r_string[0] )
		{
			addToDict(doc, doc.r_string[0]);
			fiber.run( fmt.vsprintf( doc.r_string[0].string, args) );
		} else
			fiber.run( fmt.vsprintf( _string, args) );
	});

	var r_string = Fiber.yield();
	return r_string;
};