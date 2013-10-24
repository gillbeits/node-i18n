var i18n = require('../')
	, fmt = require('sprintf-js')
	, Fiber = require('fibers');

i18n.configInit( { defaultLocale: 'en_US', locale: "de_DE" } );

i18n.Fiber(function(){
	i18n.add({
		"Welcome to my World, %s": "Willkommen in meiner Welt, %s"
	}, 'de_DE');

	i18n.add({
		"Welcome to my World, %s": "Добро пожаловать в мой мир, %s"
	}, 'ru_RU');

	i18n.i18nGetLocale();

	console.log( __('Welcome to my World, %s') );
	console.log( __('Welcome to my World, %s', ["Mike"]) );
	console.log( __('Welcome to my World, %s', 'core', 'ru_RU', ["Mike"]) );

	console.log( i18n.__dict );
}).run();

//i18n.i18nGetString('Welcome to my World, %s', function(err, doc){
//	console.log(doc);
//});