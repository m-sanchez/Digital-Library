/**
 * Created by miguelsanchez on 16/04/15.
 */
(function() {
	'use strict';

	app.factory('LoginService', function($q, $timeout, rest, $rootScope, apiUrl) {

		var LoginService = {
			getUserFromLocalStorage: function() {
				var deferred = $q.defer();
				try {
					if (window.localStorage.getItem("user")) {
						$rootScope.user = JSON.parse(window.localStorage['user']);
						deferred.resolve(true);
						$location.path("/app/home");
					} else {
						deferred.resolve(false);
						$location.path("/login");
					}
				} catch (e) {
					console.log(e);
					$location.path("/login");
				}

				return deferred.promise;
			},
			doLogin: function(user, pass) {
				var deferred = $q.defer();
				rest.post(apiUrl + '/login', {
					email: user,
					password: pass
				}).success(function(data, status) {
					window.localStorage.setItem("token", data.token);

					deferred.resolve(data);
				}).error(function(data, status, headers, config) {
					deferred.resolve({
						"denied": true
					});
				});

				return deferred.promise;
			},
			logout: function() {
				window.localStorage.removeItem("token");

				return $q.when(true);
			}
		};
		return LoginService;
	});
})();