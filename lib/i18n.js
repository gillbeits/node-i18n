require('sugar');
var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = Schema.ObjectId;;

var i18n = exports;
i18n.pkg = require('../package.json');

i18n.config = {
	locale: "ru_RU",
	defaultLocale: "ru_RU"
};

i18n.configInit = function(config){
	i18n.config = Object.extended(i18n.config).merge(config);
};

var objectSchema = {
	string: String,
	locale: {type: String, default: i18n.config.locale}
};

i18n.schemas = {
	i18nItem: new Schema( Object.extended(objectSchema).merge({main: { type: ObjectId, ref: 'i18nMain' }}))
	, i18nMain: new Schema( Object.extended(objectSchema).merge({
		r_string: [{type: ObjectId, ref: 'i18nItem'}]
	}))
};

i18n.models = {
	i18nItem: mongoose.model('i18nItem', i18n.schemas.i18nItem, 'localize')
	, i18nMain: mongoose.model('i18nMain', i18n.schemas.i18nMain, 'localize')
};

i18n.mongoInit = function(){
	var host = arguments[0] != null ? arguments[0] : "localhost",
		port = arguments.length == 3 ? arguments[1] : 27017,
		db = arguments.length == 3 ? arguments[2] : (arguments[1] != null ? arguments[1] : "test");

	if(!host || !port || !db) throw "Not enough parameters for connect to MongoDB";

	var connString = "mongodb://"+host+":"+port+"/"+db+"";
	mongoose.connect(connString);
};

i18n.i18nGetString = function (_string, callback){
	if( i18n.config.defaultLocale == i18n.config.locale ) return _string;

	i18n.models.i18nMain
		.findOne({ string: _string, locale: i18n.config.defaultLocale })
		.populate({path: 'r_string', select: 'string', match: {locale: i18n.config.locale}, options: { limit: 1 }})
		.exec(function(err, doc){
			if(err) throw "Error";
			if(!doc){
				var i18nMain = new i18n.models.i18nMain({
					string: _string, locale: i18n.config.defaultLocale
				});

				i18nMain.save(function (err, __doc) {
					if (err) throw "Error";
					if( typeof callback == 'function' ) callback(__doc);
					doc = __doc;
				});
			} else {
				if( typeof callback == 'function' ) callback(doc);
			}
		});
};

i18n.add = function (_string, translate, locale, callback){
	var _strings = {};
	if( Object.isObject(_string) ){
		_strings = _string;
		callback = locale;
		locale = translate;
	}
	if( typeof locale == 'function' ){
		callback = locale;
		locale = i18n.config.locale;
	}
	if( !Object.isObject(_string) && Object.isString(_string) && Object.isString(translate)){
		_strings[_string] = translate;
	}
	Object.keys(_strings).each(function(el){
		i18n.i18nGetString(el, function(doc){
			if(doc){
				i18n.models.i18nItem
					.findOneAndUpdate(
					{ string: _strings[el], locale: locale, main: doc._id}
					, { string: _strings[el], locale: locale }
					, { new: true, upsert: true })
					.populate({path: 'main', select: 'string', match: {locale: i18n.config.defaultLocale}, options: { limit: 1 }})
					.exec(function(err, i18nItem){
						if (err) throw "Error";
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
							});
						} else {
							console.log('Y', Object.keys(_strings).last() == doc.string);
							if( typeof callback == 'function' && Object.keys(_strings).last() == doc.string ) callback();
						}
					});
			}
		});
	});
};

i18n.i18nGetLocale = function (callback){
	i18n.models.i18nMain
		.find({ locale: i18n.config.defaultLocale })
		.populate({path: 'r_string', select: 'string', match: {locale: i18n.config.locale}})
		.exec(function(err, docs){
			if(err) throw "Error";
			if(docs){
				i18n.__dict = {};
				docs.each(function(doc){
					try {
						i18n.__dict[doc.string] = doc.r_string[0].string;
					} catch (e) {
						console.log(e);
					}

				});
				if( typeof callback == 'function' ) callback(docs);
			}
		});
};

i18n.__ = function(_string){
	return i18n.__dict[_string];
};