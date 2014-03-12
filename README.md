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

### reconnect(url, options) ###
Angular Sails connects to the current URL by default. Sometimes you need to connect your socket to another URL.
You can reconnect your socket connection like this:
```javascript
  $sails.reconnect('http://foobar.com:1338');
```

### disconnect() ###
A wrapper for the socket.io disconnect function.
```javascript
  $sails.disconnect();
```

### emit(event, data) ###
A wrapper for socket.io's emit function.
```javascript
  $sails.emit('something very cool', { foo: 'bar' });
```
