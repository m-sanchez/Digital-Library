(function(){
	angular.module('slash.bdigital')

	.controller("LectorCtrl", function($scope, $state, $stateParams, $ionicPopover, $fullscreenPopover, $timeout, $ionicHistory, bookService, loading) {
		var FONT_SIZE_STEP = 0.1;
		var MIN_FONT_SIZE = 0.5;
		var MAX_FONT_SIZE = 2;

		$scope.pageCount = [];
		var pageCountObj = {};

		$scope.showBookProgress = false;

		function getPageAndChapter(page){
			// Get chapter
			var chapter = "";
			$scope.pageCount.some(function(pc){
				page -= pc.pages;
				if(page <= 0){
					page += pc.pages;
					chapter = pc.componentId;
					return true;
				}
				return false;
			});

			return {
				page: page,
				chapter: chapter
			}
		}

		$scope.slider = {
			bookPage: "?",
			totalPages: "?",
			onChange: function(){
				var page = parseInt($scope.slider.bookPage);
				if(page){
					var result = getPageAndChapter(page);

					$scope.chapterSettings.goToPage(result.chapter, result.page);
				}else{
					console.warn("Can't go to page " + $scope.slider.bookPage);
				}
			}
		}

		$scope.chapterSettings = {
			currentPage: null,
			chapter: {
				title: null,
				src: null
			},
			locus: null, // Needed for bookmarks and notes - Percentage in chapter
			goToPage: function(chapter, page){
			}
		};

		function checkBookmarkAvailable(){
			$scope.book.then(function(book){
				$scope.hasBookmark = false;

				var key = getBookmarksKey();
				if(book.bookmarks[key]){
					book.bookmarks[key].some(function(bkm){
						if(!pageCountObj[bkm.componentId]) return;

						var pc = pageCountObj[bkm.componentId];
						var page = Math.floor(pc * bkm.percent);
						if(page < 1) page = 1;
						
						if(page == $scope.chapterSettings.currentPage || page == $scope.chapterSettings.currentPage+1){
							$scope.hasBookmark = bkm;
							return true;
						}
						return false;
					});
				}
			});
		}
		function checkNotesAvailable(){
			$scope.book.then(function(book){
				$scope.hasNote = false;
				popoverScope.notes.length = 0;

				var key = getBookmarksKey();
				if(book.notes[key]){
					for(noteKey in book.notes[key]){
						var note = book.notes[key][noteKey];

						if(!pageCountObj[note.componentId]) return;

						var pc = pageCountObj[note.componentId];
						var page = Math.floor(pc * note.percent);
						if(page == $scope.chapterSettings.currentPage || page == $scope.chapterSettings.currentPage+1){
							$scope.hasNote = true;
							popoverScope.notes.push({
								value: note.value,
								noteObj: note
							});
						}
					}
				}
			});
		}

		$scope.$watch("chapterSettings.currentPage + chapterSettings.chapter.src", function(){
			calculatePage();
			checkBookmarkAvailable();
			checkNotesAvailable()
		});

		$scope.styles = {
			fontSize: 1,
			background: null,
			textColor: null
		}

		$scope.hasNote = false;
		$scope.hasBookmark = false;

		$scope.bookMenu = {
			show: false
		}
		$scope.showBookMenu = function(){
			$scope.bookMenu.show = true;
		}
		$scope.hideBookMenu = function(){
			$scope.bookMenu.show = false;
		}
		$scope.goChapter = function(chapter){
			$scope.chapterSettings.chapter.src = chapter.src;
			$scope.bookMenu.show = false;
		}
		$scope.goBookmark = function(bookmark){
			if(bookmark.pageInBook){
				var result = getPageAndChapter(bookmark.pageInBook);	
				$scope.chapterSettings.goToPage(result.chapter, result.page);
			}
			$scope.bookMenu.show = false;
		}

		function calculatePage(){
			var componentId = getBookmarksKey();
			var total = 0;
			var found = $scope.pageCount.some(function(pc){
				if(pc.componentId == componentId){
					return true;
				}
				total += pc.pages;
				return false;
			});

			if(found)
				$scope.slider.bookPage = total + $scope.chapterSettings.currentPage;
			else
				$scope.slider.bookPage = "?";
		}

		$scope.pcProgress = function(args){
			$scope.pageCount = args[0];
			pageCountObj = args[1];
			$scope.tocPages = args[3];
			
			$timeout(function(){
				calculatePage();
				checkBookmarkAvailable();
				checkNotesAvailable();
				$scope.slider.totalPages = args[2];
			});
		}

		function setupPopover(service, url, scopeVar, scope, options){
			options = options || {};
			options.scope = scope;
			service.fromTemplateUrl(url, options).then(function(popover){
				$scope[scopeVar] = popover;
			});
			$scope.$on("$destroy", function(){
				$scope[scopeVar].remove();
			});
		}

		/* Due to a bug in ionic https://github.com/driftyco/ionic/issues/3173
			All popovers share the same scope, and it's the last added popover's scope.
			So... as we only need some callbacks, we just will use one scope.
		*/
		// var stylesScope = $scope.$new(true);
		var popoverScope = $scope.$new(true);
		popoverScope.increaseFontSize = function(){
			$scope.styles.fontSize += FONT_SIZE_STEP;
			$scope.styles.fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, $scope.styles.fontSize));
		}
		popoverScope.decreaseFontSize = function(){
			$scope.styles.fontSize -= FONT_SIZE_STEP;
			$scope.styles.fontSize = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, $scope.styles.fontSize));
		}
		popoverScope.selectBackground = function(color){
			if(color == "default"){
				$scope.styles.textColor = null;
				$scope.styles.background = null;
			}else if(color == "grey"){
				$scope.styles.textColor = null;
				$scope.styles.background = "#ddd";
			}else if(color == "sepia"){
				$scope.styles.textColor = null;
				$scope.styles.background = "#FBF0D9";
			}else if(color == "black"){
				$scope.styles.textColor = "grey !important";
				$scope.styles.background = "black";
			}
		}
		setupPopover($ionicPopover, "app/book/lector/styles.html", "stylesPopover", popoverScope);

		// var notesScope = $scope.$new(true);
		popoverScope.hide = function(){
			$scope.notesPopover.hide();
		}
		popoverScope.save = function(){
			var key = getBookmarksKey();
			$scope.hasNote = false;

			popoverScope.notes.forEach(function(note){
				if(!note.noteObj){
					note.noteObj = {
						componentId: key,
						percent: $scope.chapterSettings.locus.percent,
						creationDate: new Date()
					}
				}

				var noteKey = "" + note.noteObj.percent;

				var value = note.value.trim();
				if(value.length == 0){
					bookService.deleteNote($scope.bookId, key, noteKey);
				}else if(value.length > 0){
					$scope.hasNote = true;

					note.noteObj.value = note.value;
					note.noteObj.creationDate = new Date(); // Update time (I guess?)

					bookService.saveNote($scope.bookId, key, noteKey, note.noteObj);
				}
			});

			$scope.notesPopover.hide();
		}
		popoverScope.notes = [];
		popoverScope.getNotes = function(){
			if(popoverScope.notes.length == 0){
				popoverScope.notes.push({
					value: ""
				});
			}
			return popoverScope.notes;
		}
		setupPopover($fullscreenPopover, "app/book/lector/notes.html", "notesPopover", popoverScope);

		function getBookmarksKey(){
			return /([^#]*).*/.exec($scope.chapterSettings.chapter.src)[1];
		}

		$scope.toggleBookmark = function(){
			if(!$scope.chapterSettings.locus) return;

			var key = getBookmarksKey();
			if($scope.hasBookmark){
				bookService.deleteBookmark($scope.bookId, key, $scope.hasBookmark);
				$scope.hasBookmark = false;
			}else{
				$scope.hasBookmark = {
					componentId: key,
					percent: $scope.chapterSettings.locus.percent,
					creationDate: new Date()
				}
				bookService.saveBookmark($scope.bookId, key, $scope.hasBookmark);
			}
		}

		$scope.bookData = null;
		$scope.$watch("bookId", function(){
			$scope.showBookProgress = true;

			bookService.getBookById($scope.bookId).then(function(book){
				function openBook(url){
					var req = new XMLHttpRequest();
					req.open("GET", url, true);
					req.responseType = "blob";
					req.onload = function () {
						var constr = null;
						var param = null;

						if(req.response.type == "text/html"){
							constr = window.UnzipedEpub;
							param = url;
						}else{
							constr = window.Epub;
							param = req.response;
						}

						new constr(param, function (bookData) {
							$timeout(function(){
								$scope.showBookProgress = false;

								$scope.bookData = bookData;
							});
						});
					};
					req.send();
				}

				if(book == null){
					console.log("Book not found")
					return;
				}

				function onProgress(progress){
					angular.element(document.querySelector(".image-progress .progress")).css("bottom", Math.floor(progress) + "%");
				}

				bookService.getBookCoverURL(book).then(function(url){
					$scope.bookCover = url;
				});

				bookService.getBookEpubURL(book, onProgress).then(function(url){
					openBook(url);
				}).catch(function(){
					// File is corrupted or couldn't be loaded, retry download
					bookService.getBookEpubURL(book, onProgress, true).then(function(url){
						openBook(url);
					}).catch(function(err){
						console.log(err);
						loading.pop();
						// TODO Show error

						alert("Can't load this book.");
						$ionicHistory.goBack();
					});
				});
			});
		});
	})

	// Define routes
	.config(function($stateProvider) {
		$stateProvider
		.state('book.lector', {
			url: "/lector",
			views: {
				"bookContent": {
					templateUrl: "app/book/lector/lector.html",
					controller: 'LectorCtrl'
				}
			}
		});
	});
})();