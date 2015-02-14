'use strict';

/* global isPromiseLike: true,
  headersGetter: true
*/
angular.module('ngSails.$sails', ['ngSails.$sailsIo', 'ngSails.$sailsInterceptor'])
  .provider('$sails', $sails);

function $sails($sailsInterceptorProvider, $sailsIoProvider) {
  var provider = this;

  provider.httpVerbs = $sailsIoProvider.httpVerbs = ['get', 'post', 'put', 'delete'];

  provider.eventNames = $sailsIoProvider.eventNames = ['on', 'off', 'once'];

  provider.url = undefined;

  provider.urlPrefix = '';

  provider.config = {
    transports: ['websocket', 'polling'],
    useCORSRouteToGetCookie: false
  };

  provider.debug = false;

  provider.interceptors = $sailsInterceptorProvider.interceptors = [
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
  this.$get = function($q, $log, $timeout, $sailsIo, $sailsInterceptor) {
    var io;
    var socket = (io.sails && io.sails.connect || io.connect)(provider.url, provider.config);
    var $sails = {};

    socket.connect = function(opts) {
      if (!(socket.isConnected && socket.isConnected() || !!socket.connected)) {
        var _opts = opts || {};
        _opts = angular.extend({}, provider.config, opts);

        // These are the options sails.io.js actually sets when making the connection.
        socket.useCORSRouteToGetCookie = _opts.useCORSRouteToGetCookie;
        socket.url = _opts.url || provider.url;
        socket.multiplex = _opts.multiplex;

        socket._connect();
      }
      return socket;
    };

    // Send the request using the socket
    function serverRequest(config) {
      var defer = $q.defer();
      if (provider.debug) $log.info('$sails ' + config.method + ' ' + config.url, config.data || '');

      if (config.timeout > 0) {
        $timeout(timeoutRequest, config.timeout);
      } else if (isPromiseLike(config.timeout)) {
        config.timeout.then(timeoutRequest);
      }

      socket['legacy_' + config.method.toLowerCase()](config, serverResponse);

      function timeoutRequest() {
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

        //TODO: more compatible with $http methods and config

        var _data = {
          url: provider.urlPrefix + url,
          data: data,
          socket: socket,
          config: config || {},
          method: methodName.toUpperCase()
        };

        return $sailsInterceptor(serverRequest, _data);

      };
    }

    /**
     * Update a model on sails pushes
     * @param {String} name       Sails model name
     * @param {Array} models      Array with model objects
     */
    socket.$modelUpdater = function(name, models) {

      socket.on(name, function(message) {
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

    return socket;
  };
}
