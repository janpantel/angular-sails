'use strict';

/* jshint newcap: false */
/* global headersGetter: true,
  mergeHeaders: true,
  arrIndexOf: true,
  isFile: true,
  isBlob: true
*/

angular.module('ngSails.$sails', ['ngSails.$sailsIo', 'ngSails.$sailsInterceptor'])
  .provider('$sails', $sails);

function $sails($sailsInterceptorProvider, $sailsIoProvider) {
  var provider = this;
  var httpVerbsWithData = ['post', 'put', 'patch'];

  provider.httpVerbs = $sailsIoProvider.httpVerbs = ['get', 'post', 'put', 'patch', 'delete', 'head'];
  provider.eventNames = $sailsIoProvider.eventNames = ['on', 'off', 'once'];
  provider.config = {
    transports: ['websocket', 'polling']
  };
  provider.debug = $sailsInterceptorProvider.debug = $sailsIoProvider.debug = false;

  provider.debugger = function(val) {
    provider.debug = $sailsInterceptorProvider.debug = $sailsIoProvider.debug = val;
  };

  provider.defaults = {
    transformResponse: [],
    transformRequest: [],
    headers: {} // TODO: what should the default default headers
  };

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

  this.$get = function($rootScope, $q, $log, $timeout, $sailsIo, $sailsInterceptor) {
    var socket = new $sailsIo(provider.socket || provider.url, provider.config);
    var socketFunctions = ['connect', 'disconnect', 'isConnected'];

    function $sails(config) {
      return $sails[config.method](config.url, config);
    }

    $sails._socket = socket;

    function exposeSocketFunction(fnName) {
      $sails[fnName] = socket[fnName].bind(socket);
    }

    function exposeVerbEndpoints(methodName) {

      $sails[methodName] = function(url, data, requestConfig) {
        var config = {
          method: methodName,
          transformRequest: provider.defaults.transformRequest,
          transformResponse: provider.defaults.transformResponse
        };

        requestConfig = requestConfig || {};

        // more compatible with $http method arguments
        if (arrIndexOf(httpVerbsWithData, methodName) === -1) {
          requestConfig = data || requestConfig;
          delete requestConfig.data;
        } else {
          requestConfig.data = data;
        }

        config = angular.extend({}, config, requestConfig);
        config.method = angular.uppercase(config.method || methodName);
        config.headers = mergeHeaders(config, provider.defaults.headers);
        config.url = (provider.urlPrefix || '') + (url || config.url);

        if (angular.isUndefined(config.withCredentials) && !angular.isUndefined(provider.defaults.withCredentials)) {
          config.withCredentials = provider.defaults.withCredentials;
        }

        var promise = $sailsInterceptor(socket[methodName].bind(socket), config);

        promise.success = function(fn) {
          promise.then(function(res) {
            fn(res.data, res.status, headersGetter(res.headers), res.config);
          });
          return promise;
        };

        promise.error = function(fn) {
          promise.then(null, function(res) {
            fn(res.data, res.status, headersGetter(res.headers), res.config);
          });
          return promise;
        };

        return promise;

      };
    }

    function exposeEventsEndpoitns(eventName) {
      $sails[eventName] = socket[eventName].bind(socket);
    }

    angular.forEach(provider.httpVerbs, exposeVerbEndpoints, this);
    angular.forEach(provider.eventNames, exposeEventsEndpoitns, this);
    angular.forEach(socketFunctions, exposeSocketFunction, this);

    /**
     * Update a model on sails pushes
     * @param {String} name       Sails model name
     * @param {Array} models      Array with model objects
     * @returns {Function}        Function to remove the model updater instance
     */
    $sails.$modelUpdater = function(name, models) {

      var update = function(message) {

        $rootScope.$evalAsync(function() {
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

      socket._socket.on(name, update);

      return function() {
        socket._socket.off(name, update);
      };
    };

    $sails.defaults = this.defaults;

    return $sails;
  };
}
