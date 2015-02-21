/*!
 * angular-sails
 * An angular provider for using the sails socket.io api
 * @version v1.1.0
 * @link https://github.com/kyjan/angular-sails
 * @license MIT License, http://www.opensource.org/licenses/MIT
 */
(function(window, angular, undefined){'use strict';

angular.module('ngSails', ['ngSails.$sails']);

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

'use strict';

/* jshint newcap: false */
/* global headersGetter: true,
  arrIndexOf: true,
  isFile: true,
  isBlob: true
*/

angular.module('ngSails.$sails', ['ngSails.$sailsIo', 'ngSails.$sailsInterceptor'])
  .provider('$sails', $sails);

function $sails($sailsInterceptorProvider, $sailsIoProvider) {
  var provider = this;
  var httpVerbsWithData = ['post', 'put', 'patch'];

  provider.httpVerbs = $sailsIoProvider.httpVerbs = ['get', 'post', 'put', 'patch', 'delete', 'head'];
  provider.eventNames = $sailsIoProvider.eventNames = ['on', 'off', 'once'];
  provider.config = {
    transports: ['websocket', 'polling']
  };
  provider.debug = $sailsInterceptorProvider.debug = $sailsIoProvider.debug = false;

  provider.debugger = function(val) {
    provider.debug = $sailsInterceptorProvider.debug = $sailsIoProvider.debug = val;
  };

  provider.defaults = {
      transformResponse: [],
      transformRequest: [],
      headers: {} // TODO: default headers
  };

  provider.interceptors = $sailsInterceptorProvider.interceptors = [
    /*function($injectables) {
        return {
            request: function(config) {},
            response: function(response) {},
            requestError: function(rejection) {},
            responseError: function(rejection) {}
        };
    }*/
  ];

  this.$get = ["$q", "$log", "$timeout", "$sailsIo", "$sailsInterceptor", function($q, $log, $timeout, $sailsIo, $sailsInterceptor) {
    var socket = new $sailsIo(provider.socket || provider.url, provider.config);
    var socketFunctions = ['connect','disconnect','isConnected'];

    function $sails(config) {
      return $sails[config.method](config.url, config);
    }

    $sails._socket = socket;

    function exposeSocketFunction(fnName){
      $sails[fnName] = socket[fnName].bind(socket);
    }

    function exposeVerbEndpoints(methodName) {

      $sails[methodName] = function(url, data, requestConfig) {
        var config = {
          method: methodName,
          transformRequest: provider.defaults.transformRequest,
          transformResponse: provider.defaults.transformResponse,
          headers: {}// TODO: default headers
        };

        requestConfig = requestConfig || {};

        // more compatible with $http method arguments
        if (arrIndexOf(httpVerbsWithData, methodName) === -1) {
          requestConfig = data || requestConfig;
          delete requestConfig.data;
        } else {
          requestConfig.data = data;
        }

        angular.extend(config, requestConfig);
        config.url = (provider.urlPrefix || '') + (url || config.url);
        config.method = (config.method || methodName).toUpperCase();

        var promise = $sailsInterceptor(socket[methodName].bind(socket), config);

        promise.success = function(fn) {
          promise.then(function(res) {
            fn(res.data, res.status, headersGetter(res.headers), res.config);
          });
          return promise;
        };

        promise.error = function(fn) {
          promise.then(null, function(res) {
            fn(res.data, res.status, headersGetter(res.headers), res.config);
          });
          return promise;
        };

        return promise;

      };
    }

    function exposeEventsEndpoitns(eventName) {
      $sails[eventName] = socket[eventName].bind(socket);
    }

    angular.forEach(provider.httpVerbs, exposeVerbEndpoints, this);
    angular.forEach(provider.eventNames, exposeEventsEndpoitns, this);
    angular.forEach(socketFunctions, exposeSocketFunction, this);

    /**
     * Update a model on sails pushes
     * @param {String} name       Sails model name
     * @param {Array} models      Array with model objects
     */
    $sails.$modelUpdater = function(name, models) {

      socket.on(name, function(message) {
        var i;

        if (provider.debug) {
          $log.info('$sails ' + name + ' model ' + message.verb + ' id: ' + message.id, message.data);
        }

        switch (message.verb) {

          case "created":
            // create new model item
            models.push(message.data);
            break;

          case "updated":
            var obj;
            for (i = 0; i < models.length; i++) {
              if (models[i].id === message.id) {
                obj = models[i];
                break;
              }
            }

            // cant update if the angular-model does not have the item and the
            // sails message does not give us the previous record
            if (!obj && !message.previous) return;

            if (!obj) {
              // sails has given us the previous record, create it in our model
              obj = message.previous;
              models.push(obj);
            }

            // update the model item
            angular.extend(obj, message.data);
            break;

          case "destroyed":
            for (i = 0; i < models.length; i++) {
              if (models[i].id === message.id) {
                models.splice(i, 1);
                break;
              }
            }
            break;
        }
      });
    };

    $sails.defaults = this.defaults;

    return $sails;
  }];
}
$sails.$inject = ["$sailsInterceptorProvider", "$sailsIoProvider"];

'use strict';

/* global isPromiseLike: true,
  headersGetter: true
*/

angular.module('ngSails.$sailsInterceptor', [])
  .provider('$sailsInterceptor', $sailsInterceptor);

function $sailsInterceptor() {
  var provider = this;
  provider.interceptors = [];

  this.$get = ["$injector", "$q", function($injector, $q) {

    var reversedInterceptors = [];

    angular.forEach(provider.interceptors, function(interceptorFactory) {
      reversedInterceptors.unshift(angular.isString(interceptorFactory) ? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
    });

    var intercept = function(sendRequest, config) {
      var _sendRequest = sendRequest;

      if (isPromiseLike(sendRequest)) {
        _sendRequest = function() {
          return sendRequest;
        };
      }

      var chain = [transformRequest, undefined, _sendRequest, undefined, transformResponse, transformResponse];
      var promise = $q.when(config);

      angular.forEach(reversedInterceptors, function(interceptor) {
        if (interceptor.request || interceptor.requestError) {
          chain.unshift(interceptor.request, interceptor.requestError);
        }
        if (interceptor.response || interceptor.responseError) {
          chain.push(interceptor.response, interceptor.responseError);
        }
      });

      while (chain.length) {
        var thenFn = chain.shift();
        var rejectFn = chain.shift();

        promise = promise.then(thenFn, rejectFn);
      }

      return promise;
    };

    function transformRequest(config) {
      return angular.extend({}, config, {
        data: transformData(config.data, headersGetter(config.headers), config.transformRequest || [])
      });
    }

    function transformResponse(response) {
      var resp = angular.extend({}, response, {
        data: transformData(response.data, response.headers, response.config && response.config.transformResponse || [])
      });
      return (200 <= response.status && response.status < 300) ? resp : $q.reject(resp);
    }

    function transformData(data, headers, fns) {
      if (angular.isFunction(fns)){
        return fns(data, headers);
      }

      angular.forEach(fns, function(fn) {
        data = fn(data, headers);
      });

      return data;
    }

    return intercept;
  }];
}

'use strict';

/* global statusText: true,
  buildUrl: true
*/

angular.module('ngSails.$sailsIo', ['ngSails.sailsSdk', 'ngSails.socketIo'])
  .provider('$sailsIo', $sailsIo);

function $sailsIo() {
  var provider = this;
  provider.httpVerbs = ['get', 'post', 'put', 'delete'];
  provider.eventNames = ['on', 'off', 'once'];

  this.$get = ["$rootScope", "$q", "$log", "socketIo", "sailsSdk", function($rootScope, $q, $log, socketIo, sailsSdk) {
    var io = socketIo;

    function SailsIo(url, config) {
      return this.connect(url, config);
    }

    SailsIo.prototype.connect = function(url, config) {
      var self = this;
      config = config || {};

      if(self._socket && self._socket.connected){
        throw new Error('Socket is already connected.');
      }

      if(!self.connectDefer){
        self.connectDefer = $q.defer();
      }

      if (angular.isObject(url) && angular.isFunction(url.on) && angular.isFunction(url.emit)){
          // user passed in a socket, lets use it.
          self._socket = url;
          self.connectDefer.resolve();
      }else{
        if(!angular.isString(config.query)){
            config.query = sailsSdk.versionString();
        }else{
            config.query += '&'+sailsSdk.versionString();
        }

        if (!self._socket || !self._socket.connected) {
          self._socket = io(config.url, config);
          self.connectDefer.resolve();
        }
      }

      if (provider.debug) {
        self.on('connect', $log.info.bind(self, '$sails connected.'));
        self.on('disconnect', $log.info.bind(self, '$sails disconnected.'));
        self.on('reconnecting', function(attemps) {
          $log.warn.bind(self, '$sails is attemping to reconnect. (#' + attemps + ')');
        });
        self.on('reconnect', function(transport, attemps) {
          $log.info.bind(self, '$sails successfully reconnected after ' + attemps + ' attemps.');
        });
        self.on('error', function(err) {
          $log.error('$sails could not connect:', err);
        });
      }

      return self;
    };

    SailsIo.prototype.disconnect = function() {
      var self = this;
      if (self._socket) {
        self._socket.disconnect();
      }
      if(self.connectDefer){
        self.connectDefer.reject('disconnect');
      }
      self.connectDefer = $q.defer();
    };

    SailsIo.prototype.isConnected = function() {
      if (!this._socket) {
        return false;
      }
      return this._socket.connected;
    };

    SailsIo.prototype._send = function(req, res) {
      var self = this;
      var sailsEndpoint = req.method.toLowerCase();

      self.connectDefer.promise.then(function sendRequest() {
        if (provider.debug) {
          $log.info('$sails ' + req.method + ' ' + req.url, req.data || '');
        }

        self._socket.emit(sailsEndpoint, req, function requestResponse(response) {
            if (provider.debug) {
              $log.info('$sails' + req.method + ' ' + req.url + ' response received', response);
            }
          var serverResponse = {
            data: response.body || response || {},
            status: response.statusCode || response.status || response.Status || 200,
            headers: response.headers || {},
            config: req
          };

          serverResponse.statusText = statusText[serverResponse.status];

          if (200 <= serverResponse.status && serverResponse.status < 300) {
            res.reject(serverResponse);
          } else {
            res.resolve(serverResponse);
          }
        });
      }, function voidRequest() {
        if (provider.debug) {
          $log.warn('$sails' + req.method + ' ' + req.url + ' request terminated', req);
        }
        res.reject({
          data: null,
          status: 0,
          headers: {},
          config: req,
          statusText: null
        });
      });
    };

    SailsIo.prototype._req = function(req) {
      var self = this;
      var res = $q.defer();

      req.url = buildUrl(req.url.replace(/^(.+)\/*\s*$/, '$1'), req.params);
      req.headers = req.headers || {};
      req.data = req.data || {};
      req.method = req.method.toUpperCase();

      if (typeof req.url !== 'string') {
        throw new Error('Invalid or missing URL!');
      }

      self._send(req, res);

      return res.promise;

    };

    angular.forEach(provider.httpVerbs, function(method) {
      SailsIo.prototype[method] = SailsIo.prototype._req;
    });

    angular.forEach(provider.eventNames, function(ev) {
      SailsIo.prototype[ev] = function(evt, cb) {
        var self = this;
        if (cb !== null && angular.isFunction(cb)) {
          self._socket[ev](evt, function(result) {
            $rootScope.$evalAsync(cb.bind(self, result));
          });
        }
      };
    }, this);

    return SailsIo;
  }];

}

'use strict';

// Sailsjs expects this information in the request...
angular.module('ngSails.sailsSdk', [])
  .constant('sailsSdk', {
    info: {
      version: {
        key: '__sails_io_sdk_version',
        value: '0.11.0'
      },
      platform: {
        key: '__sails_io_sdk_platform',
        value: typeof module === 'undefined' ? 'browser' : 'node'
      },
      language: {
        key: '__sails_io_sdk_language',
        value: 'javascript'
      }
    },
    versionString: function() {
      var self = this;
      return (function(){
        var tmp = [];
        angular.forEach(self.info, function(data){
            tmp.push(data.key+'='+data.value);
        });
        return tmp.join('&');
      }());
    }
  });

'use strict';

angular.module('ngSails.socketIo', [])
  .factory('socketIo', socketIo);

function socketIo($window) {
  if (!$window.io) {
    throw new Error('Socket.io-client not found. Ensure socket.io-client is loaded before this script');
  }
  return $window.io;
}
socketIo.$inject = ["$window"];
})(window, window.angular);