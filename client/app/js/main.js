(function () {

  'use strict';

  var mainCtrl = require('./controllers/mainctrl');

  angular.module('SampleApp', ['ngRoute', 'ui.bootstrap'])

  .config([
    '$locationProvider',
    '$routeProvider',
    function($locationProvider, $routeProvider) {
      $locationProvider.hashPrefix('!');
      // routes
      $routeProvider
        .when("/", {
          templateUrl: "./partials/stats.html",
          controller: "MainController"
        })
        .otherwise({
           redirectTo: '/'
        });
    }
  ])

  //Load controller
  .controller('MainController', ['$scope', '$http', mainCtrl]);

}());