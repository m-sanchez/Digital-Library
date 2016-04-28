(function(){
	"use strict";

	var LEFT_RIGHT_MARGIN = "50px";
	var BOTTOM_MARGIN = LEFT_RIGHT_MARGIN;

	angular.module('slash.bdigital')
	.factory("$fullscreenPopover", function($ionicPopover, $ionicPosition){
		var extended = angular.extend({}, $ionicPopover);

		function setFullScreen(result){
			var elm = result.modalEl;
			var $elm = angular.element(elm);

			$elm.css("width", "auto");
			$elm.css("left", LEFT_RIGHT_MARGIN);
			$elm.css("right", LEFT_RIGHT_MARGIN);
			$elm.css("bottom", BOTTOM_MARGIN);

			angular.element(elm.querySelector(".scroll")).css("min-height", "100%");

			var originalShow = result.show;
			result.show = function($event){
				originalShow.call(this, $event);
				$elm.css("left", LEFT_RIGHT_MARGIN);

				// Hide arrow if its out of content
				var $arrow = angular.element(elm.querySelector(".popover-arrow"));

				// Reposition arrow to new left position
				var buttonOffset = $ionicPosition.offset(angular.element($event.target || target));
				var elementOffset = $ionicPosition.offset($elm);
				$arrow.css({
					left: buttonOffset.left + buttonOffset.width / 2 -
						$arrow.prop('offsetWidth') / 2 - LEFT_RIGHT_MARGIN
				});

				var maxLeft = elementOffset.left + elementOffset.width;
				var currentLeft = parseInt($arrow.css("left"));
				if(currentLeft > maxLeft){
					console.log("Hide arrow", currentLeft, maxLeft);
					$arrow.css("opacity", "0");
				}else{
					$arrow.css("opacity", "");
				}

				// Disable resize callback.
				if(result._onWindowResize)
					ionic.off("resize", result._onWindowResize, window);
			}

			return result;
		}

		extended.fromTemplate = function(templateString, options){
			return $ionicPopover.fromTemplate(templateString, options).then(setFullScreen);
		}
		extended.fromTemplateUrl = function(url, options){
			return $ionicPopover.fromTemplateUrl(url, options).then(setFullScreen);
		}
		return extended;
	});
})();