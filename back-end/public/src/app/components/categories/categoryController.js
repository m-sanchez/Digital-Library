"use strict";

/**
 * Created by miguelsanchez on 27/04/15.
 */
app.controller('CategoryCtrl', function($scope, $timeout, $state, CategoryService) {

	$scope.alerts = [];

	$scope.addAlert = function(type, msg) {
		$timeout(function() {
			$scope.closeAlerts();
			$scope.alerts.push({
				type: type,
				msg: msg
			});

		}, 300);

	};
	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
	};
	$scope.closeAlerts = function() {
		$scope.alerts = [];
	};
	$scope.editing = false;
	$scope.loadCategories = function() {
		CategoryService.getCategories().then(function(data) {
			$scope.categories = data;
			$scope.loaded = true;
		});
	};
	$scope.currentCategory = {
		name: ''
	};
	$scope.categories = [];
	$scope.loadCategories();
	$scope.edit = function(index) {
		$scope.errorCategory = false;

		angular.copy($scope.categories[index], $scope.currentCategory);
		$scope.editing = true;
	};
	$scope.saveCategory = function() {
		if ($scope.currentCategory.name != null && $scope.currentCategory.name != '') {
			$scope.errorCategory = false;
			if (!$scope.editing) {
				CategoryService.addCategory($scope.currentCategory.name).then(function(data) {
					$scope.loadCategories();
					var name = $scope.currentCategory.name;
					$scope.addAlert('success', 'Categoria ' + name + ' creada');
					$scope.currentCategory = {
						name: ''
					};

				});
			} else {
				CategoryService.updateCategory($scope.currentCategory._id, $scope.currentCategory.name).then(function(data) {
					$scope.loadCategories();
					var name = $scope.currentCategory.name;
					$scope.currentCategory = {
						name: ''
					};
					$scope.editing = false;

					$scope.addAlert('success', 'Categoria ' + name + ' actualizada');
				});

			}
		} else {
			$scope.errorCategory = true;
		}
	};
	$scope.deleteCategory = function(index) {
		CategoryService.deleteCategory($scope.categories[index]._id).then(function(data) {
			var name = $scope.categories[index].name;
			$scope.loadCategories();


			$scope.addAlert('success', 'Categoria ' + name + ' borrada');


		});
	}

});