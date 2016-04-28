(function(){
	angular.module('slash.bdigital')

	.controller("BookDetailCtrl", function($scope, $stateParams, $ionicNavBarDelegate, $timeout, $q, bookService) {
		$scope.bookId = $stateParams.bookId;
		
		$scope.book = bookService.getBookById($scope.bookId);
		
		$scope.book.then(function(book){
			$scope.$on("$ionicView.afterEnter", function(){
				$timeout(function(){
					console.log("afterEnter");
					$ionicNavBarDelegate.title(book.title);
				}, 1000);
			});
		});
	})

	// Define routes
	.config(function($stateProvider) {
		$stateProvider
		.state('book', {
			url: "/book/:bookId",
			templateUrl: "app/book/book.html",
			controller: 'BookDetailCtrl',
			abstract: true
		});
	});
})(); 