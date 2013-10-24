var i18n = require('../')
	, fmt = require('sprintf-js')
	, Fiber = require('fibers');

i18n.configInit( { locale: "de_DE" } );

i18n.Fiber(function(){
	i18n.add({
		"Welcome to my World, %s": "Willkommen in meiner Welt, %s"
	}, 'de_DE');

	i18n.i18nGetLocale();

	console.log( i18n.__dict );
	console.log( __('Welcome to my World, %s', ["Mike"]) );
}).run();
