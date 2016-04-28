(function() {
	'use strict';

	var DOWNLOAD_TO_UNZIP_LOAD_RATIO = 90;

	angular.module('slash.bdigital')
	.factory('bookService', function($q, $cordovaFileError, $ionicPlatform, loading, rest, filesystem, offline, client_id, api_host, api_path) {
		// As a test, based on localStorage
		var books = JSON.parse(window.localStorage.books || '[]');

		var device_token;
		(function(){
			var deferred = $q.defer();
			$ionicPlatform.ready(function() {
				if(window.device && window.device.uuid){
					deferred.resolve(window.device.uuid);
				}else{
					deferred.resolve("desktop");
				}
			});
			device_token = deferred.promise;
		})();

		function getFilename(url){
			// Get only filename. TODO: Include path as well! (what happens if we call /covers/best_book_ever and /books/best_book_ever?)
			// La primera regexp (/[^\/]*$/) se queda con la parte final de la URL, empezando por el ultimo /
			// La segunda regexp /^[^?#]*/ se queda con la parte inicial del archivo, ignorando cualquier cosa que empieze por # o ?.
			return /^[^?#]*/.exec(/[^\/]*$/.exec(url)[0])[0];
		}
		function downloadFileToLocal(url, filename, progressCallback, forceDownload){
			progressCallback = progressCallback || function(){};

			var root = filesystem.getRootDirectory(filesystem.DATA_DIR);

			function doDownload(){
				var deferred = $q.defer();

				device_token.then(function(device_token){
					if(offline.isConnected()){
						var req = new XMLHttpRequest();
						req.open("GET", url, true);
						req.setRequestHeader("Client-token", client_id);
						req.setRequestHeader("Device-token", device_token);
						req.responseType = "arraybuffer";

						req.onreadystatechange = function(){
							if(req.readyState == 4 && req.status == 200){
								console.log("Done");
								root.writeFile(filename, req.response, true, req.getResponseHeader("Content-Type")).then(function(res){
									console.log("completed", root.getFileURL(filename));
									deferred.resolve(root.getFileURL(filename));
								},function(err){
									deferred.reject(err);
								});
							}
						}

						req.onprogress = function(evt){
							progressCallback(DOWNLOAD_TO_UNZIP_LOAD_RATIO * evt.loaded / evt.total);
						}
						req.onerror = function(err){
							deferred.reject(err);
						}
						req.send(null);
					}else{
						alert("Can't download this book, check your internet connection");
						
						deferred.reject("offline");
					}
				});

				return deferred.promise;
			}

			if(forceDownload)
				return doDownload();

			return root.fileExists(filename).then(function(file){
				if(file){
					return root.getFileURL(filename);
				}

				return doDownload();
			}, function(error){
				if(error.message == $cordovaFileError[1]){ // File not found
					return doDownload();
				}
				return $q.reject(error);
			});
		}
		function deleteFileFromLocal(filename){
			var root = filesystem.getRootDirectory(filesystem.DATA_DIR);

			return root.fileExists(filename).then(function(file){
				if(!file){
					return true;
				}
				return root.removeFile(filename);
			}, function(error){
				if(error.message == $cordovaFileError[1]) // File not found
					return true;
				return $q.reject(error);
			});
		}

		function unzipFile(url, progressCallback){
			if(window.zip && window.zip.unzip){
				// We have cordova-plugin-zip plugin

				var deferred = $q.defer();
				var dest = url + "-unzip";
				window.zip.unzip(url, dest, function(a,b,c){
					deferred.resolve(dest);
				}, function(progress){
					if(progress.status == 2){
						progressCallback(DOWNLOAD_TO_UNZIP_LOAD_RATIO + 
							(100 - DOWNLOAD_TO_UNZIP_LOAD_RATIO) * progress.loaded / 100);
					}
				});

				return deferred.promise;
			}else{
				progressCallback(100);

				return $q.when(url);
			}
		}

		function updateBooks(newBooks){
			// Updates books variable keeping bookmarks, comments, etc.

			newBooks.forEach(function(newBook){
				var found = books.some(function(book){
					if(book.id == newBook.id){
						angular.merge(book, newBook);
						return true;
					}
					return false;
				});
				if(!found){
					newBook.bookmarks = {};
					newBook.notes = {};
					newBook.downloaded = false;
					books.push(newBook);
				}
			});

			books.forEach(function(book){
				var found = newBooks.some(function(newBook){
					return (book.id == newBook.id);
				});
				if(!found){
					book.deleted = true;
				}
			});

			window.localStorage.books = JSON.stringify(books);
		}

		return {
			loadBooks: function(){
				if(offline.isConnected()){
					return rest.get("/clients/" + client_id + "/books").then(function(result){
						result.data.forEach(function(book){
							book.id = book._id;
						});
						updateBooks(result.data);
						
						return books;
					});
				}else{
					return $q.when(books);
				}
			},
			getBookCoverURL: function(book){
				/* I want to keep the download/caching of covers outside of controllers. We will do it here. */
				// TODO server address
				// return $q.when("http://192.168.1.54:3000/" + book.coverFile);
				//console.log(book.id);
				//console.log(book.coverFile);
				return downloadFileToLocal(api_host + "/" + book.coverFile, book.id + "-cover");
			},
			getBookEpubURL: function(book, progressCallback, download){
				/* I want to keep the download/caching of covers outside of controllers. We will do it here. */
				// return $q.when("test.epub");
				// TODO server address

				return downloadFileToLocal(api_path + book.bookFile, book.id + "-book", progressCallback, download)
					.then(function(url){
						if(!book.downloaded){
							book.downloaded = true;
							window.localStorage.books = JSON.stringify(books);
						}
						return unzipFile(url, progressCallback);
					});
			},
			getBooks: function(){
				return $q.when(books);
			},
			deleteBook: function(book){
				if(book.downloaded){
					return deleteFileFromLocal(book.id + "-book").then(function(){
						book.downloaded = false;
						window.localStorage.books = JSON.stringify(books);
						return true;
					});
				}
			},
			getBookById: function(bookId){
				var book = null;

				books.some(function(b){
					if(b.id == bookId){
						book = b;

						return true;
					}
					return false;
				});

				return $q.when(book)
			},
			saveBookmark: function(bookId, key, bookmark){
				return this.getBookById(bookId).then(function(book){
					if(!book.bookmarks[key])
						book.bookmarks[key] = [];

					book.bookmarks[key].push(bookmark);
					window.localStorage.books = JSON.stringify(books);

					return book;
				});
			},
			deleteBookmark: function(bookId, key, bookmark){
				return this.getBookById(bookId).then(function(book){
					if(book.bookmarks[key]){
						var index = book.bookmarks[key].indexOf(bookmark);
						if(index >= 0)
							book.bookmarks[key].splice(index, 1);

						if(book.bookmarks[key].length == 0){
							delete book.bookmarks[key];
						}
					}
					window.localStorage.books = JSON.stringify(books);

					return book;
				});
			},
			saveNote: function(bookId, key, noteKey, note){
				return this.getBookById(bookId).then(function(book){
					if(!book.notes[key])
						book.notes[key] = {};

					book.notes[key][noteKey] = note;
					window.localStorage.books = JSON.stringify(books);

					return book;
				});
			},
			deleteNote: function(bookId, key, noteKey){
				return this.getBookById(bookId).then(function(book){
					if(book.notes[key] && book.notes[key][noteKey]){
						delete book.notes[key][noteKey];

						if(Object.keys(book.notes[key]) == 0){
							delete book.notes[key];
						}
					}
					window.localStorage.books = JSON.stringify(books);

					return book;
				});
			}
		}
	});
})();