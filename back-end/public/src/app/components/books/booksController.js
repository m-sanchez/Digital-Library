/**
 * Created by miguelsanchez on 17/8/15.
 */

app.controller('BooksCtrl', function($scope, $modal, $q, Upload, $timeout, BookService, imagesBase, $rootScope, $stateParams, ClientService, apiUrl) {
	$scope.client_id = $stateParams.client_id;

	if (!$rootScope.currentClient) {
		ClientService.getClient($scope.client_id).then(function(client) {
			$rootScope.currentClient = client;
		});
	}

	$rootScope.getImageSrc = function(imagePartialUrl) {
		if (imagePartialUrl) {

			var str = imagePartialUrl.trim();
			var trimmed = imagesBase + str;
			return trimmed;
		} else {
			return false;
		}
	};

	$scope.loadBookList = function() {
		$scope.loaded = false;
		BookService.getBooksByClient($scope.client_id).then(function(data) {
			$scope.books = data;
			$scope.editing = false;

			$scope.loaded = true;
		});
	};
	$scope.loadCodeList = function() {
		$scope.loaded = false;
		BookService.getCodesByClient($scope.client_id).then(function(data) {
			$scope.codes = data;
			$scope.editingCode = false;
			$scope.loaded = true;
		});
	};

	$scope.setPage = function(pageNo) {
		$scope.currentPage = pageNo;
	};

	$scope.pageChanged = function() {
		console.log('Page changed to: ' + $scope.currentPage);
	};

	$scope.edit = function(index) {
		$scope.editing = true;
		$scope.books[index].coverEdited = false;
		$scope.books[index].bookEdited = false;
		var modalBookInstance = $modal.open({
			animation: $scope.animationsEnabled,
			templateUrl: 'app/components/books/bookModal.html',
			controller: 'ModalBookInstanceCtrl',
			size: 'md',
			resolve: {
				book: function() {
					return angular.copy($scope.books[index]);
				}
			}
		});

		modalBookInstance.result.then(function(selectedItem) {
			$scope.currentBook = selectedItem;
			$scope.saveBook($scope.currentBook);
		}, function() {
			console.log('Modal dismissed at: ' + new Date());
		});
	};


	$scope.animationsEnabled = true;

	$scope.newBook = function() {
		$scope.editing = false;

		var modalBookInstance = $modal.open({
			animation: $scope.animationsEnabled,
			templateUrl: 'app/components/books/bookModal.html',
			controller: 'ModalBookInstanceCtrl',
			size: 'md',
			resolve: {

				book: function() {
					return {
						coverEdited: true,
						bookEdited: true
					};
				}
			}
		});
		modalBookInstance.result.then(function(selectedItem) {
			$scope.currentBook = selectedItem;
			$scope.saveBook($scope.currentBook);
		}, function() {
			console.log('Modal dismissed at: ' + new Date());
		});

	};
	$scope.newCode = function() {
		$scope.editingCode = false;

		var modalCodeInstance = $modal.open({
			animation: $scope.animationsEnabled,
			templateUrl: 'app/components/books/codeModal.html',
			controller: 'ModalCodeInstanceCtrl',
			size: 'md',
			resolve: {

				package: function() {
					return {};
				}
			}
		});

		modalCodeInstance.result.then(function(selectedItem) {
			$scope.currentCode = selectedItem;

			$scope.saveCode($scope.currentCode);
		}, function() {
			console.log('Modal dismissed at: ' + new Date());
		});
	};
	$scope.editCode = function(index) {

		$scope.editingCode = true;
		$scope.codes[index].startDate = new Date($scope.codes[index].startDate);
		$scope.codes[index].endDate = new Date($scope.codes[index].endDate);
		var modalCodeInstance = $modal.open({
			animation: $scope.animationsEnabled,
			templateUrl: 'app/components/books/codeModal.html',
			controller: 'ModalCodeInstanceCtrl',
			size: 'md',
			resolve: {
				package: function() {
					return angular.copy($scope.codes[index]);
				}
			}
		});

		modalCodeInstance.result.then(function(selectedItem) {
			$scope.currentCode = selectedItem;
			$scope.saveCode($scope.currentCode);
		}, function() {
			console.log('Modal dismissed at: ' + new Date());
		});
	};
	$scope.toggleAnimation = function() {
		$scope.animationsEnabled = !$scope.animationsEnabled;
	};

	$scope.uploadCover = function(file, edit) {


		var deferred = $q.defer();
		if (edit) {
			Upload.upload({
				url: apiUrl + '/books/cover',
				fields: {
					'id': $scope.currentBook.title
				},
				file: file,
				headers: {
					"Authorization": window.localStorage.token
				}
			}).progress(function(evt) {
				var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
			}).success(function(data, status, headers, config) {
				$timeout(function() {
					deferred.resolve(data);
				});
			});
		} else {
			deferred.resolve($scope.currentBook.coverFile);
		}
		return deferred.promise;
	};

	$scope.uploadBook = function(file, edit) {
		var deferred = $q.defer();
		if (edit) {

			Upload.upload({
				url: apiUrl + '/books/file',
				fields: {
					'id': $scope.currentBook.title
				},

				file: file,
				headers: {
					"Authorization": window.localStorage.token
				}
			}).progress(function(evt) {
				var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
			}).success(function(data, status, headers, config) {
				$timeout(function() {
					deferred.resolve(data);
				});
			});
		} else {
			deferred.resolve($scope.currentBook.bookFile);
		}
		return deferred.promise;
	};

	$scope.saveBook = function() {

		$scope.uploadCover($scope.currentBook.cover, $scope.currentBook.coverEdited).then(function(data) {
			$scope.currentBook.cover = data;
			$scope.uploadBook($scope.currentBook.file, $scope.currentBook.bookEdited).then(function(data) {
				$scope.currentBook.file = data;
				if (!$scope.editing) {
					$scope.loaded = false;
					BookService.addBook($scope.client_id, $scope.currentBook).then(function(data) {
						$scope.loadBookList();
					});
				} else {
					$scope.loaded = false;
					BookService.updateBook($scope.currentBook._id, $scope.currentBook).then(function(data) {
						$scope.loadBookList();
					});
				}
			});
		});
	};

	$scope.deleteBook = function(index) {
		$scope.loaded = false;
		BookService.deleteBook($scope.client_id, $scope.books[index]._id).then(function(data) {
			var name = $scope.books[index].name;
			$scope.loadBookList();
		});
	};
	$scope.deleteCode = function(index) {
		$scope.loaded = false;
		BookService.deleteCode($scope.client_id, $scope.codes[index]._id).then(function(data) {
			var name = $scope.codes[index].name;
			$scope.loadCodeList();
		});
	};
	$scope.saveCode = function() {
		if (!$scope.editingCode) {
			$scope.loaded = false;
			BookService.addCode($scope.client_id, $scope.currentCode).then(function(data) {
				$scope.loadCodeList();
			});
		} else {
			$scope.loaded = false;
			BookService.updateCode($scope.currentCode._id, $scope.currentCode).then(function(data) {
				$scope.loadCodeList();
			});
		}

	};
	$scope.downloadCSV = function(index) {
		var currentDate = new Date();
		var fileName = $scope.codes[index].description + '_' + currentDate.getDate() +
			'-' + (currentDate.getMonth() + 1) +
			'-' + currentDate.getFullYear() + '_' +
			currentDate.getHours() + ':' + currentDate.getMinutes() + ':' + currentDate.getSeconds();
		BookService.downloadCSV(fileName, $rootScope.currentClient._id, $scope.codes[index]._id).then(function(data) {
		});
	};

	$scope.downloadCSVClient = function() {
		var currentDate = new Date();
		var fileName = $rootScope.currentClient.company + '_' + currentDate.getDate() +
			'-' + (currentDate.getMonth() + 1) +
			'-' + currentDate.getFullYear() + '_' +
			currentDate.getHours() + ':' + currentDate.getMinutes() + ':' + currentDate.getSeconds();
		BookService.downloadCSVClient(fileName, $rootScope.currentClient._id).then(function(data) {
		});
	};
	$scope.loadCodeList();
	$scope.loadBookList();
});
// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

