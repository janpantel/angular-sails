(function(angular, io) {
  'use strict';
  io.sails.autoConnect = false;

  // copied from angular
  function parseHeaders(headers) {
    var parsed = Object.create(null), key, val, i;
    if(!headers) return parsed;
    forEach(headers.split('\n'), function(line) {
      i = line.indexOf(':');
      key = lowercase(trim(line.substr(0, i)));
      val = trim(line.substr(i + 1));
      if(key) {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    });

    return parsed;
  }
  function trim(value) {
    return angular.isString(value) ? value.trim() : value;
  }

  // copied from angular
  function headersGetter(headers) {
    var headersObj = angular.isObject(headers) ? headers : undefined;
    return function(name) {
      if(!headersObj) headersObj = parseHeaders(headers);
      if(name) {
        var value = headersObj[lowercase(name)];
        if(value === void 0) {
          value = null;
        }
        return value;
      }
      return headersObj;
    };
  }


  /*global angular */
  angular.module('ngSails', ['ng']);

  /*global angular, io */
  angular.module('ngSails').provider('$sails', function() {
    var provider = this;

    // wrap these socket.io methods with angular promises
    this.httpVerbs = ['get', 'post', 'put', 'delete'];

    // wrap these events in $evalAsync to fire a digest cycle
    this.eventNames = ['on', 'once'];

    // the url to connect to
    this.url = undefined;
    
    // Prefix every request with this url
    this.urlPrefix = '';
    
    this.config = {
      // Transports to use when communicating with the server, in the order they will be tried
      transports: ['websocket', 'polling'],
      useCORSRouteToGetCookie: false
    };
    this.debug = false;

    // like https://docs.angularjs.org/api/ng/service/$http#interceptors
    // but with sails.io arguments
    var interceptorFactories = this.interceptors = [
      /*function($injectables) {
         return {
           request: function(config) {},
           response: function(response) {},
           requestError: function(config) {},
           responseError: function(response) {}
         };
       }*/
    ];

    this.$get = ['$q', '$injector', '$rootScope', '$log', function($q, $injector, $rootScope, $log) {
      var socket = (io.sails || io).connect(provider.url, provider.config);

      // build interceptor chain
      var reversedInterceptors = [];
      angular.forEach(interceptorFactories, function(interceptorFactory) {
        reversedInterceptors.unshift(
          angular.isString(interceptorFactory) ?
            $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
      });

      // Send the request using the socket
      function serverRequest(config) {
        var defer = $q.defer();
        if(provider.debug) $log.info('$sails ' + config.method.toUpperCase() + ' ' + config.url, config.data || '');

        socket['legacy_' + config.method](config.url, config.data, function(result, jwr) {
          // resolve promise if JSON web response is an object that has a statusCode 2xx
          if(!jwr) jwr = {};
          jwr.data = result; // backward and $http compat
          jwr.status = jwr.statusCode; // $http compat
          jwr.socket = socket;
          jwr.url = config.url;
          jwr.method = config.method.toUpperCase();
          jwr.config = config.config;
          if(jwr.error || jwr.statusCode < 200 || jwr.statusCode >= 300) {
            if(provider.debug) $log.warn('$sails response ' + jwr.statusCode + ' ' + config.url, jwr);
            defer.reject(jwr);
          } else {
            if(provider.debug) $log.info('$sails response ' + config.url, jwr);
            defer.resolve(jwr);
          }
        });
        return defer.promise;
      }

      // Wrap a socket.io method within the promis chain
      function promisify(methodName) {
        socket['legacy_' + methodName] = socket[methodName];

        socket[methodName] = function(url, data, config) {

          var chain = [serverRequest, undefined];
          var promise = $q.when({
            url: provider.urlPrefix + url,
            data: data,
            socket: socket,
            config: config || {},
            method: methodName
          });

          // apply interceptors
          angular.forEach(reversedInterceptors, function(interceptor) {
            if(interceptor.request || interceptor.requestError) {
              chain.unshift(interceptor.request, interceptor.requestError);
            }
            if(interceptor.response || interceptor.responseError) {
              chain.push(interceptor.response, interceptor.responseError);
            }
          });

          while(chain.length) {
            var thenFn = chain.shift();
            var rejectFn = chain.shift();

            promise = promise.then(thenFn, rejectFn);
          }

          // be $http compatible
          promise.success = function(fn) {
            promise.then(function(jwr) {
              fn(jwr.body, jwr.statusCode, headersGetter(jwr.headers), jwr);
            });
            return promise;
          };
          promise.error = function(fn) {
            promise.then(null, function(jwr) {
              fn(jwr.body, jwr.statusCode, headersGetter(jwr.headers), jwr);
            });
            return promise;
          };

          return promise;
        };
      }


      // Wrap events to ensure a $digest cycle
      function wrapEvent(eventName) {
        socket['legacy_' + eventName] = socket[eventName];
        socket[eventName] = function(event, cb) {
          if(cb !== null && angular.isFunction(cb)) {
            socket['legacy_' + eventName](event, function(result) {
              $rootScope.$evalAsync(cb.bind(socket, result));
            });
          }
        };
      }


      angular.forEach(provider.httpVerbs, promisify);
      angular.forEach(provider.eventNames, wrapEvent);


      /**
       * Update a model on sails pushes
       * @param {String} name       Sails model name
       * @param {Array} models      Array with model objects
       */
      socket.$modelUpdater = function(name, models) {

        socket.on(name, function(message) {
          var i;
          switch(message.verb) {

            case "created":
              // create new model item
              models.push(message.data);
              break;

            case "updated":
              var obj;
              for(i=0; i<models.length; i++) {
                if(models[i].id == message.id) {
                  obj = models[i];
                  break;
                }
              }

              // cant update if the angular-model does not have the item and the
              // sails message does not give us the previous record
              if(!obj && !message.previous) return;

              if(!obj) {
                // sails has given us the previous record, create it in our model
                obj = message.previous;
                models.push(obj);
              }

              // update the model item
              angular.extend(obj, message.data);
              break;

            case "destroyed":
              for(i = 0; i < models.length; i++) {
                if(models[i].id == message.id) {
                  models.splice(i, 1);
                  break;
                }
              }
              break;
          }
        });
      };

      return socket;
    }];
  });
}(angular, io));
