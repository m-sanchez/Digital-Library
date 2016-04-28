(function(){
	angular.module('slash.bdigital')

	.directive("epubReader", function($ionicPopover, $ionicHistory, $q, $timeout, bookService, loading) {
		return {
			restrict: 'E',
			scope: {
				bookData: '=',
				styles: '=',
				chapterSettings: '='
			},
			link: function($scope, element, attr){
				var readerElement = element[0].querySelector(".reader .padding")
				var ePubReader = null;

				var ePubReaderPercentage = null; // Used to ignore percentage watch when it's changed by ePubReader.
				var ePubReaderChapterSrc = null;

				$scope.chapterSettings.goToPage = function(chaptersrc, page){
					if(!ePubReader) return;

					ePubReader.moveTo({
						componentId: chaptersrc,
						page: page
					});
				}

				$scope.$watch("bookData", function(){
					if(!$scope.bookData) return;

					ePubReader = Monocle.Reader(readerElement, $scope.bookData, {
						panels: Monocle.Panels.Marginal
					}, function(rdr){
						var stencil = new Monocle.Controls.Stencil(rdr);
						rdr.addControl(stencil);
						// stencil.toggleHighlights();
					});

					window.epr = ePubReader; // TODO Remove in production

					ePubReader.listen("monocle:recalculated", function(evt){
						angular.element(readerElement).removeClass("recalculating");
					});

					function onPageChange(evt){
						$timeout(function(){
							var place = ePubReader.getPlace();

							$scope.chapterSettings.currentPage = place.pageNumber();
							$scope.chapterSettings.chapter.title = place.chapterTitle();
							$scope.chapterSettings.chapter.src = place.chapterSrc();
							$scope.chapterSettings.locus = place.getLocus();
							$scope.chapterSettings.locus.percentageOfBook = place.percentageOfBook();

							if(place.onFirstPageOfBook()){
								$scope.chapterSettings.percentage = 0;
							}else if(place.onLastPageOfBook()){
								$scope.chapterSettings.percentage = 1;
							}else{
								$scope.chapterSettings.percentage = place.percentageOfBook();
							}
							ePubReaderPercentage = $scope.chapterSettings.percentage;
							ePubReaderChapterSrc = $scope.chapterSettings.chapter.src;
						});
					}
					ePubReader.listen("monocle:pagechange", onPageChange);
					ePubReader.listen("monocle:boundaryend", onPageChange);
					ePubReader.listen("monocle:loaded", function(evt){
						$scope.chapterSettings.toc = ePubReader.getBook().properties.dataSource.getContents();
					});
				});

				$scope.$watch("chapterSettings.chapter.src", function(){
					if($scope.chapterSettings.chapter.src == ePubReaderChapterSrc) return;
					if(!ePubReader) return;

					ePubReader.skipToChapter($scope.chapterSettings.chapter.src);
				});

				$scope.$watch("styles.fontSize", function(){
					if(!ePubReader) return;
					
					var size = $scope.styles.fontSize || 1;
					setFontSize(size);
				});
				$scope.$watch("styles.background", function(){
					if(!ePubReader) return;
					
					if($scope.styles.background){
						angular.element(readerElement.querySelectorAll(".monelem_page")).css("background", $scope.styles.background);
					}else{
						angular.element(readerElement.querySelectorAll(".monelem_page")).css("background", "");
					}
				});
				var pageStyleIndex = undefined;
				var colorRule = "";
				var fontSizeRule = "";
				$scope.$watch("styles.textColor", function(){
					if(!ePubReader) return;

					if($scope.styles.textColor){
						colorRule = "* { color: " + $scope.styles.textColor + "; }";

						var rules = colorRule + " " + fontSizeRule;

						if(pageStyleIndex){
							ePubReader.formatting.updatePageStyles(pageStyleIndex, rules);
						}else{
							pageStyleIndex = ePubReader.formatting.addPageStyles(rules);
						}
					}else if(pageStyleIndex){
						if(fontSizeRule == ""){
							ePubReader.formatting.removePageStyles(pageStyleIndex);
							pageStyleIndex = undefined;
						}else{
							ePubReader.formatting.updatePageStyles(pageStyleIndex, fontSizeRule);
						}
					}
				});
				
				var fontSize = 1;
				function setFontSize(size){
					if(size == fontSize) return;
					
					fontSize = size;

					angular.element(readerElement).one("transitionend", function(){
						// ePubReader.formatting.setFontScale(fontSize);
						fontSizeRule = "body { font-size: " + fontSize + "em !important; }";

						var rules = colorRule + " " + fontSizeRule;
						if(pageStyleIndex){
							ePubReader.formatting.updatePageStyles(pageStyleIndex, rules);
						}else{
							pageStyleIndex = ePubReader.formatting.addPageStyles(rules);
						}
						ePubReader.recalculateDimensions();
					});
					angular.element(readerElement).addClass("recalculating");
				}

				/*
				ePub.getMetadata().then(function(meta){
					console.log(meta);
				});
				ePub.getToc().then(function(toc){
					console.log(toc);
				});*/
			},
			replace: true,
			templateUrl: "app/book/lector/epub.reader.html"
		}
	});
})();	