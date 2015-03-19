/*global angular, io */
(function(angular, io) {
    'use strict';
    if(io.sails){
      io.sails.autoConnect = false;
    }

    // copied from angular
    function parseHeaders(headers) {
        var parsed = {},
            key, val, i;
        if (!headers) return parsed;
        angular.forEach(headers.split('\n'), function(line) {
            i = line.indexOf(':');
            key = lowercase(trim(line.substr(0, i)));
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

    function isPromiseLike (obj){
        return obj && angular.isFunction(obj.then);
    }

    // copied from angular
    function headersGetter(headers) {
        var headersObj = angular.isObject(headers) ? headers : undefined;
        return function(name) {
            if (!headersObj) headersObj = parseHeaders(headers);
            if (name) {
                var value = headersObj[lowercase(name)];
                if (value === void 0) {
                    value = null;
                }
                return value;
            }
            return headersObj;
        };
    }

    angular.module('ngSails').provider('$sails', function() {
        var provider = this;

        this.httpVerbs = ['get', 'post', 'put', 'delete'];

        this.eventNames = ['on', 'off'];

        this.url = undefined;

        this.urlPrefix = '';

        this.config = {
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
                    requestError: function(rejection) {},
                    responseError: function(rejection) {}
                };
            }*/
        ];

        /*@ngInject*/
        this.$get = function($q, $injector, $rootScope, $log, $timeout) {
            var socket = (io.sails && io.sails.connect || io.connect)(provider.url, provider.config);

            socket.connect = function(opts){
                if(!socket.isConnected()){
                    var _opts = opts||{};
                    _opts = angular.extend({},provider.config,opts);

                    // These are the options sails.io.js actually sets when making the connection.
                    socket.useCORSRouteToGetCookie = _opts.useCORSRouteToGetCookie;
                    socket.url = _opts.url || provider.url;
                    socket.multiplex = _opts.multiplex;

                    socket._connect();
                }
                return socket;
            };

            // TODO: separate out interceptors into its own file (and provider?).
            // build interceptor chain
            var reversedInterceptors = [];
            angular.forEach(interceptorFactories, function(interceptorFactory) {
                reversedInterceptors.unshift(
                    angular.isString(interceptorFactory) ?
                    $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory)
                );
            });

            // Send the request using the socket
            function serverRequest(config) {
                var defer = $q.defer();
                if (provider.debug) $log.info('$sails ' + config.method + ' ' + config.url, config.data || '');

                if (config.timeout > 0) {
                    $timeout(timeoutRequest, config.timeout);
                } else if (isPromiseLike(config.timeout)) {
                    config.timeout.then(timeoutRequest);
                }

                socket['legacy_' + config.method.toLowerCase()](config.url, config.data, serverResponse);

                function timeoutRequest(){
                    serverResponse(null);
                }

                function serverResponse(result, jwr) {

                    if (!jwr) {
                        jwr = {
                            body: result,
                            headers: result.headers || {},
                            statusCode: result.statusCode || result.status || 0,
                            error: (function() {
                                if (this.statusCode < 200 || this.statusCode >= 400) {
                                    return this.body || this.statusCode;
                                }
                            })()
                        };
                    }

                    jwr.data = jwr.body; // $http compat
                    jwr.status = jwr.statusCode; // $http compat
                    jwr.socket = socket;
                    jwr.url = config.url;
                    jwr.method = config.method;
                    jwr.config = config.config;
                    if (jwr.error) {
                        if (provider.debug) $log.warn('$sails response ' + jwr.statusCode + ' ' + config.url, jwr);
                        defer.reject(jwr);
                    } else {
                        if (provider.debug) $log.info('$sails response ' + config.url, jwr);
                        defer.resolve(jwr);
                    }
                }

                return defer.promise;
            }

            function promisify(methodName) {
                socket['legacy_' + methodName] = socket[methodName];

                socket[methodName] = function(url, data, config) {

                    var chain = [serverRequest, undefined];

                    //TODO: more compatible with $http methods and config

                    var promise = $q.when({
                        url: provider.urlPrefix + url,
                        data: data,
                        socket: socket,
                        config: config || {},
                        method: methodName.toUpperCase()
                    });

                    // apply interceptors
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

            function wrapEvent(eventName) {
                if(socket[eventName] || socket._raw && socket._raw[eventName]){
                    socket['legacy_' + eventName] = socket[eventName] || socket._raw[eventName];
                    socket[eventName] = function(event, cb) {
                        if (cb !== null && angular.isFunction(cb)) {
                            socket['legacy_' + eventName](event, function(result) {
                                $rootScope.$evalAsync(cb.bind(socket, result));
                            });
                        }
                    };
                }
            }

            // sails.io.js doesn't have `once`, need to access it through `._raw`
            socket.once = function(event, cb){
              if (cb !== null && angular.isFunction(cb)) {
                if(socket._raw){
                  socket._raw.once(event, function(result) {
                      $rootScope.$evalAsync(cb.bind(socket, result));
                  });
                }
              }
            };

            angular.forEach(provider.httpVerbs, promisify);
            angular.forEach(provider.eventNames, wrapEvent);


            /**
             * Update a model on sails pushes
             * @param {String} name       Sails model name
             * @param {Array} models      Array with model objects
             */
            socket.$modelUpdater = function(name, models) {

                var update = function(message) {

                    $rootScope.$evalAsync(function(){
                        var i;

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

                socket.legacy_on(name, update);

                return function(){
                    socket.legacy_off(name, update);
                };
            };

            return socket;
        };
    });
}(angular, io));
