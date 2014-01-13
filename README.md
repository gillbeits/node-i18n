node-i18n-mongo
---------

Module for i18n support in node.js projects with mongodb

Install module:
```
npm install node-i18n-mongo
```
and then use it:
```js
var i18n = require('node-i18n-mongo');

i18n.configInit( { defaultLocale: "en_US", locale: "de_DE" } ); // <-- init config, mongo connect and global function apply
```
Then you'me may use it in Fiber:
```js
i18n.Fiber(function(){
	i18n.add({
        "Welcome to my World, %s": "Willkommen in meiner Welt, %s"
    }, 'de_DE');

    i18n.i18nGetLocale();

    console.log( i18n.__dict );
    console.log( __("Welcome to my World, %s", ["Mike"]) );
});
```
For use it in ExpressJs:
```js
var app = express();
...
i18n.configInit( { defaultLocale: "en_US", locale: "de_DE", express: app } );
```
Then use it in ejs:
```ejs
<%= __("Welcome to my World, %s", [name]) %>
```
or in jade:
```jade
h2= title
  p= __("Welcome to my World, %s", [name])
```
