"use strict";

/**
 * Created by miguelsanchez on 17/8/15.
 */


angular
	.module('frontEnd')
	.controller('NavbarCtrl', function($scope, $state, LoginService) {
		$scope.logout = function(){
			LoginService.logout().then(function(){
				$state.go("login");
			});
		}
	});