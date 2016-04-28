"use strict";

/**
 * Created by miguelsanchez on 19/8/15.
 */
angular.module('ui-confirmModule', ['ui.bootstrap'])
	.directive('ngReallyClick', ['$modal',
		function($modal) {

			var ModalInstanceCtrl = function($scope, $modalInstance) {
				$scope.ok = function() {
					$modalInstance.close();
				};

				$scope.cancel = function() {
					$modalInstance.dismiss('cancel');
				};
			};

			return {
				restrict: 'A',
				scope: {
					ngReallyClick: "&",
					item: "="
				},
				link: function(scope, element, attrs) {
					element.bind('click', function() {
						var message = attrs.ngReallyMessage || "Are you sure ?";
						var head = attrs.ngReallyHead || "Are you sure ?";
						/*
						 //This works
						 if (message && confirm(message)) {
						 scope.$apply(attrs.ngReallyClick);
						 }
						 //*/

						//*This doesn't works
						var modalHtml = '<div class="modal-header"> <button type="button" class="close" ng-click="cancel()" aria-label="Close">' +
							'<span aria-hidden="true">×</span></button>' +
							'<h4 class="modal-title">' + head + '</h4>' + '</div>';
						modalHtml += '<div class="modal-body">' + message + '</div>';
						modalHtml += '<div class="modal-footer"><button class="btn btn-primary" ng-click="ok()">OK</button><button class="btn btn-default" ng-click="cancel()">Cancel</button></div>';

						var modalInstance = $modal.open({
							template: modalHtml,
							controller: ModalInstanceCtrl
						});

						modalInstance.result.then(function() {
							scope.ngReallyClick({
								item: scope.item
							}); //raise an error : $digest already in progress
						}, function() {
							//Modal dismissed
						});
						//*/

					});

				}
			}
		}
	]);