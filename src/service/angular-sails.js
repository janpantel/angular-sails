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
        this.$get = ['$q', '$timeout', function ($q, $timeout) {

            var socket = io.connect();
    
            function defer() {
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
            }
    
            function resolveOrReject(deferred, data) {
                // Make sure what is passed is an object that has a status and if that status is no 2xx, reject.
                if (data && angular.isObject(data) && data.status && Math.floor(data.status / 100) !== 2) {
                    deferred.reject(data);
                } else {
                    deferred.resolve(data);
                }
            }
    
            return {
                disconnect: function () {
                    socket.disconnect();
                },
                emit: function (event, data) {
                    socket.emit(event, data);
                },
                on: function (event, cb) {
                    if (cb !== undefined && angular.isFunction(cb)) {
                        socket.on(event, function (result) {
                            $timeout(function () {
                                cb(result);
                            });
                        });
                    }
                },
                once: function (event, cb) {
                    if (cb !== undefined && angular.isFunction(cb)) {
                        socket.once(event, function (result) {
                            $timeout(function () {
                                cb(result);
                            });
                        });
                    }
                },
                off: function (event) {
                    socket.removeAllListeners(event);
                },
                get: function (url, data, cb) {
                    var deferred = defer();
                    if (cb === undefined && angular.isFunction(data)) {
                        cb = data;
                        data = null;
                    }
                    deferred.promise.then(cb);
                    socket.get(url, data, function (result) {
                        resolveOrReject(deferred, result);
                    });
                    return deferred.promise;
                },
                post: function (url, data, cb) {
                    var deferred = defer();
                    if (cb === undefined && angular.isFunction(data)) {
                        cb = data;
                        data = null;
                    }
                    deferred.promise.then(cb);
                    socket.post(url, data, function (result) {
                        resolveOrReject(deferred, result);
                    });
                    return deferred.promise;
                },
                put: function (url, data, cb) {
                    var deferred = defer();
                    if (cb === undefined && angular.isFunction(data)) {
                        cb = data;
                        data = null;
                    }
                    deferred.promise.then(cb);
                    socket.put(url, data, function (result) {
                        resolveOrReject(deferred, result);
                    });
                    return deferred.promise;
                },
                'delete': function (url, data, cb) {
                    var deferred = defer();
                    if (cb === undefined && angular.isFunction(data)) {
                        cb = data;
                        data = null;
                    }
                    deferred.promise.then(cb);
                    socket['delete'](url, data, function (result) {
                        resolveOrReject(deferred, result);
                    });
                    return deferred.promise;
                }
            };
        }];
    });

}(angular, io));
