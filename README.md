Angular Sails Service
=====================

This small service allows you to use Sails.JS's awesome socket.io api with AngularJS.

Just add a dependency to your controllers and get it going!

A small example:

```javascript
angular.module("MyApp", []).controller("FooController", function ($scope, $sails) {
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
