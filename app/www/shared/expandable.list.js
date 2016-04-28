(function() {

	angular.module('slash.fw.expandable', [])
	.directive("expandableItem", function($ionicScrollDelegate){
		return {
			restrict: 'C',
			link: function($scope, element, attr){
				element[0].toggleExpand = function(){
					var target = element;

					// Para coger lo que ha augmentado primero miramos su altura
					function getChildHeight(){
						var ret = 0;
						for(var i=0; i<target[0].children.length; i++){
							ret += target[0].children[i].offsetHeight;
						}
						return ret;
					}
					function getHeaderHeight(){
						return target[0].querySelector(".expandable-item-header").offsetHeight;
					}
					var height0 = target.hasClass("expanded") ? getChildHeight() : getHeaderHeight();
					
					if(target.hasClass("expanded")){
						// Si esta expandida, contraimos todos los childs expandidos
						var expanded = this.querySelectorAll(".expandable-item.expanded");
						for(var i=0; i<expanded.length; i++){
							expanded[i].toggleExpand();
						}
					}

					target.toggleClass("expanded");

					var heightf = target.hasClass("expanded") ? getChildHeight() : getHeaderHeight();
					var incrY = heightf - height0;
					
					
					var elm = target;
					do {
						// Siempre tenemos que coger el siguiente, o si no existe, el siguiente del pariente
						while(elm.next().length == 0) {
							elm = elm.parent();
						}
						elm = elm.next();

						// Recuperamos el translateY actual
						var current = elm.attr("data-exp");
						current = current ? parseInt(current) : 0;
						var tY = current + incrY;

						// Y lo añadimos
						elm.css("transform", "translateY(" + tY + "px)");
						elm.attr("data-exp", tY);
					} while (!elm.hasClass("expandable-padding"));
					// El while lo tenemos aqui porque tambien queremos mover el expandable-padding

					// El ultimo elemento es el expandable padding, que sirve para setear la altura total para el scrollview.
					var current = elm.attr("data-exp");
					current = current ? parseInt(current) : 0;

					if(incrY > 0){
						elm.addClass("increasing");
					}else{
						elm.removeClass("increasing");
					}

					// Pero no le sumamos incrY, porque le acabamos de sumar.
					elm.css("height", current + "px");

					// TODO getByHandle
					setTimeout(function(){
						$ionicScrollDelegate.resize();
					}, 500);
				}

				element.on("click", function(evt){
					evt.fake = (evt.constructor.name == "Object");

					/* Hay que incrementar el TranslateY de todos los siblings en cascada hasta llegar al elemento final expandable-padding
					* El incremento tiene que ser la altura de lo que contiene el elemento.
					* Y hay que poner su overflow a visible (que está hidden)
					*/

					var target = angular.element(this);
					if(target.hasClass("non-expandable")){
						console.log("Non expandable");
						return;
					}

					// Check if click is valid.
					if(!evt.fake){
						// If evt it's an object, is a fake click, and we really want to expand/contract this
						
						// evt.target has to be the header or 'this' element. It can't be something in content
						var aux = angular.element(evt.target);
						while(aux[0] != this && !aux.hasClass("expandable-item-content")){
							aux = aux.parent();
						}

						if(aux[0] != this && evt.constructor.name != "Object"){
							return; // We didn't click a header.
						}
					}

					element[0].toggleExpand();
				});
			}
		}
	})
})();