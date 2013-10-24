var i18n = require('../')
	, fmt = require('sprintf-js')
	, Fiber = require('fibers');

i18n.configInit( { locale: "en_US" } );

Fiber(function(){

	i18n.add({
		"Добро пожаловать в %s": "Welcome to %s"
	}, 'en_US');

	i18n.i18nGetLocale();

	console.log( i18n.__dict );
	console.log( __('Добро пожаловать в %s', ["Express"]) );

}).run();
