/*jslint sloppy:true*/
/*global angular, io */
angular.module('ngSails.$sails', ['ngSails.$sailsInterceptor']).provider('$sails', ['$sailsInterceptorProvider', function ($sailsInterceptorProvider) {
    var provider = this,
        httpVerbs = ['get', 'post', 'put', 'delete'],
        eventNames = ['on', 'once'];

    this.url = undefined;

    this.interceptors = $sailsInterceptorProvider.interceptors;
    this.responseInterceptors = $sailsInterceptorProvider.responseInterceptors;

    this.$get = ['$q', '$timeout', '$sailsInterceptor', function ($q, $timeout, $sailsInterceptor) {

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

                    // The request needs to be built in this scope as the socket is in this scope.
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

                    var promise = $sailsInterceptor(sendRequest, {url: url, data: data});

                    // Call the callback that was passed as an argument
                    promise = promise.then(cb, null);

                    // Set up success chaining on the returned promise
                    promise.success = function (fn) {
                        promise.then(fn);
                        return promise;
                    };

                    // Set up error chaining on the returned promise
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
}]);
