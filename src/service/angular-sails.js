/*jslint sloppy:true*/
/*global angular, io */
angular.module('ngSails', []).provider('$sails', function () {
    var provider = this,
        httpVerbs = ['get', 'post', 'put', 'delete'],
        eventNames = ['on', 'once'];

    this.url = undefined;
    var interceptorFactories = this.interceptors = [];
    var responseInterceptorFactories = this.responseInterceptors = [];

    this.$get = ['$q', '$timeout', '$injector', function ($q, $timeout, $injector) {

        var reversedInterceptors = [];

        angular.forEach(interceptorFactories, function (interceptorFactory) {
            reversedInterceptors.unshift(angular.isString(interceptorFactory)
                ? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
        });

        angular.forEach(responseInterceptorFactories, function (interceptorFactory, index) {
            var responseFn = angular.isString(interceptorFactory)
                ? $injector.get(interceptorFactory)
                : $injector.invoke(interceptorFactory);

            reversedInterceptors.splice(index, 0, {
                response: function (response) {
                    return responseFn($q.when(response));
                },
                responseError: function (response) {
                    return responseFn($q.reject(response));
                }
            });
        });

        var socket = io.connect(provider.url),
            angularify = function (cb, data) {
                $timeout(function () {
                    cb(data);
                });
            },
            promisify = function (methodName) {
                socket['legacy_' + methodName] = socket[methodName];
                socket[methodName] = function (url, data, cb) {
                    if (cb === undefined && angular.isFunction(data)) {
                        cb = data;
                        data = null;
                    }

                    function sendRequest(config) {
                        var deferred = $q.defer();

                        socket['legacy_' + methodName](config.url, config.data, function (data) {
                            if (data && angular.isObject(data) && data.status && Math.floor(data.status / 100) !== 2) {
                                deferred.reject(data);
                            } else {
                                deferred.resolve(data);
                            }
                        });

                        return deferred.promise;
                    }

                    var chain = [sendRequest, undefined];
                    var promise = $q.when({url: url, data: data, cb: cb});


                    angular.forEach(reversedInterceptors, function (interceptor) {
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

                    promise.then(cb, null);

                    promise.success = function (fn) {
                        promise.then(fn);
                        return promise;
                    };

                    promise.error = function (fn) {
                        promise.then(null, fn);
                        return promise;
                    };

                    return promise;
                };
            },
            wrapEvent = function (eventName) {
                socket['legacy_' + eventName] = socket[eventName];
                socket[eventName] = function (event, cb) {
                    if (cb !== null && angular.isFunction(cb)) {
                        socket['legacy_' + eventName](event, function (result) {
                            angularify(cb, result);
                        });
                    }
                };
            };

        angular.forEach(httpVerbs, promisify);
        angular.forEach(eventNames, wrapEvent);

        return socket;
    }];
});
