(function() {
	angular.module('slash.bdigital')

	.controller("CoverCtrl", function($rootScope, $scope, $state, $ionicPopup, $timeout, $ionicHistory, bookService, loading, rest, codeService, popupService) {
		$scope.covers = [];
		$scope.login=true;
		$scope.book = null; // Current book

		$scope.myBooks = function(){
			$ionicHistory.nextViewOptions({
				disableBack: true
			});
			$state.go("books");
		}
		$scope.faqs = function(){
			$state.go("faqs");
		}

		$scope.unlockOrDownloadBook = function() {
			if ($rootScope.codeValid || $scope.book.isDefault) {
				$state.go("book.lector", {
					bookId: $scope.book.id
				});
			} else {
				popupService.popup("login", $scope, function(res){
					if(res){
						$state.go("book.lector", {
							bookId: $scope.book.id
						});
					}
				});
			}
		}
		$scope.onCoverChange = function(cover) {
			bookService.getBookById(cover.id).then(function(book)	{
				$scope.book = book;
			});
		}

		loading.push(); // Show loading
		bookService.loadBooks().then(function(books) {
			var nBooks = books.length;
			var loaded = 0;

			function onImageError() {
				loaded++;
				loading.setProgress(100 * loaded / nBooks);
				loading.pop();
			}

			books.forEach(function(book) {
				if (book.deleted) return;

				loading.push(); // Show loading for each book
				bookService.getBookCoverURL(book).then(function(url) {
					function onImageLoaded() {
						loaded++;
						loading.setProgress(100 * loaded / nBooks);
						loading.pop();

						var self = this;
						$timeout(function() {
							$scope.covers = $scope.covers.concat([{
								cover: url,
								width: self.width,
								height: self.height,
								id: book._id,
								isDefault: book.isDefault
							}]);

							if($scope.covers.length)
								$scope.onCoverChange($scope.covers[0]);
						});
					}

					var img = new Image();
					img.onload = onImageLoaded;
					img.onerror = onImageError;
					img.src = url;
				}, onImageError);
			});
			loading.pop(); // Pop the first "show loading"
		});

	})

	// Define routes
	.config(function($stateProvider) {
		$stateProvider
			.state('covers', {
				url: "/covers",
				templateUrl: "app/covers/covers.html",
				controller: 'CoverCtrl'
			});
	});
})();