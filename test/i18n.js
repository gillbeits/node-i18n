var i18n = require('../');
var Sync = require('sync');
i18n.configInit( { locale: "en_US", project: "testProject" } ); // ko_KR
i18n.mongoInit();

Sync(function(){

	i18n.add.sync(null, {
		"Какой-то текст": "누군가가 텍스트",
		"Только для тебя": "당신 만의"
	}, 'ko_KR');

	i18n.add.sync(null, {
		"Какой-то текст": "Someone text",
		"Только для тебя": "Only for you"
	}, 'en_US');

	i18n.add.sync(null, {
		"Какой-то текст": "Someone text",
		"Только для тебя": "Only for you"
	}, 'en_US', 'admin');

	i18n.i18nGetLocale.sync();

	console.log( i18n.__dict );

	console.log( i18n.__("Какой-то текст") );
});