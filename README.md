Angular Sails
=============

This small module allows you to use Sails.JS's awesome socket.io api with AngularJS.

Just add a dependency to your module and controllers and get it going!

Install it:

```shell
bower install angular-sails
```

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
    $sails.get("/bars")
      .success(function (data) {
        $scope.bars = data;
      })
      .error(function (data) {
        alert('Houston, we got a problem!');
      });


    $sails.on("message", function (message) {
      if (message.verb === "create") {
        $scope.bars.push(message.data);
      }
    });
  }());
});
```

API Refenrence
--------------

### Sails.JS REST ###
Angular Sails wraps the native sails.js REST functions. For further information check out [the sails docs](http://sailsjs.org/#!documentation/sockets) and [Mike's Screencast](http://www.youtube.com/watch?v=GK-tFvpIR7c)

### Native socket functions ###
The sails service is nothing more like the native socket.io object!
