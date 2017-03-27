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
})
.controller('DbCtrl', function($scope, $route, $routeParams, $location, $http) {
	this.welcomeMsg = 'Welcome to the Admin.';
	this.data = null;
	this.loaded = false;
	this.dataLength = 0;

	this.mappingToggle = false;
	this.forwardToggle = false;
	this.invertedToggle = false;
	this.infoToggle = true;
	this.parentchildToggle = true;

	var self = this;

	$scope.$watch(function(){
		return self.data_info;
	}, function(newVal) {
		if(newVal) {
			self.loaded = true;
			self.dataLength = Object.keys(newVal).length;
		}
	});

	$http({
		method: 'GET',
		url: '/db_url_mapping'
	}).then(function successCallback(response) {
	// this callback will be called asynchronously
	// when the response is available
		self.data_url_mapping = Object.keys(response.data).sort(function(a,b){return parseInt(response.data[a])-parseInt(response.data[b])});
	}, function errorCallback(response) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
	});

	$http({
		method: 'GET',
		url: '/db_word_mapping'
	}).then(function successCallback(response) {
	// this callback will be called asynchronously
	// when the response is available
		self.data_word_mapping = Object.keys(response.data).sort(function(a,b){return parseInt(response.data[a])-parseInt(response.data[b])});
	}, function errorCallback(response) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
	});

	$http({
		method: 'GET',
		url: '/db_inverted'
	}).then(function successCallback(response) {
	// this callback will be called asynchronously
	// when the response is available
		self.data_inverted = response.data;
	}, function errorCallback(response) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
	});

	$http({
		method: 'GET',
		url: '/db_forward'
	}).then(function successCallback(response) {
	// this callback will be called asynchronously
	// when the response is available
		self.data_forward = response.data;
	}, function errorCallback(response) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
	});

	$http({
		method: 'GET',
		url: '/db_info'
	}).then(function successCallback(response) {
	// this callback will be called asynchronously
	// when the response is available
		var keys = Object.keys(response.data).sort(function(a,b){return parseInt(a)-parseInt(b)});
		var values = [];
		keys.forEach(function(k){
			values.push(response.data[k])
		});
		self.data_info = values;
	}, function errorCallback(response) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
	});

	$http({
		method: 'GET',
		url: '/db_parent_child'
	}).then(function successCallback(response) {
	// this callback will be called asynchronously
	// when the response is available
		self.data_parent_child = response.data;
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