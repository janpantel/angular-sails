Angular Sails Service
=====================

This small service allows you to use Sails.JS's awesome socket.io api with AngularJS.

Just add a dependency to your controllers and get it going!

Install it:

```shell
bower install angular-sails-service
```

A small example:

```javascript
var app = angular.module("MyApp", []);

angular.sails_connector.attachToModule(app);

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
