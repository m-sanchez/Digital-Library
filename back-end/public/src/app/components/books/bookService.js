"use strict";

/**
 * Created by miguelsanchez on 17/8/15.
 */
app.factory('BookService', function($q, $timeout, rest, apiUrl) {
	var BookService = {
		getBooks: function() {

			var deferred = $q.defer();
			rest.get(apiUrl + '/books/').success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		getBooksByClient: function(client_id) {

			var deferred = $q.defer();
			rest.get(apiUrl + '/clients/' + client_id + '/books').success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		getCodesByClient: function(client_id) {

			var deferred = $q.defer();
			rest.get(apiUrl + '/codes?client_id=' + client_id).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		addBook: function(client_id, book) {

			var deferred = $q.defer();
			rest.post(apiUrl + '/books/', {
					title: book.title,
					synopsis: book.synopsis,
					author: book.author,
					isDefault: book.isDefault,
					cover: book.cover,
					file: book.file,
					category: book.category,
					client_id: client_id
				})
				.success(function(data) {
					deferred.resolve(data);
				});

			return deferred.promise;

		},
		addCode: function(client_id, code) {

			var deferred = $q.defer();

			rest.post(apiUrl + '/codes/', {
					description: code.description,
					startDate: code.startDate,
					endDate: code.endDate,
					number: code.number,

					client_id: client_id
				})
				.success(function(data) {
					deferred.resolve(data);
				});

			return deferred.promise;

		},
		updateBook: function(id, book) {
			var deferred = $q.defer();
			rest.put(apiUrl + '/books/' + id, {
				title: book.title,
				synopsis: book.synopsis,
				author: book.author,
				isDefault: book.isDefault,
				cover: book.cover,
				category: book.category,
				coverEdited: book.coverEdited,
				file: book.file,
				bookEdited: book.bookEdited,
			}).success(function(data) {
				deferred.resolve(data);
			});
			return deferred.promise;

		},
		updateCode: function(id, code) {

			var deferred = $q.defer();
			rest.put(apiUrl + '/codes/' + id, {
				description: code.description,
				startDate: code.startDate,
				endDate: code.endDate,
				committed: code.committed
			}).success(function(data) {
				deferred.resolve(data);
			});
			return deferred.promise;

		},
		deleteBook: function(client_id, id) {

			var deferred = $q.defer();
			rest.remove(apiUrl + '/books/' + id, {
				client_id: client_id
			}).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},

		deleteCode: function(client_id, id) {

			var deferred = $q.defer();
			rest.remove(apiUrl + '/codes/' + id, {
				client_id: client_id
			}).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		downloadCSV: function(filename, client_id, code_id) {
			var deferred = $q.defer();
			rest.get(apiUrl + '/codes/csv/' + code_id + "?client_id=" + client_id).
			success(function(data, status, headers, config) {
				var element = angular.element('<a/>');
				element.attr({
					href: 'data:attachment/csv;charset=utf-8,' + encodeURI(data),
					target: '_blank',
					download: filename + '.csv'
				})[0].click();
				deferred.resolve(data);
			}).
			error(function(data, status, headers, config) {});
			return deferred.promise;
		},
		downloadCSVClient: function(filename, client_id) {
			var deferred = $q.defer();
			rest.get(apiUrl + '/codes/csv?clientId=' + client_id).
			success(function(data, status, headers, config) {
				var element = angular.element('<a/>');
				element.attr({
					href: 'data:attachment/csv;charset=utf-8,' + encodeURI(data),
					target: '_blank',
					download: filename + '.csv'
				})[0].click();
				deferred.resolve(data);
			}).
			error(function(data, status, headers, config) {});
			return deferred.promise;
		}
	}

	return BookService;
});