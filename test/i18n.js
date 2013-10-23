var i18n = require('../')
	, Sync = require('sync')
	, fmt = require('sprintf-js');

i18n.configInit( { locale: "en_US" } );
i18n.mongoInit();

Sync(function(){

	i18n.add.sync(null, {
		"Привет %s": "Hello %s"
	}, 'en_US');

	i18n.i18nGetLocale.sync();

	console.log('### start print');

	console.log( i18n.__dict );

	var user = "gillbeits";
	console.log( fmt.vsprintf("Привет %s", [user]) );
	console.log( i18n.__("Привет %s", [user]) );

	console.log('### end print');
});