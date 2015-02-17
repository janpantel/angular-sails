'use strict';

function parseHeaders(headers) {
  var parsed = {},
    key, val, i;
  if (!headers) return parsed;
  angular.forEach(headers.split('\n'), function(line) {
    i = line.indexOf(':');
    key = angular.lowercase(trim(line.substr(0, i)));
    val = trim(line.substr(i + 1));
    if (key) {
      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
    }
  });

  return parsed;
}

function trim(value) {
  return angular.isString(value) ? value.trim() : value;
}

function isPromiseLike(obj) {
  return obj && angular.isFunction(obj.then);
}

// copied from angular
function headersGetter(headers) {
  var headersObj = angular.isObject(headers) ? headers : undefined;
  return function(name) {
    if (!headersObj) headersObj = parseHeaders(headers);
    if (name) {
      var value = headersObj[angular.lowercase(name)];
      if (value === void 0) {
        value = null;
      }
      return value;
    }
    return headersObj;
  };
}

function arrIndexOf(arr, val) {
  if (!angular.isArray(arr)) {
    throw new TypeError('Expected type "array" by got type "' + (Object.prototype.toString.call(arr)) + '".');
  }

  if (Array.prototype.indexOf) {
    return arr.indexOf(val);
  } else {
    var i = 0;
    var len = arr.length;

    if (len === 0) {
      return -1;
    }

    while (i < len) {
      if (i in arr && arr[i] === val) {
        return i;
      }
      i++;
    }
    return -1;
  }
}

function buildUrl(url, params) {
  if (!params) return url;
  var parts = [];
  forEachSorted(params, function(value, key) {
    if (value === null || angular.isUndefined(value)) return;
    if (!angular.isArray(value)) value = [value];

    angular.forEach(value, function(v) {
      if (angular.isObject(v)) {
        if (angular.isDate(v)) {
          v = v.toISOString();
        } else {
          v = angular.toJson(v);
        }
      }
      parts.push(encodeUriQuery(key) + '=' +
        encodeUriQuery(v));
    });
  });
  if (parts.length > 0) {
    url += ((url.indexOf('?') == -1) ? '?' : '&') + parts.join('&');
  }
  return url;
}

function forEachSorted(obj, iterator, context) {
  var keys = sortedKeys(obj);
  for (var i = 0; i < keys.length; i++) {
    iterator.call(context, obj[keys[i]], keys[i]);
  }
  return keys;
}

function sortedKeys(obj) {
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key);
    }
  }
  return keys.sort();
}

function encodeUriQuery(val, pctEncodeSpaces) {
  return encodeURIComponent(val).
  replace(/%40/gi, '@').
  replace(/%3A/gi, ':').
  replace(/%24/g, '$').
  replace(/%2C/gi, ',').
  replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
}

function isFile(obj) {
  return Object.prototype.toString.call(obj) === '[object File]';
}

function isBlob(obj) {
  return Object.prototype.toString.call(obj) === '[object Blob]';
}

var statusText = {
  100: "100 Continue",
  101: "101 Switching Protocols",
  102: "102 Processing",
  200: "200 OK",
  201: "201 Created",
  202: "202 Accepted",
  203: "203 Non-Authoritative Information",
  204: "204 No Content",
  205: "205 Reset Content",
  206: "206 Partial Content",
  207: "207 Multi-Status",
  208: "208 Already Reported",
  226: "226 IM Used",
  300: "300 Multiple Choices",
  301: "301 Moved Permanently",
  302: "302 Found",
  303: "303 See Other",
  304: "304 Not Modified",
  305: "305 Use Proxy",
  306: "306 (Unused)",
  307: "307 Temporary Redirect",
  308: "308 Permanent Redirect",
  400: "400 Bad Request",
  401: "401 Unauthorized",
  402: "402 Payment Required",
  403: "403 Forbidden",
  404: "404 Not Found",
  405: "405 Method Not Allowed",
  406: "406 Not Acceptable",
  407: "407 Proxy Authentication Required",
  408: "408 Request Timeout",
  409: "409 Conflict",
  410: "410 Gone",
  411: "411 Length Required",
  412: "412 Precondition Failed",
  413: "413 Payload Too Large",
  414: "414 URI Too Long",
  415: "415 Unsupported Media Type",
  416: "416 Range Not Satisfiable",
  417: "417 Expectation Failed",
  422: "422 Unprocessable Entity",
  423: "423 Locked",
  424: "424 Failed Dependency",
  426: "426 Upgrade Required",
  428: "428 Precondition Required",
  429: "429 Too Many Requests",
  431: "431 Request Header Fields Too Large",
  500: "500 Internal Server Error",
  501: "501 Not Implemented",
  502: "502 Bad Gateway",
  503: "503 Service Unavailable",
  504: "504 Gateway Timeout",
  505: "505 HTTP Version Not Supported",
  506: "506 Variant Also Negotiates",
  507: "507 Insufficient Storage",
  508: "508 Loop Detected",
  510: "510 Not Extended",
  511: "511 Network Authentication Required"
};
