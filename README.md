[![Build Status](https://travis-ci.org/janpantel/angular-sails.svg?branch=2.0)](https://travis-ci.org/janpantel/angular-sails)

Angular Sails
=============

This module allows you to use Sails.JS's awesome socket.io api with AngularJS.

Just add a dependency to your module and controllers and get it going!

Install it:

```shell
bower install angular-sails
```
You must also include [sails.io-client](https://github.com/automattic/socket.io-client) in order to use this.


Switching from angular's `$http`?
---------------------------------
Angular Sails is a drop-in replacement for Angular's `$http` service.  If you are currently using `$http` with sailsjs then switching to sockets is a snap, just replace `$http` with `$sails`!

Usage
-----

A small example:

```javascript
var app = angular.module("MyApp", ['ngSails']);

//OPTIONAL! Set socket URL!
app.config(['$sailsProvider', function ($sailsProvider) {
    $sailsProvider.url = 'http://foo.bar';
}]);

app.controller("FooController", function ($scope, $sails) {
  $scope.bars = [];

  (function () {
    // Using .success() and .error()
    $sails.get("/bars")
      .success(function (data, status, headers, config) {
        $scope.bars = data;
      })
      .error(function (data, status, headers, config) {
        alert('Houston, we got a problem!');
      });

    // Using .then()
    $sails.get("/bars")
      .then(function(resp){
          $scope.bars = resp.data;
      }, function(resp){
        alert('Houston, we got a problem!');
      });

    // Watching for updates
    $sails.on("bars", function (message) {
      if (message.verb === "created") {
        $scope.bars.push(message.data);
      }
    });
  }());
});
```

API Reference
--------------

### Sails.JS REST ###
Angular Sails mimics Angular's `$http` service to provide a drop-in socket replacement for http.
For more information check out [angular's `$http` docs](https://docs.angularjs.org/api/ng/service/$http#usage)<br />
<small>Note: Angular Sails does not have a `jsonp` method as jsonp is a specific implementation of HTTP</small>
