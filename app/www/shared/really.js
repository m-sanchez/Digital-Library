
var uiconfirm = angular.module('slash.fw.really', ['slash.fw.utils'])

	.directive('ngReallyClick', function(utils) {
		return {
			restrict: 'A',
			scope: {
				ngReallyClick: "&",
				item: "="
			},
			link: function(scope, element, attrs) {
				scope.ngReallyClick = scope.ngReallyClick || function(){};

				element.bind('click', function(evt) {
					evt.stopPropagation();
					evt.preventDefault();
					
					var message = attrs.ngReallyMessage || "Are you sure?";
					var head = attrs.ngReallyHead || "Are you sure?";

					utils.confirm(head, message, function(res){
						if(res){
							scope.ngReallyClick({
								item: scope.item
							});
						}
					});
				});

			}
		}
	}
);