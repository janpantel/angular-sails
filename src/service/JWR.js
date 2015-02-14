'use strict';

function JWR(responseCtx) {
  this.body = responseCtx.body || {};
  this.headers = responseCtx.headers || {};
  this.statusCode = angular.isDefined(responseCtx.statusCode) && responseCtx.statusCode || angular.isDefined(responseCtx.status) && responseCtx.status || 200;
  if (this.statusCode < 200 || this.statusCode >= 400) {
    this.error = this.body || this.statusCode;
  }
}

JWR.prototype.toString = function() {
  return 'Status: ' + this.statusCode + '  -- ' +
    'Headers: ' + this.headers + '  -- ' +
    'Body: ' + this.body;
};
