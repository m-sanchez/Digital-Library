"use strict";

/**
 * Created by miguelsanchez on 27/04/15.
 */

app.factory('CategoryService', function($q, $timeout, rest, apiUrl) {

	var CategoryService = {
		getCategories: function(callback) {
			var deferred = $q.defer();
			rest.get(apiUrl + '/categories/').success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		addCategory: function(categoryName, callback) {
			var deferred = $q.defer();
			rest.post(apiUrl + '/categories/', {
				name: categoryName
			}).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		updateCategory: function(id, categoryName) {
			var deferred = $q.defer();
			rest.put(apiUrl + '/categories/' + id, {
				name: categoryName
			}).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		deleteCategory: function(id, callback) {

			var deferred = $q.defer();
			rest.remove(apiUrl + '/categories/' + id).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		}
	};
	return CategoryService;


});