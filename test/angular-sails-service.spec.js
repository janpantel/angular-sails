describe('Agnular Sails service', function() {

    var $scope,
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
        }
    };

    beforeEach(module('ngSails'));

    beforeEach(inject(function(_$rootScope_, _$sails_) {
        $scope = _$rootScope_;
        $sails = _$sails_;
        mockIoSocket = $sails._raw;
        spy = sinon.spy();
    }));

    describe('connection', function() {

        it('should be able to connect and disconnect', function () {

            expect($sails.isConnected()).to.be.true();

            $sails.disconnect();

            expect($sails.isConnected()).to.be.false();

            $sails.connect();

            expect($sails.isConnected()).to.be.true();

            $sails.disconnect();

            expect($sails.isConnected()).to.be.false();

            $sails.connect();

            expect($sails.isConnected()).to.be.true();
        });


        it('should queue up requests', function () {
            var getSpy = sinon.spy(),
            postSpy = sinon.spy(),
            getCbSpy = sinon.spy(),
            postCbSpy = sinon.spy();

            $sails.disconnect();

            mockIoSocket.on('get', function(ctx, cb){
                getSpy();
                cb(response[ctx.url]);
            });
            mockIoSocket.on('post', function(ctx, cb){
                postSpy();
                cb(response[ctx.url]);
            });

            $sails.get('success').then(getCbSpy);
            $sails.post('success').then(postCbSpy);

            $scope.$digest();

            expect(getSpy).to.have.been.not.called;
            expect(postSpy).to.have.been.not.called;
            expect(getCbSpy).to.have.been.not.called;
            expect(postCbSpy).to.have.been.not.called;

            $sails.connect();

            /* TODO: Someone determine how to test this
            Because `$sails.connect()` automatically runs the queued calls on the new socket,
            We cannot grab the other end of the new socket to watch for the calls and respond
            to the calls....  This makes this really hard to test. In fact, from what I can
            tell impossible to test.
            */
            // mockIoSocket = $sails._raw;
            //
            // mockIoSocket.on('get', function(ctx, cb){
            //     getSpy();
            //     cb(response[ctx.url]);
            // });
            // mockIoSocket.on('post', function(ctx, cb){
            //     postSpy();
            //     cb(response[ctx.url]);
            // });
            //
            // $scope.$digest();
            //
            // expect(getSpy).to.have.been.calledOnce;
            // expect(postSpy).to.have.been.calledOnce;
            // expect(getCbSpy).to.have.been.calledOnce;
            // expect(postCbSpy).to.have.been.calledOnce;
        });

    });


    describe('on', function() {

        it('should apply asynchronously', function () {
            var eventHandler = $sails.on('event', spy);
            mockIoSocket.emit('event');

            expect(spy).to.have.been.not.called;
            $scope.$digest();

            expect(spy).to.have.been.calledOnce;
            
            $sails.off('event', eventHandler);
            mockIoSocket.emit('event');
            $scope.$digest();
            
            expect(spy).to.have.been.calledOnce;
        });

    });

    describe('once', function () {

        it('should apply asynchronously', function () {
            $sails.once('event', spy);

            mockIoSocket.emit('event');

            expect(spy).to.have.been.not.called;
            $scope.$digest();

            expect(spy).to.have.been.calledOnce;
        });

        it('should only run once', function () {
            var counter = 0;
            $sails.once('event', spy);

            mockIoSocket.emit('event');
            mockIoSocket.emit('event');
            $scope.$digest();

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
                    mockIoSocket.on(method, function(ctx, cb){
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

    describe('modelUpdater', function() {

        var models;
        var modelResponse;
        var removeUpdater;

        beforeEach(function() {
            models = [];
            removeUpdater = $sails.$modelUpdater('user', models);
            modelResponse = {
                created:{
                    data: {
                        createdAt: "2014-08-01T05:50:19.855Z",
                        id: 1,
                        name: "joe",
                        updatedAt: "2014-08-01T05:50:19.855Z"
                    },
                    id: 1,
                    verb: "created"
                },
                updated:{
                    data: {
                        createdAt: "2014-08-01T05:50:19.855Z",
                        id: 1,
                        name: "joe Changed",
                        updatedAt: "2014-08-01T05:51:19.855Z"
                    },
                    id: 1,
                    verb: "updated"
                },
                destroyed:{
                    id: 1,
                    verb: "destroyed"
                }
            };
        });

        it('should add created model to models', function () {
            mockIoSocket.emit('user', modelResponse.created);
            $scope.$digest();
            expect(models).to.contain(modelResponse.created.data);
        });

        it('should update existing model in models', function () {
            models.push(modelResponse.created.data);
            mockIoSocket.emit('user', modelResponse.updated);
            $scope.$digest();
            expect(models[0].name).to.equal(modelResponse.updated.data.name);
        });

        it('should remove destroyed model in models', function () {
            models.push(modelResponse.created.data);
            mockIoSocket.emit('user', modelResponse.destroyed);
            $scope.$digest();
            expect(models).to.be.empty();
        });

        it('should add non-existent updated model to models based on previous', function () {
            modelResponse.updated.previous = modelResponse.created.data;
            mockIoSocket.emit('user', modelResponse.updated);
            $scope.$digest();
            expect(models[0].name).to.equal(modelResponse.updated.data.name);
        });

        describe('returned function', function(){
            it('should remove the socket listener', function () {
                removeUpdater();
                $scope.$digest();
                mockIoSocket.emit('user', modelResponse.created);
                $scope.$digest();
                expect(models).to.be.empty();
            });

            it('should remove only the socket listener it is called on', function () {
                var tasks = [];
                $sails.$modelUpdater('tasks', tasks);
                removeUpdater();
                $scope.$digest();
                mockIoSocket.emit('user', modelResponse.created);
                mockIoSocket.emit('tasks', modelResponse.created);
                $scope.$digest();
                expect(tasks).to.contain(modelResponse.created.data);
                expect(models).to.be.empty();
            });
        });

    });

});
