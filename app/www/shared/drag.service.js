(function() {
	function doDrag(evt){
		this.dragStart(evt);
	}

	angular.module('slash.fw.drag', [])
	.factory('dragService', function($ionicGesture, $window) {
		return {
			/* Only works with translate x,y transforms (no rotations or scales!)
				proc should return: {
					obj: DOM object to be dragged,
					minX: Int | undefined
					minY: Int | undefined
					maxX: Int | undefined
					maxY: Int | undefined
				}
				or false if it shouldn't start dragging.
			*/
			setup: function(element, proc, dragEndCallback){
				var setTranslate = ionic.DomUtil.animationFrameThrottle(function(elm, x, y){
					angular.element(elm).css("transform", "translateX(" + x + "px) translateY(" + y + "px)");
				});
				var deleteTranslate = ionic.DomUtil.animationFrameThrottle(function(elm){
					angular.element(elm).removeAttr("style");
				});

				element.dragStart = function(evt){
					var startX = evt.gesture.center.pageX;
					var startY = evt.gesture.center.pageY;

					var drag = proc(startX, startY, evt);
					if(drag){
						drag.minX = typeof(drag.minX) == "undefined" ? -Number.MAX_VALUE : drag.minX;
						drag.minY = typeof(drag.minY) == "undefined" ? -Number.MAX_VALUE : drag.minY;
						drag.maxX = typeof(drag.maxX) == "undefined" ? Number.MAX_VALUE : drag.maxX;
						drag.maxY = typeof(drag.maxY) == "undefined" ? Number.MAX_VALUE : drag.maxY;

						angular.element(drag.obj).addClass("dragging");

						var style = $window.getComputedStyle(drag.obj);
						var transform = style.getPropertyValue("transform") ||
							style.getPropertyValue("-webkit-trnasform");
						var matrix = transform.replace("matrix(", "").replace(")", "").split(", ");

						if(matrix.length > 5){
							var startTranslateX = parseInt(matrix[4]);
							var startTranslateY = parseInt(matrix[5]);

							setTranslate(drag.obj, startTranslateX, startTranslateY);

							var lastDrag = {};
							var thisDrag = {};
							function onDrag(evt){
								function inBounds(v, min, max){
									return Math.max(
										min,
										Math.min(
											max,
											v
										)
									);
								}

								lastDrag = thisDrag;
								thisDrag = {
									x: evt.gesture.center.pageX,
									y: evt.gesture.center.pageY
								}

								setTranslate(
									drag.obj,
									inBounds(startTranslateX + thisDrag.x - startX, drag.minX, drag.maxX),
									inBounds(startTranslateY + thisDrag.y - startY, drag.minY, drag.maxY)
								);
							}
							function onDragEnd(evt){
								var endX = evt.gesture.center.pageX;
								var endY = evt.gesture.center.pageY;

								angular.element(drag.obj).removeClass("dragging");
								$ionicGesture.off(dragGesture, "drag", onDrag);
								$ionicGesture.off(dragEndGesture, "dragend", onDragEnd);

								dragEndCallback({
									x: startX,
									y: startY
								}, {
									x: endX,
									y: endY
								}, lastDrag, evt);

								deleteTranslate(drag.obj);
							}
							var dragGesture = $ionicGesture.on("drag", onDrag, angular.element(element));
							var dragEndGesture = $ionicGesture.on("dragend", onDragEnd, angular.element(element));
						}
					}
				}

				element.dragStartGesture = $ionicGesture.on("touch", doDrag, angular.element(element));
			},
			clear: function(element){
				if(element.dragStartGesture){
					$ionicGesture.off(element.dragStartGesture, "touch", doDrag);
				}
			}
		}
	});
})();