'use strict';

angular.module('ngSails.$sailsIo', [])
  .provider('$sailsIo', $sailsIo);

function $sailsIo() {
  var provider = this;
  provider.httpVerbs = ['get', 'post', 'put', 'delete'];
  provider.eventNames = ['on', 'off', 'once'];

  this.$get = function($rootScope, $q, socketIo) {
    var io = socketIo;

    function SailsIo(url, config) {
      var self = this;
      self.connectDefer = $q.defer();
      if (angular.isObject(url)) {
        config = url;
      } else {
        config = config || {};
        config.url = url || config.url;
      }
      self.config = config;

      self.connect(config.url, config);

      return self;
    }

    SailsIo.prototype.connect = function(url, config) {
      if (!this._socket || !this._socket.connected) {
        this._socket = io.connect(url, config);
        this.connectDefer.resolve();
      }
    };

    SailsIo.prototype.disconnect = function() {
      this._socket.disconnect();
      this.connectDefer = $q.defer();
    };

    SailsIo.prototype.isConnected = function() {
      return this._socket.connected;
    };

    angular.forEach(provider.httpVerbs, function(method) {
      SailsIo.prototype[method] = this._req.bind(this, method);
    }, this);

    SailsIo.prototype._req = function(method, req) {
      var self = this;
      var res = $q.defer();

      req.url = req.url.replace(/^(.+)\/*\s*$/, self.config.urlPrefix + '$1');
      req.headers = req.headers || {};
      req.data = req.data || {};
      req.method = method.toUpperCase();

      if (typeof req.url !== 'string') {
        throw new Error('Invalid or missing URL!');
      }

      this._send(req, res);

      return res.promise;

    };

    SailsIo.prototype._send = function(req, res) {
      var self = this;
      var sailsEndpoint = req.method.toLowerCase();

      self.connectDefer.then(function sendRequest() {
        self._socket.emit(sailsEndpoint, req, function requestResponse(response) {

          var serverResponse = {
            data: response.body || {},
            headers: response.headers || {},
            status: response.statusCode || 200,
            error: (function() {
              if (this.status < 200 || this.status >= 400) {
                return this.data || this.status;
              }
            })(),
            socket: self._socket,
            url: req.url,
            method: sailsEndpoint.toUpperCase(),
            config: req
          };

          if (serverResponse.error) {
            res.reject(serverResponse);
          } else {
            res.resolve(serverResponse);
          }
        });
      }, function voidRequest() {
        res.reject({
          data: null,
          headers: {},
          status: 0,
          error: 0,
          socket: self._socket,
          method: sailsEndpoint.toUpperCase(),
          config: req
        });
      });
    };

    angular.forEach(provider.eventNames, function(ev) {
      var self = this;
      SailsIo.prototype[ev] = function(evt, cb) {
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
