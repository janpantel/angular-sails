[![Build Status](https://travis-ci.org/janpantel/angular-sails.svg?branch=master)](https://travis-ci.org/janpantel/angular-sails)

Angular Sails
=============

This small module allows you to use Sails.JS's awesome socket.io api with AngularJS.

Just add a dependency to your module and controllers and get it going!

Install it:

```shell
bower install angular-sails
```
You must also include [sails.io.js](https://github.com/balderdashy/sails.io.js) in order to use this.

Usage
-----

For a more complex example, have a look at the [tutorial by Maarten](https://github.com/maartendb/angular-sails-scrum-tutorial).

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
      .success(function (data, status, headers, jwr) {
        $scope.bars = data;
      })
      .error(function (data, status, headers, jwr) {
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
Angular Sails wraps the native sails.js REST functions. For further information check out [the sails docs](http://sailsjs.org/#!documentation/sockets) and [Mike's Screencast](http://www.youtube.com/watch?v=GK-tFvpIR7c)

### Native socket functions ###
The sails service is nothing more like the native socket.io object!
