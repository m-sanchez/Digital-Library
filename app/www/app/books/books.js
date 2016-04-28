(function(){
	angular.module('slash.bdigital')

	.controller("BooksCtrl", function($scope, $ionicHistory, $state, popupService, bookService) {
		$scope.books = [];
		$scope.status = {
			editing: false
		}

		$scope.goCovers = function(){
			$ionicHistory.nextViewOptions({
				disableBack: true
			});
			$state.go("covers");
		}
		$scope.goBook = function(book){
			// Assumim que el llibre esta disponible... en teoria no es pot clicar si no es valid.
			$state.go("book.lector", {
				bookId: book.id
			});
		}
		$scope.showLogin = function(){
			popupService.popup("login", $scope, function(res){
				if(res){
					refresh();
				}
			});
		}
		$scope.deleteBook = function(book){
			// TODO confirm
			bookService.deleteBook(book).then(refresh);
		}

		function refresh(){
			$scope.books.length = 0;
			bookService.getBooks().then(function(books){
				books.forEach(function(book) {
					if (book.deleted || !book.downloaded) return;

					bookService.getBookCoverURL(book).then(function(url) {
						book.url=url;
						$scope.books.push(book);
					});
				});
			});
		}
		if($scope.codeValid){
			refresh();
		}
	})

	// Define routes
	.config(function($stateProvider) {
		$stateProvider
		.state('books', {
			url: "/books",
			templateUrl: "app/books/books.html",
			controller: 'BooksCtrl'
		});
	})

	.directive("afterClick", function(){
		return function($scope, elm){
			elm[0].addEventListener("click", function(evt){
				console.log("click");
			});
		}
	});
})();