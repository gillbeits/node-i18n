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

i18n.i18nGetString = function i18nGetString(_string, callback){
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

i18n.add = function i18nTranslate(_string, translate, locale){
	i18n.i18nGetString(_string, function(doc){
		if(doc){
			i18n.models.i18nItem
				.findOneAndUpdate(
					{ string: translate, locale: locale ? locale : i18n.config.locale, main: doc._id}
					, { string: translate, locale: locale ? locale : i18n.config.locale, main: doc._id}
					, { new: true, upsert: true })
				.populate({path: 'main', select: 'string', match: {locale: i18n.config.defaultLocale}, options: { limit: 1 }})
				.exec(function(err, i18nItem){
					if (err) throw "Error";
					if(!i18nItem.main._id){
						doc.r_string.push(i18nItem);
						doc.save();
					}
				});
		}
	});
};

i18n.i18nGetLocale = function i18nGetString(callback){
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