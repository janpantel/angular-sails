/*
 * This file is distributed under the MIT license.
 *
 * (c) Jan-Oliver Pantel <info@janpantel.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/*global angular, io */

(function (angular, io) {
    'use strict';
    var ngSailsModule = angular.module('ngSails', []);

    ngSailsModule.provider('$sails', function () {
        var provider = this;

        this.url = undefined;
        this.interceptors = [];

        this.$get = ['$q', '$timeout', function ($q, $timeout) {
            var socket = io.connect(provider.url),
                defer = function () {
                    var deferred = $q.defer(),
                        promise = deferred.promise;
    
                    promise.success = function (fn) {
                        promise.then(function (response) {
                            fn(response);
                        });
                        return promise;
                    };
    
                    promise.error = function (fn) {
                        promise.then(null, function (response) {
                            fn(response);
                        });
                        return promise;
                    };
    
                    return deferred;
                },
                resolveOrReject = function (deferred, data) {
                    // Make sure what is passed is an object that has a status and if that status is no 2xx, reject.
                    if (data && angular.isObject(data) && data.status && Math.floor(data.status / 100) !== 2) {
                        deferred.reject(data);
                    } else {
                        deferred.resolve(data);
                    }
                },
                angularify = function (cb, data) {
                    $timeout(function () {
                        cb(data);
                    });
                };

            socket.legacy_get = socket.get;
            socket.legacy_post = socket.post;
            socket.legacy_put = socket.put;
            socket.legacy_delete = socket['delete'];
            socket.legacy_on = socket.on;
            socket.legacy_once = socket.once;

            socket.get = function (url, data, cb) {
                var deferred = defer();
                if (cb === undefined && angular.isFunction(data)) {
                    cb = data;
                    data = null;
                }
                deferred.promise.then(cb);
                socket.legacy_get(url, data, function (result) {
                    resolveOrReject(deferred, result);
                });
                return deferred.promise;
            };
            socket.post = function (url, data, cb) {
                var deferred = defer();
                if (cb === undefined && angular.isFunction(data)) {
                    cb = data;
                    data = null;
                }
                deferred.promise.then(cb);
                socket.legacy_post(url, data, function (result) {
                    resolveOrReject(deferred, result);
                });
                return deferred.promise;
            };
            socket.put = function (url, data, cb) {
                var deferred = defer();
                if (cb === undefined && angular.isFunction(data)) {
                    cb = data;
                    data = null;
                }
                deferred.promise.then(cb);
                socket.legacy_put(url, data, function (result) {
                    resolveOrReject(deferred, result);
                });
                return deferred.promise;
            };
            socket['delete'] = function (url, data, cb) {
                var deferred = defer();
                if (cb === undefined && angular.isFunction(data)) {
                    cb = data;
                    data = null;
                }
                deferred.promise.then(cb);
                socket.legacy_delete(url, data, function (result) {
                    resolveOrReject(deferred, result);
                });
                return deferred.promise;
            };
            socket.on = function (event, cb) {
                if (cb !== undefined && angular.isFunction(cb)) {
                    socket.legacy_on(event, function (result) {
                        angularify(cb, result);
                    });
                }
            };
            socket.once = function (event, cb) {
                if (cb !== undefined && angular.isFunction(cb)) {
                    socket.legacy_once(event, function (result) {
                        angularify(cb, result);
                    });
                }
            };

            return socket;
        }];
    });

}(angular, io));
