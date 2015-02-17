'use strict';

angular.module('ngSails.sailsSdk', [])
  .constant('sailsSdk', sailsSdk);

var sailsSdk = {
  info: {
    version: {
      key: '__sails_io_sdk_version',
      value: '0.11.0'
    },
    platform: {
      key: '__sails_io_sdk_platform',
      value: typeof module === 'undefined' ? 'browser' : 'node'
    },
    language: {
      key: '__sails_io_sdk_language',
      value: 'javascript'
    }
  },
  versionString: function() {
    return (function(){
      var tmp = [];
      angular.forEach(sailsSdk.info, function(data){
          tmp.push(data.key+'='+data.value);
      });
      return tmp.join('&');
    }());
  }
};
