(function() {
	'use strict';

	var _state;

	angular
		.module('frontEnd')
		.run(function($state){
			_state = $state
		})
		.config(function(restProvider){
			restProvider.addBeforeInterceptor(function(req){
				req.options = req.options || {};
				req.options.headers = req.options.headers || {};
				req.options.headers["Authorization"] = window.localStorage.token;

				return req;
			});

			restProvider.addAfterInterceptor(function(req, res){
				if(res.statusCode == 401){
					if(confirm("Looks like your session has expired, do you want to logout?")){
						_state.go("login");
					}
				}
			});
		})
		.config(routeConfig);

	/** @ngInject */
	function routeConfig($stateProvider, $urlRouterProvider) {
		$stateProvider
			.state('login', {
				url: "/login",
				templateUrl: 'app/components/login/loginView.html',
				controller: 'LoginCtrl'
			})
			.state('app', {
				url: "/app",
				templateUrl: "app/components/navbar/navbarView.html",
				controller: 'NavbarCtrl'
			})

		.state('app.books', {
				url: "/clients/:client_id",
				templateUrl: "app/components/books/booksView.html",
				controller: 'BooksCtrl'

			})
			.state('app.categories', {
				url: "/categories",
				templateUrl: "app/components/categories/categoriesView.html",
				controller: 'CategoryCtrl'

			})
			.state('app.clients', {
				url: "/clients",
				templateUrl: "app/components/clients/clientsView.html",
				controller: 'ClientCtrl'

			})
			//.state('app.home', {
			//  url: '/home',
			//  templateUrl: 'app/main/main.html',
			//  controller: 'MainController'
			//});
	
		if(window.localStorage.token){
			$urlRouterProvider.otherwise('app/clients');
		}else{
			$urlRouterProvider.otherwise('login');
		}
	}

})();