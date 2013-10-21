var i18n = require('../');

i18n.configInit( { locale: "ko_KR" } );
i18n.mongoInit();

i18n.add({
	"Какой-то текст": "누군가가 텍스트",
	"Только для тебя": "당신 만의"
}, function(){
	i18n.i18nGetLocale(function(){
		console.log( i18n.__dict );
	});
});

//i18n.i18nGetLocale(function(){
//	console.log( i18n.__dict );
//});