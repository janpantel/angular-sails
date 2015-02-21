'use strict';

// Sailsjs expects this information in the request...
angular.module('ngSails.sailsSdk', [])
  .constant('sailsSdk', {
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
      var self = this;
      return (function(){
        var tmp = [];
        angular.forEach(self.info, function(data){
            tmp.push(data.key+'='+data.value);
        });
        return tmp.join('&');
      }());
    }
  });