app.controller('ModalBookInstanceCtrl', function($scope, $modalInstance, book, CategoryService) {
	$scope.book = book;
	CategoryService.getCategories().then(function(data) {
		$scope.categories = data;
	});

	$scope.$watch('book.cover', function(bookCover, last) {
		if (typeof bookCover !== "undefined") {
			$scope.book.coverEdited = true;
		}
	});

	$scope.$watch('book.file', function(bookFile) {
		if (typeof bookFile !== "undefined") {
			$scope.book.bookEdited = true;
		}
	});

	$scope.ok = function() {
		if ((($scope.book.file !== null || !$scope.book.bookEdited) && ($scope.book.cover !== null || !$scope.book.coverEdited))) {
			$modalInstance.close($scope.book);
		}
	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};

});

app.controller('ModalCodeInstanceCtrl', function($scope, $modalInstance, package) {
	$scope.package = package;

	if ($scope.package.number) {
		$scope.editingCode = true;
	}

	$scope.ok = function() {
		$modalInstance.close($scope.package);

	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};


	$scope.today = function() {
		$scope.dt = new Date();
	};
	$scope.today();

	$scope.clear = function() {
		$scope.dt = null;
	};

	// Disable weekend selection
	$scope.disabled = function(date, mode) {
		return false;
	};

	$scope.toggleMin = function() {
		$scope.minDate = $scope.minDate ? null : new Date();
	};
	$scope.toggleMin();

	$scope.openStart = function($event) {
		$scope.statusStart.opened = true;
	};
	$scope.openEnd = function($event) {
		$scope.statusEnd.opened = true;
	};
	$scope.dateOptions = {
		formatYear: 'yy',
		startingDay: 1
	};

	$scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
	$scope.format = $scope.formats[0];

	$scope.statusStart = {
		opened: false
	};
	$scope.statusEnd = {
		opened: false
	};
	var tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	var afterTomorrow = new Date();
	afterTomorrow.setDate(tomorrow.getDate() + 2);
	$scope.events =
		[{
			date: tomorrow,
			status: 'full'
		}, {
			date: afterTomorrow,
			status: 'partially'
		}];

	$scope.getDayClass = function(date, mode) {
		if (mode === 'day') {
			var dayToCheck = new Date(date).setHours(0, 0, 0, 0);

			for (var i = 0; i < $scope.events.length; i++) {
				var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);

				if (dayToCheck === currentDay) {
					return $scope.events[i].status;
				}
			}
		}

		return '';
	};

});