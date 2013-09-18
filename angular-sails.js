/*
 * This file is distributed under the MIT license.
 *
 * (c) Jan-Oliver Pantel <info@janpantel.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function (angular) {
    var ngSailsModule = angular.module('ngSails', []);

    ngSailsModule.provider('$sails', $SailsProvider);

    function $SailsProvider() {

        var socket = io.connect();

        this.$get = function ($rootScope) {
            return {
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
        }
    };
}(angular));