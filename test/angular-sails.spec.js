describe('Agnular Sails', function() {

    var $scope,
        $compile,
        $timeout,
        $sails,
        mockIoSocket,
        spy,
        methods = ['get', 'post', 'put', 'delete'],
        response = {
            success: {
                body: 'Success!',
                statusCode: 200
            },
            error: {
                body: 'Error!',
                statusCode: 500
            },
            fallbacksuccess: {
                message: 'Success!',
                status: 200 // previously we looked for 'status'
            },
            fallbackerror: {
                message: 'Error!',
                status: 500 // previously we looked for 'status'
            }
        };

    beforeEach(module('ngSails'));

    beforeEach(inject(function(_$rootScope_, _$compile_, _$timeout_, _$sails_) {
        $scope = _$rootScope_.$new();
        $compile = _$compile_;
        $timeout = _$timeout_;
        $sails = _$sails_;
        mockIoSocket = $sails._raw;
        spy = sinon.spy();
    }));

    describe('on', function() {

        it('should apply asynchronously', function () {
            $sails.on('event', spy);
            mockIoSocket.emit('event');

            expect(spy).to.have.been.not.called;
            $timeout.flush();

            expect(spy).to.have.been.calledOnce;
        });

    });

    describe('once', function () {

        it('should apply asynchronously', function () {
            $sails.once('event', spy);

            mockIoSocket.emit('event');

            expect(spy).to.have.been.not.called;
            $timeout.flush();

            expect(spy).to.have.been.calledOnce;
        });

        it('should only run once', function () {
            var counter = 0;
            $sails.once('event', spy);

            mockIoSocket.emit('event');
            mockIoSocket.emit('event');
            $timeout.flush();

            expect(spy).to.have.been.calledOnce;
        });

    });

    methods.forEach(function(method){

        describe(method, function() {

            it('should return a promise', function () {
                var promise = $sails[method]('test');

                expect(promise['finally']).to.be.a('function');
                expect(promise.then).to.be.a('function');
                expect(promise.success).to.be.a('function');
                expect(promise.error).to.be.a('function');

            });

            it('should return chainable success()', function () {
                var promise = $sails[method]('test').success();

                expect(promise['finally']).to.be.a('function');
                expect(promise.then).to.be.a('function');
                expect(promise.success).to.be.a('function');
                expect(promise.error).to.be.a('function');

            });

            it('should return chainable error()', function () {
                var promise = $sails[method]('test').error();

                expect(promise['finally']).to.be.a('function');
                expect(promise.then).to.be.a('function');
                expect(promise.success).to.be.a('function');
                expect(promise.error).to.be.a('function');

            });

            describe('response', function(){

                var errorSpy;

                beforeEach(function() {
                    mockIoSocket.on([method], function(ctx, cb){
                        cb(response[ctx.url]);
                    });
                    errorSpy = sinon.spy();
                });

                it('should resolve successes', function () {

                    $sails[method]('success').then(spy, errorSpy);
                    $scope.$digest();

                    expect(errorSpy).to.have.been.not.called;
                    expect(spy).to.have.been.calledOnce;
                });

                it('should reject errors', function () {

                    $sails[method]('error').then(errorSpy, spy);
                    $scope.$digest();

                    expect(errorSpy).to.have.been.not.called;
                    expect(spy).to.have.been.calledOnce;
                });

                it('should resolve successes with jwr fallback', function () {

                    $sails[method]('fallbacksuccess').then(spy, errorSpy);
                    $scope.$digest();

                    expect(errorSpy).to.have.been.not.called;
                    expect(spy).to.have.been.calledOnce;
                });

                it('should reject errors with jwr fallback', function () {

                    $sails[method]('fallbackerror').then(errorSpy, spy);
                    $scope.$digest();

                    expect(errorSpy).to.have.been.not.called;
                    expect(spy).to.have.been.calledOnce;
                });

                it('should call success for successes', function () {

                    $sails[method]('success').success(spy).error(errorSpy);
                    $scope.$digest();

                    expect(errorSpy).to.have.been.not.called;
                    expect(spy).to.have.been.calledOnce;
                });

                it('should call error for errors', function () {

                    $sails[method]('error').success(errorSpy).error(spy);
                    $scope.$digest();

                    expect(errorSpy).to.have.been.not.called;
                    expect(spy).to.have.been.calledOnce;
                });

            });

        });
    });
});
