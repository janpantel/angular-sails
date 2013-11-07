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

    ngSailsModule.service('$sails', ['$rootScope', function ($rootScope) {

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
                socket.on(event, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        cb.apply(socket, args);
                    });
                });
            },
            get: function (url, cb) {
                socket.get(url, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        cb.apply(socket, args);
                    });
                });
            },
            post: function (url, data, cb) {
                socket.post(url, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        cb.apply(socket, args);
                    });
                });
            },
            put: function (url, data, cb) {
                socket.put(url, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        cb.apply(socket, args);
                    });
                });
            },
            delete: function (url, data, cb) {
                socket.delete(url, data, function () {
                    var args = arguments;
                    $rootScope.$apply(function () {
                        cb.apply(socket, args);
                    });
                });
            }
        };
    }]);

}(angular, io));