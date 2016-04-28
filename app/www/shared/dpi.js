(function(){
	/* Used to pick the right folder for images. We have two ways to find out which one we need:
	- By Media queries / CSS pixel ratio. We found that CSS pixel ratio is inacurate
	- With getInfo plugin, that returns the device DPI.
	*/
	var imgFolder = "xxhdpi";

	angular.module('slash.fw.images', [])
	.run(function($ionicPlatform) {
		if(window.matchMedia){
			/* if(window.matchMedia('screen and (min-resolution: 3dppx)').matches){
				imgFolder = "xxxhdpi"; */
			if(window.matchMedia('screen and (min-resolution: 2dppx)').matches){
				imgFolder = "xxhdpi";
			}else if(window.matchMedia('screen and (min-resolution: 1dppx)').matches){
				imgFolder = "xhdpi";
			}
		}

		$ionicPlatform.ready(function() {
			if(window.plugins && window.plugins.aboutScreen){
				window.plugins.aboutScreen.getInfo(function(info){
					var dpi = info.density;

					// if(dpi <= (110+155)/2) imgFolder = "mdpi";
					// else if(dpi <= (155+212)/2) imgFolder = "hdpi";
					if(dpi <= (212+310)/2) imgFolder = "xhdpi";
					else if(dpi <= (310+425)/2) imgFolder = "xxhdpi";
					else imgFolder = "xxxhdpi-4x";
					
					console.log("DPI detected as " + dpi + ", asset reset as " + imgFolder);
				}, function(){
				});
			}
		});
	})

	.directive('dpiSrc', function($rootScope){
		return {
			restrict: 'A',
			link: function($scope, element, attrs){
				attrs.$observe("dpiSrc", function(){
					element.attr('src', attrs.dpiSrc.replace("{dpi}", imgFolder));
				});
			}
		}
	})

	.directive('dpiButton', function($timeout){
		return {
			restrict: 'E',
			scope: {
				source : '@',
				disabled : '='
			},
			template: '<img ng-src="{{url}}" />',
			replace: true,
			link: function($scope, element, attr){
				element.on('mousedown', onTouchStart);
				element.on('mouseup', onTouchEnd);
				element.on('mouseout', onTouchEnd);
				element.on('touchstart', onTouchStart);
				element.on('touchend', onTouchEnd);
				element.on('touchleave', onTouchEnd);

				$scope.$watch("disabled", function(disabled){
					if(disabled){
						state = "pressed";
					}else{
						state = "default";
					}
					updateUrl();
				});
				
				var state = "default";
				function onTouchStart(){
					state = "pressed";
					updateUrl();
				}
				function onTouchEnd(){
					if($scope.disabled) return;

					state = "default";
					updateUrl();
				}

				function updateUrl(){
					$timeout(function(){
						$scope.url = $scope.source
							.replace("{dpi}", imgFolder)
							.replace("{state}", state);
					});
				}
				updateUrl();
			}
		}
	});
})();