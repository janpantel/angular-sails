'use strict';

/* global statusText: true,
  buildUrl: true
*/

angular.module('ngSails.$sailsIo', ['ngSails.sailsSdk', 'ngSails.socketIo'])
  .provider('$sailsIo', $sailsIo);

function $sailsIo() {
  var provider = this;
  provider.httpVerbs = ['get', 'post', 'put', 'delete'];
  provider.eventNames = ['on', 'off', 'once'];

  this.$get = function($rootScope, $q, $log, socketIo, sailsSdk) {
    var io = socketIo;

    function SailsIo(url, config) {
      return this.connect(url, config);
    }

    SailsIo.prototype.connect = function(url, config) {
      var self = this;
      config = config || {};

      if(self._socket && self._socket.connected){
        throw new Error('Socket is already connected.');
      }

      if(!self.connectDefer){
        self.connectDefer = $q.defer();
      }

      if (angular.isObject(url) && angular.isFunction(url.on) && angular.isFunction(url.emit)){
          // user passed in a socket, lets use it.
          self._socket = url;
          self.connectDefer.resolve();
      }else{
        if(!angular.isString(config.query)){
            config.query = sailsSdk.versionString();
        }else{
            config.query += '&'+sailsSdk.versionString();
        }

        if (!self._socket || !self._socket.connected) {
          self._socket = io(config.url, config);
          self.connectDefer.resolve();
        }
      }

      if (provider.debug) {
        self.on('connect', $log.info.bind(self, '$sails connected.'));
        self.on('disconnect', $log.info.bind(self, '$sails disconnected.'));
        self.on('reconnecting', function(attemps) {
          $log.warn.bind(self, '$sails is attemping to reconnect. (#' + attemps + ')');
        });
        self.on('reconnect', function(transport, attemps) {
          $log.info.bind(self, '$sails successfully reconnected after ' + attemps + ' attemps.');
        });
        self.on('error', function(err) {
          $log.error('$sails could not connect:', err);
        });
      }

      return self;
    };

    SailsIo.prototype.disconnect = function() {
      var self = this;
      if (self._socket) {
        self._socket.disconnect();
      }
      if(self.connectDefer){
        self.connectDefer.reject('disconnect');
      }
      self.connectDefer = $q.defer();
    };

    SailsIo.prototype.isConnected = function() {
      if (!this._socket) {
        return false;
      }
      return this._socket.connected;
    };

    SailsIo.prototype._send = function(req, res) {
      var self = this;
      var sailsEndpoint = req.method.toLowerCase();

      self.connectDefer.promise.then(function sendRequest() {
        if (provider.debug) {
          $log.info('$sails ' + req.method + ' ' + req.url, req.data || '');
        }

        self._socket.emit(sailsEndpoint, req, function requestResponse(response) {
            if (provider.debug) {
              $log.info('$sails' + req.method + ' ' + req.url + ' response received', response);
            }
          var serverResponse = {
            data: response.body || response || {},
            status: response.statusCode || response.status || response.Status || 200,
            headers: response.headers || {},
            config: req
          };

          serverResponse.statusText = statusText[serverResponse.status];

          if (200 <= serverResponse.status && serverResponse.status < 300) {
            res.reject(serverResponse);
          } else {
            res.resolve(serverResponse);
          }
        });
      }, function voidRequest() {
        if (provider.debug) {
          $log.warn('$sails' + req.method + ' ' + req.url + ' request terminated', req);
        }
        res.reject({
          data: null,
          status: 0,
          headers: {},
          config: req,
          statusText: null
        });
      });
    };

    SailsIo.prototype._req = function(req) {
      var self = this;
      var res = $q.defer();

      req.url = buildUrl(req.url.replace(/^(.+)\/*\s*$/, '$1'), req.params);
      req.headers = req.headers || {};
      req.data = req.data || {};
      req.method = req.method.toUpperCase();

      if (typeof req.url !== 'string') {
        throw new Error('Invalid or missing URL!');
      }

      self._send(req, res);

      return res.promise;

    };

    angular.forEach(provider.httpVerbs, function(method) {
      SailsIo.prototype[method] = SailsIo.prototype._req;
    });

    angular.forEach(provider.eventNames, function(ev) {
      SailsIo.prototype[ev] = function(evt, cb) {
        var self = this;
        if (cb !== null && angular.isFunction(cb)) {
          self._socket[ev](evt, function(result) {
            $rootScope.$evalAsync(cb.bind(self, result));
          });
        }
      };
    }, this);

    return SailsIo;
  };

}
