/*jslint sloppy:true*/
/*global angular, io */
angular.module('ngSails.$sailsInterceptor', []).provider('$sailsInterceptor', function () {

    var interceptorFactories = this.interceptors = [];
    var responseInterceptorFactories = this.responseInterceptors = [];

    this.$get = ['$q', '$timeout', '$injector', function ($q, $timeout, $injector) {

        var reversedInterceptors = [];

        angular.forEach(interceptorFactories, function (interceptorFactory) {
            reversedInterceptors.unshift(angular.isString(interceptorFactory)
                ? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
        });

        angular.forEach(responseInterceptorFactories, function (interceptorFactory, index) {
            var responseFn = angular.isString(interceptorFactory)
                ? $injector.get(interceptorFactory)
                : $injector.invoke(interceptorFactory);

            reversedInterceptors.splice(index, 0, {
                response: function (response) {
                    return responseFn($q.when(response));
                },
                responseError: function (response) {
                    return responseFn($q.reject(response));
                }
            });
        });

        var intercept = function (sendRequest, config) {

            var chain = [sendRequest, undefined];
            var promise = $q.when(config);


            angular.forEach(reversedInterceptors, function (interceptor) {
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

        return intercept;
    }];
});
