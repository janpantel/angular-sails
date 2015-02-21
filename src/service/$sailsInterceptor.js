'use strict';

/* global isPromiseLike: true,
  headersGetter: true
*/

angular.module('ngSails.$sailsInterceptor', [])
  .provider('$sailsInterceptor', $sailsInterceptor);

function $sailsInterceptor() {
  var provider = this;
  provider.interceptors = [];

  this.$get = function($injector, $q) {

    var reversedInterceptors = [];

    angular.forEach(provider.interceptors, function(interceptorFactory) {
      reversedInterceptors.unshift(angular.isString(interceptorFactory) ? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
    });

    var intercept = function(sendRequest, config) {
      var _sendRequest = sendRequest;

      if (isPromiseLike(sendRequest)) {
        _sendRequest = function() {
          return sendRequest;
        };
      }

      var chain = [transformRequest, undefined, _sendRequest, undefined, transformResponse, transformResponse];
      var promise = $q.when(config);

      angular.forEach(reversedInterceptors, function(interceptor) {
        if (interceptor.request || interceptor.requestError) {
          chain.unshift(interceptor.request, interceptor.requestError);
        }
        if (interceptor.response || interceptor.responseError) {
          chain.push(interceptor.response, interceptor.responseError);
        }
      });

      while (chain.length) {
        var thenFn = chain.shift();
        var rejectFn = chain.shift();

        promise = promise.then(thenFn, rejectFn);
      }

      return promise;
    };

    function transformRequest(config) {
      return angular.extend({}, config, {
        data: transformData(config.data, headersGetter(config.headers), config.transformRequest || [])
      });
    }

    function transformResponse(response) {
      var resp = angular.extend({}, response, {
        data: transformData(response.data, response.headers, response.config && response.config.transformResponse || [])
      });
      return (200 <= response.status && response.status < 300) ? resp : $q.reject(resp);
    }

    function transformData(data, headers, fns) {
      if (angular.isFunction(fns)){
        return fns(data, headers);
      }

      angular.forEach(fns, function(fn) {
        data = fn(data, headers);
      });

      return data;
    }

    return intercept;
  };
}
