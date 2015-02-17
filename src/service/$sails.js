'use strict';

/* jshint newcap: false */
/* global headersGetter: true,
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
    transports: ['websocket', 'polling'],
    useCORSRouteToGetCookie: false
  };
  provider.debug = $sailsInterceptorProvider.debug = $sailsIoProvider.debug = false;

  provider.debugger = function(val) {
    provider.debug = $sailsInterceptorProvider.debug = $sailsIoProvider.debug = val;
  };

  provider.defaults = {
      transformResponse: [],
      transformRequest: [],
      headers: {} // TODO: default headers
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

  this.$get = function($q, $log, $timeout, $sailsIo, $sailsInterceptor) {
    var socket = new $sailsIo(provider.url, provider.config);

    function $sails(config) {
      return $sails[config.method](config.url, config);
    }

    $sails._socket = socket;

    function exposeVerbEndpoints(methodName) {

      $sails[methodName] = function(url, data, requestConfig) {
        var config = {
          method: 'get',
          transformRequest: provider.defaults.transformRequest,
          transformResponse: provider.defaults.transformResponse,
          headers: {}// TODO: default headers
        };

        // more compatible with $http method arguments
        if (arrIndexOf(httpVerbsWithData, methodName) > -1) {
            requestConfig = data || requestConfig;
          delete requestConfig.data;
        } else {
            requestConfig.data = data;
        }

        angular.extend(config, requestConfig);
        config.url = (provider.urlPrefix || '') + (url || config.url);
        config.method = methodName.toUpperCase();

        var promise = $sailsInterceptor(socket[methodName], config);

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
      $sails[eventName] = socket[eventName];
    }

    angular.forEach(provider.httpVerbs, exposeVerbEndpoints, this);
    angular.forEach(provider.eventNames, exposeEventsEndpoitns, this);

    /**
     * Update a model on sails pushes
     * @param {String} name       Sails model name
     * @param {Array} models      Array with model objects
     */
    $sails.$modelUpdater = function(name, models) {

      socket.on(name, function(message) {
        var i;

        if (provider.debug) {
          $log.info('$sails ' + name + ' model ' + message.verb + ' id: ' + message.id, message.data);
        }

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

    $sails.defaults = this.defaults;

    return $sails;
  };
}
