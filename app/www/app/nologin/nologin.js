(function(){
	angular.module('slash.bdigital')

	.controller('NoLoginCtrl', function($scope){

	})

	// Define routes
	.config(function($stateProvider) {
		$stateProvider
		.state('nologin', {
			url: "/nologin",
			templateUrl: "app/nologin/nologin.html",
			controller: 'NoLoginCtrl'
		});
	});

})();