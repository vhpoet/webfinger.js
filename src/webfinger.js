/*!
 * webfinger.js
 * version 0.1.0
 * http://github.com/vhpoet/webfinger.js
 */
if (typeof XMLHttpRequest !== 'function') {
  var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
}
if (typeof document === 'undefined') {
  var document = {};
}
if (typeof window === 'undefined') {
  var window = {};
}
(function (window, document, undefined) {

  // list of endpoints to try, fallback from beginning to end.
  var uris = ['webfinger', 'host-meta', 'host-meta.json'];
  var DEBUG = false; // wrapper flag for log

  function log() {
    var args = Array.prototype.splice.call(arguments, 0);
    if (DEBUG) {
      console.log.apply(undefined, args);
    }
  }

  function isValidJSON(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  function isValidDomain(domain) {
    var pattern = /^[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
    return pattern.test(domain);
  }

  // make an http request and look for JRD response, fails if request fails
  // or response not json.
  function getJRD(url, cb) {
    log('URL: ' + url);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
      //log('xhr for '+url, xhr);
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          log(xhr.responseText);
          if (isValidJSON(xhr.responseText)) {
            cb(null, xhr.responseText);
          } else {
            // invalid json response
            cb({
              message: 'invalid json',
              url: url,
              status: xhr.status
            });
          }
        } else {
          // request failed
          cb({
            message: 'webfinger endpoint unreachable',
            url: url,
            status: xhr.status
          });
        }
      }
    };
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.send();
  }

  // processes JRD object as if it's a webfinger response object
  function processJRD(JRD, cb) {
    var links = JSON.parse(JRD).links;
    if (!links) {
      var serverResp = JSON.parse(JRD);
      if (typeof serverResp.error !== 'undefined') {
        cb(serverResp.error);
      } else {
        cb('received unknown response from server');
      }
      return;
    }

    var result = {
      properties: {},
      links: links,
      JRD: JRD // raw webfinger JRD
    };

    // process properties
    var props = JSON.parse(JRD).properties;
    for (var key in props) {
      result.properties[key] = props[key];
    }
    cb(null, result);
  }

  function callWebFinger(address, p, cb) {
    p.tls_only = true; // never fallback to http

    if (!isValidDomain(p.host)) {
      cb('invalid host name');
      return;
    }

    if (typeof p.uri_fallback === "undefined") {
      p.uri_fallback = false;
    }
    if (typeof p.uri_index === "undefined") {
      // try first URI first
      p.uri_index = 0;
    }

    if (typeof p.protocol === "undefined") {
      // we use https by default
      p.protocol = 'https';
    }

    // make request
    getJRD(p.protocol + '://' + p.host + '/.well-known/' +
        uris[p.uri_index] + '?resource=acct:' + address,
    function(err,JRD) {
      if (err) {
        cb(err);
        return;
      }

      processJRD(JRD, cb);
    });
  }

  window.webfinger = function(address, o, cb) {
    if (typeof o === 'function') {
      cb = o;
      o = {};
    } else if (typeof cb !== 'function') {
      console.log('webfinger.js: no callback function specified. webfinger(address, options, callback)');
      return { error: "no callback function specified" };
    }

    var parts = address.replace(/ /g,'').split('@');
    if (parts.length !== 2) {
      cb({message: 'invalid user address ( user@host )'});
      return false;
    }

    DEBUG = (typeof o.debug !== 'undefined') ? o.debug : false;

    callWebFinger(address, {
      host: parts[1],
      tls_only: (typeof o.tls_only !== 'undefined') ? o.tls_only : true
    }, cb);
  };

})(window, document);

if (typeof (define) === 'function' && define.amd) {
  define([], function() { return window.webfinger; });
} else {
  try {
    module.exports = window.webfiner;
  } catch (e) {}
}