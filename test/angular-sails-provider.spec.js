describe('Agnular Sails provider', function() {

    var spy,
    requestSpy,
    responseSpy,
    requestErrorSpy,
    responseErrorSpy;
    methods = ['get', 'post', 'put', 'delete'],
    response = {
        success: {
            body: 'Success!',
            statusCode: 200
        },
        error: {
            body: 'Error!',
            statusCode: 500
        }
    };

    beforeEach(function(){
        spy = sinon.spy();
        requestSpy = sinon.spy();
        responseSpy = sinon.spy();
        requestErrorSpy = sinon.spy();
        responseErrorSpy = sinon.spy();
        socketRequestSpy = sinon.spy();
    });

    describe('interceptors', function() {

        describe('', function(){

            var $sailsProvider,
                $scope,
                $sails,
                mockIoSocket;

            beforeEach(module('ngSails',function(_$sailsProvider_){
                $sailsProvider = _$sailsProvider_;

                $sailsProvider.interceptors.push(function($q){
                    return {
                        request: function(config){
                            requestSpy();
                            return config;
                        },
                        response: function(response){
                            responseSpy();
                            return response;
                        },
                        requestError: function(rejection){
                            requestErrorSpy();
                            return $q.reject(rejection);
                        },
                        responseError: function(rejection){
                            responseErrorSpy();
                            return $q.reject(rejection);
                        }
                    };
                });
            }));

            beforeEach(inject(function(_$rootScope_, _$sails_) {
                $scope = _$rootScope_;
                $sails = _$sails_;
                mockIoSocket = $sails._raw;

                mockIoSocket.on('get', function(ctx, cb){
                    socketRequestSpy();
                    cb(response[ctx.url]);
                });
            }));

            it('should call request callback before socket request', function () {
                $sails.get('success');
                $scope.$digest();

                expect(requestSpy).to.have.been.calledOnce;
                expect(requestSpy).to.have.been.calledBefore(socketRequestSpy);

            });

            it('should call response callback after socket request, before callback', function () {
                $sails.get('success')['finally'](spy);
                $scope.$digest();

                expect(responseSpy).to.have.been.calledOnce;
                expect(responseSpy).to.have.been.calledAfter(socketRequestSpy);
                expect(responseSpy).to.have.been.calledBefore(spy);

            });


            it('should call errorResponse callback after socket request, before callback', function () {
                $sails.get('error')['finally'](spy);
                $scope.$digest();

                expect(responseErrorSpy).to.have.been.calledOnce;
                expect(responseErrorSpy).to.have.been.calledAfter(socketRequestSpy);
                expect(responseErrorSpy).to.have.been.calledBefore(spy);

            });


        });

        describe('', function(){

            it('should not make socket request when request is rejected', function () {

                module('ngSails',function($sailsProvider){
                    $sailsProvider.interceptors.push(function($q){
                        return {
                            request: function(config){
                                return $q.reject('rejected');
                            }
                        };
                    });
                });

                inject(function($rootScope, $sails) {
                    $sails._raw.on('get', function(ctx, cb){
                        socketRequestSpy();
                        cb(response[ctx.url]);
                    });

                    $sails.get('success');
                    $rootScope.$digest();

                    expect(socketRequestSpy).to.have.been.not.called;
                });

            });

            it('should call error callback when response is rejected', function () {

                module('ngSails',function($sailsProvider){
                    $sailsProvider.interceptors.push(function($q){
                        return {
                            response: function(config){
                                return $q.reject('rejected');
                            }
                        };
                    });
                });

                inject(function($rootScope, $sails) {
                    var errorSpy = sinon.spy();
                    $sails._raw.on('get', function(ctx, cb){
                        socketRequestSpy();
                        cb(response[ctx.url]);
                    });

                    $sails.get('success').then(errorSpy, spy);
                    $rootScope.$digest();

                    expect(errorSpy).to.have.been.not.called;
                    expect(spy).to.have.been.calledOnce;
                });

            });

            it('should pass request config', function () {

                module('ngSails',function($sailsProvider){
                    $sailsProvider.interceptors.push(function($q){
                        return {
                            request: function(config){
                                expect(config.url).to.equal('success');
                                expect(config.method).to.equal('POST');
                                expect(config.data).to.deep.equal({value: true})
                                spy();
                                return config;
                            }
                        };
                    });
                });

                inject(function($rootScope, $sails) {
                    var errorSpy = sinon.spy();
                    $sails._raw.on('post', function(ctx, cb){
                        socketRequestSpy();
                        cb(response[ctx.url]);
                    });

                    $sails.post('success',{value: true});
                    $rootScope.$digest();

                    expect(spy).to.have.been.calledOnce;
                });

            });

            it('should allow manipulation of request', function () {

                module('ngSails',function($sailsProvider){
                    $sailsProvider.interceptors.push(function($q){
                        return {
                            request: function(config){
                                config.url = 'success';
                                config.method = 'POST';
                                config.data = {value: true};
                                return config;
                            }
                        };
                    });
                });

                inject(function($rootScope, $sails) {
                    var errorSpy = sinon.spy();
                    $sails._raw.on('post', function(ctx, cb){
                        expect(ctx.method).to.equal('post');
                        expect(ctx.url).to.equal('success');
                        expect(ctx.data).to.deep.equal({value: true});
                        socketRequestSpy();
                        cb(response[ctx.url]);
                    });

                    $sails.get('error', {value: false});
                    $rootScope.$digest();

                    expect(socketRequestSpy).to.have.been.calledOnce;
                });

            });

            it('should verify order of execution', function() {
                var outerReq = sinon.spy(),
                outerRes = sinon.spy(),
                innerReq = sinon.spy(),
                innerRes = sinon.spy();
                module('ngSails',function($sailsProvider){
                    $sailsProvider.interceptors.push(function() {
                        return {
                            request: function(config) {
                                config.url += 'Outer';
                                outerReq();
                                return config;
                            },
                            response: function(response) {
                                response.data = '{' + response.data + '} outer';
                                outerRes();
                                return response;
                            }
                        };
                    });
                    $sailsProvider.interceptors.push(function() {
                        return {
                            request: function(config) {
                                config.url += 'Inner';
                                innerReq();
                                return config;
                            },
                            response: function(response) {
                                response.data = '{' + response.data + '} inner';
                                innerRes();
                                return response;
                            }
                        };
                    });
                });

                inject(function($rootScope, $sails) {
                    $sails._raw.on('get', function(ctx, cb){
                        cb(response.success);
                    });

                    $sails.get('success').then(function(res){
                        expect(res.method).to.equal('GET');
                        expect(res.url).to.equal('successOuterInner');
                        expect(res.data).to.equal('{{Success!} inner} outer');
                        spy()
                    });
                    $rootScope.$digest();

                    expect(spy).to.have.been.calledOnce;
                    expect(outerReq).to.have.been.calledBefore(innerReq);
                    expect(innerRes).to.have.been.calledBefore(outerRes);
                });
            });

        });

    });

});
