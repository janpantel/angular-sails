/*jslint sloppy:true*/
/*global angular, io */
angular.module('ngSails').provider('$sails', function () {
    var provider = this,
        httpVerbs = ['get', 'post', 'put', 'delete'],
        eventNames = ['on', 'once'];

    this.url = undefined;
    this.interceptors = [];
    this.responseHandler = undefined;

    this.$get = ['$q', '$timeout', function ($q, $timeout) {
        var socket = io.connect(provider.url),
            defer = function () {
                var deferred = $q.defer(),
                    promise = deferred.promise;

                promise.success = function (fn) {
                    promise.then(function(response) {
                        fn(response.data, response.status, response.headers);
                    });
                    return promise;
                };

                promise.error = function (fn) {
                    promise.then(null, function(response) {
                        fn(response.data, response.status, response.headers);
                    });
                    return promise;
                };

                return deferred;
            },
            resolveOrReject = this.responseHandler || function (deferred, response) {
                var jwr = response;

                // backward compatibility with older sails.io (no JWR)
                if(!(response instanceof Object && obj.constructor.name == "JWR")){
                    jwr = {
                        body: response,
                        headers: response.headers || {},
                        statusCode: response.statusCode || response.status
                    };
                }

                // angular $http returns the 'body' as 'data'.
                jwr.data = jwr.body;

                // angular $http returns the 'statusCode' as 'status'.
                jwr.status = jwr.statusCode;

                // TODO: map 'status'/'statusCode' to a 'statusText' to mimic angular $http

                if (jwr.error) {
                    deferred.reject(jwr);
                } else {
                    deferred.resolve(jwr);
                }
            },
            angularify = function (cb, data) {
                $timeout(function () {
                    cb(data);
                });
            },
            promisify = function (methodName) {
                socket['legacy_' + methodName] = socket[methodName];
                socket[methodName] = function (url, data, cb) {
                    var deferred = defer();
                    if (cb === undefined && angular.isFunction(data)) {
                        cb = data;
                        data = null;
                    }
                    deferred.promise.then(cb);
                    socket['legacy_' + methodName](url, data, function (emulatedHTTPBody, jsonWebSocketResponse) {
                        resolveOrReject(deferred, jsonWebSocketResponse || emulatedHTTPBody);
                    });
                    return deferred.promise;
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
