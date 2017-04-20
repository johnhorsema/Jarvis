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
  this.query = '';
  this.queryProcessed = false;

	var self = this;
	$http({
		method: 'GET',
		url: '/db_url_mapping'
	}).then(function successCallback(response) {
	// this callback will be called asynchronously
	// when the response is available
		self.pages = Object.keys(response.data).length;
    self.url = Object.keys(response.data).filter(function(key){
      return response.data[key]=="0";
    })[0];
	}, function errorCallback(response) {
		// called asynchronously if an error occurs
		// or server returns response with an error status.
	});

  this.resetSearch = function() {
    this.queryProcessed = false;
    this.queryResults = null;
    this.query = "";
  }

  this.submitQuery = function() {
    if(this.query==""){
      return;
    }
    this.queryProcessed = true;
    this.queryResults = null;
    $http.post('/query', {query: this.query}).then(function successCallback(response) {
  	// this callback will be called asynchronously
  	// when the response is available
      var query_scores = response.data.filter(function(item){
        return item.score>0;
      });
      $http({
        method: 'GET',
        url: '/spider'
      }).then(function successCallback(response) {
      // this callback will be called asynchronously
      // when the response is available
        var result_pages = response.data.filter(function(item, idx) {
          return query_scores.map(function(qitem){return qitem.key}).indexOf(item.key)!=-1;
          // return item.key==query_result[idx].key;
        });
        self.queryResults = result_pages;
      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
      });
  		// console.log(response.data)
  	}, function errorCallback(response) {
  		// called asynchronously if an error occurs
  		// or server returns response with an error status.
  	});
  }
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
        	$window.location.href = '/scrape';
        }
    });
}]);
