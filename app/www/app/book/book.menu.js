(function(){
	angular.module('slash.bdigital')

	.filter('percentage', function() {
		return function(input) {
			if (isNaN(input)) {
				return input;
			}
			return Math.floor(input * 100) + '%';
		};
	})

	.controller("BookMenuCtrl", function($scope, $interval) {
		$scope.tab = {
			active: 0
		}

		$scope.bookmarks = [];
		$scope.notes = [];

		function getPage(componentId, anchor){
			var totalPages = 0;
			found = $scope.pageCount.some(function(pc){
				if(pc.componentId == componentId){
					return true;
				}
				totalPages += pc.pages;
				return false;
			});
			if(found){
				if($scope.tocPages[componentId]){
					totalPages += $scope.tocPages[componentId];
				}else{
					totalPages++;
				}

				return totalPages;
			}
			return undefined;
		}
		$scope.chapterSettings.toc.forEach(function(content){
			var result = /^([^#]*)#?(.*)$/.exec(content.src);
			if(result){
				var cId = result[1];
				var anchor = result[2];

				content.pageInBook = getPage(cId, anchor);
			}
		});


		$scope.book.then(function(book){
			/* BOOKMARKS */
			$scope.bookmarks.length = 0;
			for(var src in book.bookmarks){
				var bkms = book.bookmarks[src];

				var pagesSoFar = 0;
				var pagesInChapter = 0;
				$scope.pageCount.some(function(pc){
					pagesInChapter = pc.pages;
					if(pc.componentId == src){
						return true;
					}
					pagesSoFar += pc.pages;
					return false;
				});

				bkms.forEach(function(bkm){
					var pageInChapter = Math.floor(bkm.percent * pagesInChapter);
					if(pageInChapter == 0) pageInChapter = 1;
					bkm.pageInBook = pagesSoFar + pageInChapter;

					var matcher = new RegExp('^(' + decodeURIComponent(bkm.componentId) + ")\#");
					var found = $scope.chapterSettings.toc.some(function(chapter){
						if(decodeURIComponent(chapter.src).match(matcher)){
							bkm.chapter = chapter;
							return true;
						}
						return false;
					});

					if(!found){
						// As the page is not in the table of contents we can't get the chapter name.
						// Either we skip the bookmark or we "guess" it by the filename:

						var filename = bkm.componentId;
						var regexp;
						if(filename.indexOf("/") > 0){
							regexp = /^.*\/([a-zA-Z]+)[0-9]*\.[^.]+$/;
							// Start - something - / - (Content we want) - Some numbers - . - extension
						}else{
							regexp = /^([a-zA-Z]+)[0-9]*\.[^.]+$/;
						}
						var result = regexp.exec(filename);

						if(result){
							bkm.chapter = {
								title: result[1].charAt(0).toUpperCase() + result[1].slice(1)
							}
						}else{
							return;
						}
					}

					bkm.creationDate = new Date(bkm.creationDate);
					$scope.bookmarks.push(bkm);
				});
			}

			$scope.bookmarks.sort(function(a,b){
				return a.pageInBook - b.pageInBook;
			});

			/* NOTES */
			$scope.notes.length = 0;
			for(var src in book.notes){
				var notes = book.notes[src];

				var pagesSoFar = 0;
				var pagesInChapter = 0;
				var found = $scope.pageCount.some(function(pc){
					pagesInChapter = pc.pages;
					if(pc.componentId == src){
						return true;
					}
					pagesSoFar += pc.pages;
					return false;
				});
				if(!found){
					console.warn(src + " not found in pageCount");
					continue;
				}

				for(var id in notes){
					var note = notes[id];

					var pageInChapter = Math.floor(note.percent * pagesInChapter);
					if(pageInChapter == 0) pageInChapter = 1;
					note.pageInBook = pagesSoFar + pageInChapter;
					note.creationDate = new Date(note.creationDate);
					note.src = src;

					$scope.notes.push(note);
				}
			}

			$scope.notes.sort(function(a,b){
				return a.pageInBook - b.pageInBook;
			});
		});
	})

	.filter("bookmarkDate", function(){
		return function(date){
			// TODO Locale

			var today = new Date();

			// Quitamos todos los segundos, minutos y horas
			var timeUtc = today.getTime();
			var timeOffset = today.getTimezoneOffset() * 60 * 1000;
			var timeLocal = timeUtc - timeOffset;
			timeLocal = timeLocal - timeLocal % (1*24*60*60*1000);
			timeUtc = timeLocal + timeOffset;
			today.setTime(timeUtc)

			if(today <= date){
				return "Hoy";
			}

			var yesterday = new Date(today);
			yesterday.setDate(yesterday.getDate()-1);
			if(yesterday <= date){
				return "Ayer";
			}

			var daysOfWeek = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
			var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
			var dateFormat = "%w, %d de %m de %y"; // Week Day Month Year

			var week = daysOfWeek[date.getDay()];
			var day = date.getDate();
			var month = months[date.getMonth()];
			var year = date.getFullYear();

			return dateFormat.replace("%w", week)
				.replace("%d", day)
				.replace("%m", month)
				.replace("%y", year)
		}
	});
})(); 