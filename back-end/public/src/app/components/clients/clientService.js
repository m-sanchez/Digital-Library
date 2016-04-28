"use strict";

/**
 * Created by miguelsanchez on 27/04/15.
 */

app.factory('ClientService', function($q, $timeout, rest, apiUrl) {

	var ClientService = {
		getClients: function(callback) {
			var deferred = $q.defer();
			rest.get(apiUrl + '/clients/').success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		getClient: function(id) {
			var deferred = $q.defer();
			rest.get(apiUrl + '/clients/' + id).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		addClient: function(client, callback) {
			var deferred = $q.defer();
			rest.post(apiUrl + '/clients/', {
				company: client.company,
				contact: client.contact,
				phone: client.phone,
				mail: client.mail
			}).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		updateClient: function(id, client) {
			var deferred = $q.defer();
			rest.put(apiUrl + '/clients/' + id, {
				company: client.company,
				contact: client.contact,
				phone: client.phone,
				mail: client.mail
			}).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		},
		deleteClient: function(id, callback) {

			var deferred = $q.defer();
			rest.remove(apiUrl + '/clients/' + id).success(function(data) {
				deferred.resolve(data);
			});

			return deferred.promise;

		}
	};
	return ClientService;


});