"use strict";

/**
 * Created by miguelsanchez on 27/04/15.
 */
app.controller('ClientCtrl', function($scope, $timeout, $state, ClientService, $modal, $rootScope) {

	$scope.alerts = [];
	$scope.selectClient = function(client) {
		$rootScope.currentClient = client;
		$state.go("app.books", {
			client_id: $rootScope.currentClient._id
		});
	}
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
	$scope.loadClients = function() {
		ClientService.getClients().then(function(data) {
			$scope.clients = data;
			$scope.loaded = true;
		});
	};
	$scope.currentClient = {
		name: ''
	};
	$scope.clients = [];
	$scope.loadClients();
	$scope.edit = function(index) {
		$scope.editing = true;
		$scope.clients[index].coverEdited = false;
		$scope.clients[index].clientEdited = false;
		var modalInstance = $modal.open({
			animation: $scope.animationsEnabled,
			templateUrl: 'app/components/clients/clientModal.html',
			controller: 'ModalClientInstanceCtrl',
			size: 'md',
			resolve: {
				client: function() {
					return $scope.clients[index];
				}
			}
		});

		modalInstance.result.then(function(selectedItem) {
			$scope.currentClient = selectedItem;
			$scope.saveClient($scope.currentClient);
		}, function() {
			console.log('Modal dismissed at: ' + new Date());
		});
	}

	$scope.animationsEnabled = true;

	$scope.newClient = function() {
		$scope.editing = false;

		var modalInstance = $modal.open({
			animation: $scope.animationsEnabled,
			templateUrl: 'app/components/clients/clientModal.html',
			controller: 'ModalClientInstanceCtrl',
			size: 'md',
			resolve: {

				client: function() {
					return {};
				}
			}
		});

		modalInstance.result.then(function(selectedItem) {
			$scope.currentClient = selectedItem;
			$scope.saveClient($scope.currentClient);
		}, function() {
			console.log('Modal dismissed at: ' + new Date());
		});
	};

	$scope.toggleAnimation = function() {
		$scope.animationsEnabled = !$scope.animationsEnabled;
	};


	$scope.saveClient = function() {

		if (!$scope.editing) {
			ClientService.addClient($scope.currentClient).then(function(data) {
				$scope.loadClients();
				var name = $scope.currentClient.company;
				$scope.addAlert('success', 'Cliente  ' + name + ' creado');
				$scope.currentClient = {
					name: ''
				};

			});
		} else {
			ClientService.updateClient($scope.currentClient._id, $scope.currentClient).then(function(data) {
				$scope.loadClients();
				var name = $scope.currentClient.company;
				$scope.currentClient = {
					name: ''
				};
				$scope.editing = false;

				$scope.addAlert('success', 'Cliente  ' + name + ' actualizado');
			});

		}

	};
	$scope.deleteClient = function(index) {
		ClientService.deleteClient($scope.clients[index]._id).then(function(data) {
			var name = $scope.clients[index].company;
			$scope.loadClients();


			$scope.addAlert('success', 'Cliente ' + name + ' borrado');


		});
	}

});

// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $modal service used above.

app.controller('ModalClientInstanceCtrl', function($scope, $modalInstance, client) {
	$scope.client = client;

	$scope.$watch('client.cover', function(clientCover) {


		if (clientCover != null) {
			$scope.client.coverEdited = true;
			// $scope.uploadCover(clientCover);
		}
		// $scope.upload($scope.file);
	});
	$scope.$watch('client.file', function(clientFile) {
		if (clientFile != null) {
			$scope.client.clientEdited = true;

		}

	});



	$scope.ok = function() {
		$modalInstance.close($scope.client);

	};

	$scope.cancel = function() {
		$modalInstance.dismiss('cancel');
	};


});