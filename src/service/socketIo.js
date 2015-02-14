'use strict';

angular.module('ngSails.socketIo')
  .factory('socketIo', socketIo);

function socketIo($window) {
  if (!$window.io) {
    throw new Error('Socket.io-client not found. Ensure socket.io-client is loaded before this script');
  }
  return $window.io;
}
