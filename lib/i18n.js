require('sugar');
require('sync');
var fmt = require('sprintf-js');

var mongoose = require('mongoose')
	, Schema = mongoose.Schema
	, ObjectId = Schema.ObjectId;;

var i18n = exports;
i18n.pkg = require('../package.json');
i18n.__dict = {};

i18n.config = {
	locale: "ru_RU",
	defaultLocale: "ru_RU",
	project: "",
	category: "core"
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
		r_string: [{type: ObjectId, ref: 'i18nItem'}], category: String
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
	if( i18n.config.defaultLocale == locale ) return _string;

	i18n.models.i18nMain
		.findOne({ string: _string, locale: i18n.config.defaultLocale, category: category })
		.populate({path: 'r_string', select: 'string', match: {locale: locale}, options: { limit: 1 }})
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
							});
						} else {
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
				docs.each(function(doc){
					try {
						if( !i18n.__dict[doc.category] ) i18n.__dict[doc.category] = {};
						i18n.__dict[doc.category][doc.string] = doc.r_string[0].string;
					} catch (e) {
					}
				});
				if( typeof callback == 'function' ) callback(null, docs);
			}
		});
};

i18n.__ = function(_string, category, args ){
	if( Object.isArray(category) || undefined === category){
		args = category;
		category = (i18n.config.project ? i18n.config.project + '.' : "") + i18n.config.category;
	}

	args = Object.isArray(args) ? args : [];

	if( i18n.__dict[category] && i18n.__dict[category][_string] ) return fmt.vsprintf( i18n.__dict[category][_string], args) ;
	var doc = i18n.i18nGetString.sync(null, _string, category);
	if( doc.r_string[0] )
	{
		i18n.__dict[_string] = doc.r_string[0].string;
		return fmt.vsprintf( doc.r_string[0].string, args);
	}
};