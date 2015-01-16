describe('Agnular Sails', function() {

    var $scope,
        $compile,
        $timeout,
        $sails,
        mockIoSocket,
        spy;

    beforeEach(module('ngSails'));

    beforeEach(inject(function(_$rootScope_, _$compile_, _$timeout_, _$sails_) {
        $scope = _$rootScope_.$new();
        $compile = _$compile_;
        $timeout = _$timeout_;
        $sails = _$sails_;
        mockIoSocket = $sails;
        spy = sinon.spy();
    }));

    describe('#on', function() {

        it('should apply asynchronously', function () {
            $sails.on('event', spy);
            mockIoSocket.emit('event');

            expect(spy).to.have.been.not.called;
            $timeout.flush();

            expect(spy).to.have.been.called;
        });

    });

    describe('#disconnect', function () {

        it('should call the underlying socket.disconnect', function () {
            mockIoSocket.disconnect = spy;
            $sails.disconnect();
            expect(spy).to.have.been.called;
        });

    });

    describe('#connect', function () {

        it('should call the underlying socket.connect', function () {
            mockIoSocket.connect = spy;
            $sails.connect();
            expect(spy).to.have.been.called;
        });

    });


    describe('#once', function () {

        it('should apply asynchronously', function () {
            $sails.once('event', spy);

            mockIoSocket.emit('event');

            expect(spy).to.have.been.not.called;
            $timeout.flush();

            expect(spy).to.have.been.called;
        });

        it('should only run once', function () {
            var counter = 0;
            $sails.once('event', function () {
                counter += 1;
            });

            mockIoSocket.emit('event');
            mockIoSocket.emit('event');
            $timeout.flush();

            expect(counter).to.equal(1);
        });

    });


});
