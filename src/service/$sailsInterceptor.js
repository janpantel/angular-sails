'use strict';

/*global headersGetter: true */

angular.module('ngSails.$sailsInterceptor', [])
  .provider('$sailsInterceptor', $sailsInterceptor);

function $sailsInterceptor() {
  var provider = this;
  provider.interceptors = [];

  this.$get = function($injector, $q) {

    var reversedInterceptors = [];

    angular.forEach(provider.interceptorFactories, function(interceptorFactory) {
      reversedInterceptors.unshift(angular.isString(interceptorFactory) ? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
    });

    var intercept = function(sendRequest, config) {

      var chain = [sendRequest, undefined];
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

      promise.success = function(fn) {
        promise.then(function(jwr) {
          fn(jwr.body, jwr.statusCode, headersGetter(jwr.headers), jwr);
        });
        return promise;
      };
      promise.error = function(fn) {
        promise.then(null, function(jwr) {
          fn(jwr.body, jwr.statusCode, headersGetter(jwr.headers), jwr);
        });
        return promise;
      };

      return promise;
    };

    return intercept;
  };
}
