Angular Sails
=============

This small module allows you to use Sails.JS's awesome socket.io api with AngularJS.

Just add a dependency to your module and controllers and get it going!

Install it:

```shell
bower install angular-sails
```

A small example:

```javascript
var app = angular.module("MyApp", ['ngSails']);

app.controller("FooController", function ($scope, $sails) {
  $scope.bars = [];
  
  (function () {
    $sails.get("/bars", function (data) {
      $scope.bars = data;
    });
    
    $sails.on("message", function (message) {
      if (message.verb === "create") {
        $scope.bars.push(message.data);
      }
    });
  }());
});
```