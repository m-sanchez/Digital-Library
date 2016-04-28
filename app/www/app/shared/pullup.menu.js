(function() {
	"use strict";

	angular.module('slash.bdigital')
	.directive("pullupMenu", function($templateRequest, $compile, $controller) {
		return {
			restrict: 'C',
			scope: {
				'template': '@',
				'controller': '@',
				'show': '=',
				'scope': '=?'
			},
			link: function($scope, element, attr) {
				$scope.scope = $scope.scope || $scope;
				
				var src = $scope.template;
				var compiled = $templateRequest(src, true).then(function(response){
					return $compile(response);
				});

				var newScope = null;
				$scope.$watch("show", function(_new,old){
					if(_new == old) return;

					if($scope.show){
						if(newScope){
							newScope.$destroy();
						}

						compiled.then(function(compiled){
							newScope = $scope.scope.$new();
							$controller($scope.controller, {"$scope":newScope});

							compiled(newScope, function(cloned){
								element.append(cloned);
								element.css("transform", "translateY(-100%)");
							});
						});
					}else{
						element.one("transitionend", function(){
							if(newScope){
								newScope.$destroy();
							}
							newScope = null;

							element.empty();
						});
						element.css("transform", "");
					}
				});
			}
		};
	});
})();