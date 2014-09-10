webfinger.js
============

This is a modified/simplified version of [silverbucket/webfinger.js](https://github.com/silverbucket/webfinger.js), a webfinger client that runs both in the browser and in node.js.

features
--------

* defaults to TLS only

* optional URI fallback (for older services which use host-meta or host-meta.json URI endpoints)


## initialize

### node.js
In node.js you should first require the module:

	var webfinger = require('webfinger.js');

### browser
When you include the `src/webfinger.js` script, a `webfinger` object will be exposed.

## use

	webfinger('nick@silverbucket.net', {
		tls_only: true,          // defaults to true
		uri_fallback: false,     // defaults to false
		debug: false             // defaults to false
	}, function (err, p) {
		if (!err) {
			console.log(p);
		}
	});
