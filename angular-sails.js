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

    ngSailsModule.service('$sails', ['$q', function ($q) {

        var socket = io.connect(),
            connected = false,
            reconnectAttempt = null;

        socket.on('connect', function () {
            connected = true;
            if (typeof reconnectAttempt === 'function') {
                reconnectAttempt();
                reconnectAttempt = null;
            }
        });
        socket.on('disconnect', function () {
            connected = false;
        });
        
        function defer() {
            var deferred = $q.defer(),
                promise = deferred.promise;
            
            promise.success = function (fn) {
                promise.then(function (response) {
                    fn(response);
                });
                return promise;
            };

            // Not sure this could ever happen... sails.io is currently handling errors, and we never reject below.
            promise.error = function (fn) {
                promise.then(null, function (response) {
                    fn(response);
                });
                return promise;
            };

            return deferred;
        }

        return {
            reconnect: function (url, options) {
                var exec = function () {
                    socket.disconnect();
                    if (socket.socket !== undefined) {
                        socket.socket.connect(url, options);
                    }
                };
                //If we are connected, we can execute the reconnect right away.
                //If we are not, we queue it up, to execute it during to connect event occured.
                if (connected === true) {
                    exec();
                } else {
                    reconnectAttempt = exec;
                }

            },
            disconnect: function () {
                socket.disconnect();
            },
            emit: function (event, data) {
                socket.emit(event, data);
            },
            on: function (event, cb) {
                var deferred = defer();
                deferred.promise.then(cb);
                socket.on(event, function () {
                    deferred.resolve.apply(socket, arguments);
                });
                return deferred.promise;
            },
            get: function (url, data, cb) {
                var deferred = defer();
                if (cb === undefined && typeof data === 'function') {
                    cb = data;
                    data = null;
                }
                deferred.promise.then(cb);
                socket.get(url, data, function () {
                    deferred.resolve.apply(socket, arguments);
                });
                return deferred.promise;
            },
            post: function (url, data, cb) {
                var deferred = defer();
                if (cb === undefined && typeof data === 'function') {
                    cb = data;
                    data = null;
                }
                deferred.promise.then(cb);
                socket.post(url, data, function () {
                    deferred.resolve.apply(socket, arguments);
                });
                return deferred.promise;
            },
            put: function (url, data, cb) {
                var deferred = defer();
                if (cb === undefined && typeof data === 'function') {
                    cb = data;
                    data = null;
                }
                deferred.promise.then(cb);
                socket.put(url, data, function () {
                    deferred.resolve.apply(socket, arguments);
                });
                return deferred.promise;
            },
            'delete': function (url, data, cb) {
                var deferred = defer();
                if (cb === undefined && typeof data === 'function') {
                    cb = data;
                    data = null;
                }
                deferred.promise.then(cb);
                socket['delete'](url, data, function () {
                    deferred.resolve.apply(socket, arguments);
                });
                return deferred.promise;
            }
        };
        
    }]);

}(angular, io));
