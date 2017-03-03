'use strict';

angular.module('myApp', [
  'ngRoute',
  'ngAnimate'
]).config(function($routeProvider, $locationProvider) {
    $routeProvider.when('/', {
        templateUrl: '/static/app/home.html',
        controller: 'HomeCtrl as ctrl',
        title: 'Search Engine'
    })
    .when('/admin', {
        templateUrl: '/static/app/db.html',
        controller: 'DbCtrl as ctrl',
        title: 'Admin'
    })
    .when('/scrape', {})
    .otherwise({
    	redirectTo: '/'
    });

	$locationProvider.html5Mode(true);

})
.controller('HomeCtrl', function($scope, $route, $routeParams, $location, $http) {
	this.url = 'www.cse.ust.hk';
	this.data = null;
	var self = this;
	$http({
		method: 'GET',
		url: '/db'
	}).then(function successCallback(response) {
	// this callback will be called asynchronously
	// when the response is available
		self.data = response.data;
	}, function errorCallback(response) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
	});
})
.controller('DbCtrl', function($scope, $route, $routeParams, $location, $http) {
	this.welcomeMsg = 'Welcome to the Admin.';
	this.data = null;
	this.loaded = false;
	this.dataLength = 0;

	var self = this;

	$scope.$watch(function(){
		return self.data;
	}, function(newVal) {
		if(newVal) {
			self.loaded = true;
			self.dataLength = Object.keys(newVal).length;
		}
	});

	$http({
		method: 'GET',
		url: '/db'
	}).then(function successCallback(response) {
	// this callback will be called asynchronously
	// when the response is available
		self.data = response.data;
	}, function errorCallback(response) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
	});
})
.run(['$rootScope','$window', function($rootScope, $window) {
    $rootScope.$on('$routeChangeSuccess', function (event, current, previous) {
        $rootScope.title = current.$$route.title;
        // Redirect Angular route to express route
        if(current.$$route.originalPath=='/scrape'){
        	console.log($window);
        	$window.location.href = '/scrape';
        }
    });
}]);