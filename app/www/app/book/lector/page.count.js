(function(){
	angular.module('slash.bdigital')

	.directive("pageCount", function($q, bookService) {
		return {
			restrict: 'E',
			scope: {
				bookData: '=',
				styles: '=',
				onInfoProgress: '&',
				onInfoLoaded: '&'
			},
			link: function($scope, element, attr){
				$scope.onInfoLoaded = $scope.onInfoLoaded || function(){};
				$scope.onInfoProgress = $scope.onInfoProgress || function(){};

				var readerElement = element[0].querySelector(".reader .padding")
				var ePubReader = null;
				var componentIds = null;

				var pageCount = [];
				var tocPages = {};
				var toc = {};

				var running = false;
				var cancelled = null;

				var iLoading = 0;
				function callbackProgress(func){
					var objWay = {};
					var total = 0;
					pageCount.forEach(function(pc){
						objWay[pc.componentId] = pc.pages;
						total += pc.pages;
					});

					func({
						$args: [pageCount, objWay, total, tocPages]
					});
				}
				function loadChapter(i){
					iLoading = i;
					ePubReader.moveTo({
						componentId: componentIds[i],
						page: 1
					});
				}
				function finish(){
					running = false;

					callbackProgress($scope.onInfoLoaded);
				}
				function restartCount(){
					/*
					To allow concurrent requests, we will create a promise called "cancelled" and a flag if it's running.
					Then If it's running:
					. Here
						- We create the cancelled promise
						- We wait for it to complete
						- We rerun restartCount()
					. onChapterChange, if cancelled is defined
						- Do not call loadChapter.
						- Resolve cancelled.
					- We must set cancelled mainly in setFontSize, and change font size once chapter is loaded (cancelled is resolved)
					*/
					/*if(running){
						if(cancelled) return;
						cancelled = $q.defer();
						cancelled.promise.then(function(){
							cancelled = null;
							running = false;
							restartCount();
						});
						return;
					}*/

					pageCount.length = 0;
					if(!componentIds || !componentIds.length){
						console.log("componentIds is empty!");
						return;
					}

					var iComp = componentIds.indexOf(ePubReader.getPlace().componentId());
					if(iComp == 0){
						// Ja el tenim!
						pageCount.push({
							componentId: ePubReader.getPlace().componentId(),
							pages: ePubReader.getPlace().pagesInComponent()
						});

						callbackProgress($scope.onInfoProgress);

						if(componentIds.length > 1){
							running = true;
							loadChapter(1);
						}else{
							running = false;
							// TODO We already finished.
						}
					}else{
						running = true;
						loadChapter(0);
					}


					tocPages = {};
					toc = {};
					var aux = ePubReader.getBook().properties.dataSource.getContents();
					function pushToc(src){
						var result = /^([^#]*)#?(.*)$/.exec(src);
						if(result){
							var cId = result[1];
							var anchor = result[2];

							if(!toc[cId]){
								toc[cId] = [];
							}
							if(toc[cId].indexOf(anchor) < 0)
								toc[cId].push(anchor);
						}
					}
					aux.forEach(function(content){
						pushToc(content.src);
						if(content.children){
							content.children.forEach(function(child){
								pushToc(child.src);
							});
						}
					});
				}

				function onChapterChange(evt){
					if(!componentIds || !componentIds.length)
						return;

					var component = null;
					try {
						component = evt.m.component.properties;
					}catch(ex){
						console.error(ex);
						return;
					}

					var iComp = component.index;
					if(iComp < iLoading) return; // Ja hem passat per aqui!

					// Total pages
					pageCount.push({
						componentId: component.id,
						pages: component.pageLength
					});

					// ToC
					var anchors = toc[component.id];
					if(anchors){
						var pageDiv = evt.m.page;
						var componentObj = pageDiv.m.activeFrame.m.component;

						anchors.forEach(function(anchor){
							var page = componentObj.pageForChapter(anchor, pageDiv);
							var key = component.id;
							if(anchor.length > 0){
								key += "#" + anchor;
							}

							tocPages[key] = page;
						});
					}

					if(componentIds.length > iComp+1){
						if(cancelled){
							cancelled.resolve("done");
						}else{
							callbackProgress($scope.onInfoProgress);
							loadChapter(iComp+1);
						}
					}else{
						iLoading++; // To stop that
						finish();
					}
				}

				$scope.$watch("bookData", function(){
					if(!$scope.bookData) return;

					ePubReader = Monocle.Reader(readerElement, $scope.bookData, {
						flipper: Monocle.Flippers.Instant
					});

					ePubReader.listen("monocle:recalculated", function(evt){
						restartCount();
					});

					ePubReader.listen("monocle:loaded", function(evt){
						componentIds = [];
						ePubReader.getBook().properties.componentIds.forEach(function(comp){
							componentIds.push(comp);
						});

						restartCount();
					});

					ePubReader.listen("monocle:componentchange", function(evt){
						onChapterChange(evt);
					});
				});

				$scope.$watch("styles.fontSize", function(){
					if(!ePubReader) return;
					
					var size = $scope.styles.fontSize || 1;
					setFontSize(size);
				});
				
				var fontSize = 1;
				var pageStyleIndex = undefined;
				function setFontSize(size){
					if(size == fontSize) return;

					if(running){
						cancelled = $q.defer();
						cancelled.promise.then(function(){
							iLoading = 9999999; // Stop every next callback until we want to load a chapter.
							cancelled = null;
							running = false;
							setFontSize(size);
						});
						return;
					}
					
					fontSize = size;

					// ePubReader.formatting.setFontScale(fontSize);
					var fontSizeRule = "body { font-size: " + fontSize + "em !important; }";

					if(pageStyleIndex){
						ePubReader.formatting.updatePageStyles(pageStyleIndex, fontSizeRule);
					}else{
						pageStyleIndex = ePubReader.formatting.addPageStyles(fontSizeRule);
					}
					ePubReader.recalculateDimensions();
				}
			},
			replace: true,
			templateUrl: "app/book/lector/epub.reader.html"
		}
	});
})();	