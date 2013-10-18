var i18n = require('../');
var mongoose = require('mongoose');

//var db = mongoose.connection;
//mongoose.connect("mongodb://localhost:27017/test");
//
//
//
//db.once('open', function callback () {
//	mongoose.models.i18nMain
//		.findOne({string: "Какой-то текст", locale: "ru_RU"})
//		.populate({path: 'r_string', select: 'string', match: {locale: 'en_US'}})
//		.exec(function(err, docs){
//			console.log(docs);
//		})
//	;
//});


i18n.configInit( { locale: "ko_KR" } );
i18n.mongoInit();
i18n.add("Какой-то текст", "누군가가 텍스트");
i18n.i18nGetLocale(function(){
	console.log( i18n.__dict );
});



