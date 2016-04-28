(function() {
	'use strict';

	app.controller('LoginCtrl', function($scope, $timeout, $rootScope, LoginService, $modal, $state) {
		$scope.doLogin = function() {
			LoginService.doLogin($scope.loginData.email, $scope.loginData.password).then(function(data) {
				if(data.denied){
					return $scope.errorLogin();
				}

				$state.go("app.clients");
			});
		}

		$scope.errorLogin = function() {
			// TODO
			alert('Usuario o password erróneo.')
			/*$modal({
				title: 'Error',
				content: 'Usuario o password erróneo.',
				show: true,
				animation: 'am-fade-and-slide-top'
			});*/
		};



	});
})();