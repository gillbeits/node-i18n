require('sugar');
var mongoose = require('mongoose');
var i18n = exports;
i18n['node-i18n'].pkg = require('../package.json');

i18n['node-i18n'] = {
	config: {
		locale: "ru_RU"
	}
};

i18n['node-i18n'].configInit = function(config){
	i18n['node-i18n'].config = Object.extended(i18n['node-i18n'].config).merge(config);
};

i18n['node-i18n'].schema = new mongoose.Schema({
	string: String,
	locale: {type: String, default: i18n['node-i18n'].config.locale}
});
i18n['node-i18n'].schema.add({
	l_string: [i18n['node-i18n'].schema]
});


i18n['node-i18n'].mongoInit = function(){
	var host = arguments[0] != null ? arguments[0] : "localhost",
		port = arguments.length == 3 ? arguments[1] : 27017,
		db = arguments.length == 3 ? arguments[2] : (arguments[1] != null ? arguments[1] : "test");

	if(!host || !port || !db) throw "Not enough parameters for connect to MongoDB";

	var connString = "mongodb://"+host+":"+port+"/"+db+"";
	mongoose.connect(connString);
};

