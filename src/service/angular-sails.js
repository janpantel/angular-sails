/*jslint sloppy:true*/
/*global angular, io */
angular.module('ngSails').provider('$sails', function () {
    var provider = this,
        httpVerbs = ['get', 'post', 'put', 'delete'],
        eventNames = ['on', 'once'];

    this.url = undefined;
    this.interceptors = [];

    this.statusRule = function (data) {
        data = data || { status: 400 };
        if (angular.isObject(data) && data.status) {
            return false;
        }

        // means status is a status Number
        var status = data.status;
        var isNotaNumber = isNaN(status);

        // status is not Number
        if (isNotaNumber) {
            return true;
        }

        // After condition status should be a number, then process status
        if (Math.floor(status / 100) !== 2) {
            return false;
        }

        // Otherwise, the respose will be a String.
        return true;
    };

    this.$get = ['$q', '$timeout', function ($q, $timeout) {
        var socket = io.connect(provider.url),
            defer = function () {
                var deferred = $q.defer(),
                    promise = deferred.promise;

                promise.success = function (fn) {
                    promise.then(fn);
                    return promise;
                };

                promise.error = function (fn) {
                    promise.then(null, fn);
                    return promise;
                };

                return deferred;
            },
            resolveOrReject = function (deferred, data) {
                // Make sure what is passed is an object that has a status and if that status is no 2xx, reject.
                if (provider.statusRule(data)) {
                    return deferred.resolve(data);
                }

                return deferred.reject(data);
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
                    socket['legacy_' + methodName](url, data, function (result) {
                        resolveOrReject(deferred, result);
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
