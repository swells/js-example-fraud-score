/*
 * Copyright (C) 2010-2014 by Revolution Analytics Inc.
 *
 * This program is licensed to you under the terms of Version 2.0 of the
 * Apache License. This program is distributed WITHOUT
 * ANY EXPRESS OR IMPLIED WARRANTY, INCLUDING THOSE OF NON-INFRINGEMENT,
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. Please refer to the
 * Apache License 2.0 (http://www.apache.org/licenses/LICENSE-2.0) for more 
 * details.
 */

/*
 * JavaScript Fraud Detection Example Application
 *
 * AngularJS ng-controller
 *
 * Initialization:
 *
 * Establishes WS connection on /fraudengine, subscribes on /topic/fraud.
 *
 * Events:
 *
 * FRAUDSCORE - RTask result message.
 * RUNTIMESTATS - RBroker runtime statistics message.
 * CLIENTALERT - RBroker runtime (error) notification message.
 *
 * User driven (index.html) events:
 *
 * Resize click -> $scope.resizePool() -> POST:/fraud/pool/init/{size}
 *
 * Execute click -> $scope.executeTasks() -> GET:/fraud/score/{tasks}
 *
 */
module.exports = function($scope, $http, $location) {

   //
   // ng-controller model on $scope.
   //
   $scope.brokerInitialized = false;
   $scope.alertMessage = null;

   $scope.fraudScoreResults = [];
   $scope.poolSize = 1;
   $scope.taskCount = 1;

   $scope.runtimeStats = {
      requestedPoolSize: 1,
      allocatedPoolSize: 1,
      submittedTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      averageCodeExecution: 0,
      averageServerOverhead: 0,
      averageNetworkLatency: 0
   };

   $scope.targetTaskThroughput = 0;
   $scope.currentTaskThroughput = 0;
   $scope.startTaskThroughput = 0;
   $scope.secondTaskThroughput = 0;
   $scope.minuteTaskThroughput = 0;

   //
   // Resize Button Handler:
   //
   $scope.resizePool = function() {
      $scope.alertMessage = 'RBroker pool is initializing. ' +
         'Requested ' + $scope.poolSize + ' R session(s) in the pool. ' +
         'This may take some time. Please wait.';
      $scope.brokerInitialized = false;

      console.log('Attempt to resize pool succeeded, new size=' + $scope.poolSize);

      $http.post('/fraud/pool/init/' + $scope.poolSize)
         .success(function(data, status, headers, config) {
            $scope.alertMessage = null;
            console.log('Attempt to resize pool succeeded, new size=' + $scope.poolSize);
         }).error(function(data, status, headers, config) {
            $scope.errorMessage = 'Attempt to resize pool failed, error=' + data;
         }).finally(function() {
            $scope.fraudScoreResults = [];
            $scope.brokerInitialized = true;
            $scope.currentTaskThroughput = 0;
            $scope.secondTaskThroughput = 0;
            $scope.minuteTaskThroughput = 0;

         });
   };

   //
   // Execute Button Handler:
   //
   $scope.executeTasks = function() {
      $scope.currentTaskThroughput = 0;
      $scope.secondTaskThroughput = 0;
      $scope.minuteTaskThroughput = 0;
      $scope.targetTaskThroughput = $scope.taskCount;
      $scope.startTaskThroughput = Date.now();

      $http.get('/fraud/score/' + $scope.taskCount)
         .success(function(data, status, headers, config) {
            console.log('Attempt to execute tasks succeeded, taskCount=' + $scope.taskCount);
         }).error(function(data, status, headers, config) {
            $scope.errorMessage = 'Can\'t retrieve scores list!';
            $scope.errorMessage = 'Attempt to execute tasks failed, error=' + data;
         });
   };

   var primus = Primus.connect('ws://localhost:' + $location.port());

   // Subscribe for events on /topic/fraud.
   primus.on('open', function() {

      primus.on('/topic/fraud', function(msgObj) {

         if (msgObj.msgType === 'FRAUDSCORE') {

            var elapsedTime = Date.now() - $scope.startTaskThroughput;

            // $apply to propgate change to model.
            $scope.$apply(function() {

               $scope.currentTaskThroughput += 1;
               var throughput =
                  (1000 / elapsedTime) * $scope.currentTaskThroughput;
               $scope.secondTaskThroughput =
                  +(Math.round((throughput - (throughput % 0.01)) + 'e+2') + 'e-2');
               $scope.minuteTaskThroughput =
                  Math.round($scope.secondTaskThroughput * 60);

               // Discard older fraudScore from fraudScoreResults
               // list to prevent browser rendering exhaustion.
               if ($scope.fraudScoreResults.length > 300) {
                  $scope.fraudScoreResults.length = 150;
               }
               $scope.fraudScoreResults.unshift(msgObj);
            });

         } else if (msgObj.msgType === 'RUNTIMESTATS') {
            // $apply to propogate change to model.
            $scope.$apply(function() {
               $scope.alertMessage = null;
               $scope.runtimeStats = msgObj;
            });
         } else if (msgObj.msgType === 'CLIENTALERT') {
            // $apply to propogate change to model.
            $scope.$apply(function() {
               $scope.alertMessage = msgObj.msg;
            });
         }
      });

      //
      // Initialize initial RBroker pool on application startup.
      //
      $scope.resizePool();
   });
};