// Requires plugin cordova-plugin-file (cordova plugin add cordova-plugin-file --save)
(function(){
	'use strict';

	var module = angular.module('slash.fw.filesystem', ["ngCordova"])
	.factory('filesystem', function($q, $cordovaFile) {

		function NativeDirectory(fileScheme){
			this.dirExists = function(dir){
				return $cordovaFile.checkDir(fileScheme, dir);
			}
			this.fileExists = function(file){
				return $cordovaFile.checkFile(fileScheme, file);
			}
			this.createDir = function(dir, replace){
				return $cordovaFile.createDir(fileScheme, dir, replace);
			}
			this.createFile = function(file, replace){
				return $cordovaFile.createFile(fileScheme, file, replace);
			}
			this.removeFile = function(file){
				return $cordovaFile.removeFile(fileScheme, file);
			}
			this.removeDir = function(dir, recursive){
				if(recursive)
					return $cordovaFile.removeRecursively(fileScheme, dir);
				else
					return $cordovaFile.removeDir(fileScheme, dir);
			}

			this.writeFile = function(file, data, replace, mime){
				return $cordovaFile.writeFile(fileScheme, file, data, replace);
			}
			this.readAsText = function(file){
				return $cordovaFile.readAsText(fileScheme, file);
			}
			this.readAsDataURL = function(file){
				return $cordovaFile.readAsDataURL(fileScheme, file);
			}
			this.readAsBinaryString = function(file){
				return $cordovaFile.readAsBinaryString(fileScheme, file);
			}
			this.readAsArrayBuffer = function(file){
				return $cordovaFile.readAsArrayBuffer(fileScheme, file);
			}
			this.moveDir = function(dir, newDir){
				return $cordovaFile.moveDir(fileScheme, dir, fileScheme, newDir);
			}
			this.moveFile = function(file, newFile){
				return $cordovaFile.moveFile(fileScheme, file, fileScheme, newFile);
			}
			this.copyDir = function(dir, newDir){
				return $cordovaFile.copyDir(fileScheme, dir, fileScheme, newDir);
			}
			this.copyFile = function(file, newFile){
				return $cordovaFile.copyFile(fileScheme, file, fileScheme, newFile);
			}
			this.getFileURL = function(filename){
				return $q.when(fileScheme + filename);
			}
		}

		function HTML5Directory(type){
			function dummyFill(self){
				self.dirExists = function(dir){
					return $q.when(false);
				}
				self.fileExists = function(file){
					return $q.when(false);
				}
				self.createDir = function(dir, replace){
					return $q.when(null);
				}
				self.createFile = function(file, replace){
					return $q.when(null);
				}
				self.removeFile = function(file){
					return $q.when(false);
				}
				self.removeDir = function(dir, recursive){
					return $q.when(false);
				}
				
				self.writeFile = function(file, data, replace, mime){
					return $q.when(false);
				}
				self.readAsText = function(file){
					return $q.when(null);
				}
				self.readAsDataURL = function(file){
					return $q.when(null);
				}
				self.readAsBinaryString = function(file){
					return $q.when(null);
				}
				self.readAsArrayBuffer = function(file){
					return $q.when(null);
				}
				self.getFileURL = function(filename){
					return $q.when(null);
				}
				self.moveDir = function(dir, newDir){
					console.error("filesystem error: Not implemented for browser yet");
				}
				self.moveFile = function(file, newFile){
					console.error("filesystem error: Not implemented for browser yet");
				}
				self.copyDir = function(dir, newDir){
					console.error("filesystem error: Not implemented for browser yet");
				}
				self.copyFile = function(file, newFile){
					console.error("filesystem error: Not implemented for browser yet");
				}
			}

			// Add other methods here for different browsers
			var requestFileSystem = window.webkitRequestFileSystem;

			if(!requestFileSystem){
				console.log("This browser is not supported yet");
				dummyFill(this);
				return null;
			}

			var rootDir = (type == "TMP_DIR") ? "." : (type + "/");
			type = (type == "TMP_DIR") ? window.TEMPORARY : window.PERSISTENT;

			var directoryFSEntryDeferred = $q.defer();
			var directoryFSEntry = directoryFSEntryDeferred.promise;

			function initFS(){
				requestFileSystem(type, 0, function(fileSystem){
					if(rootDir != ".")
						getRootDirectoryEntry(fileSystem.root, rootDir, true).then(directoryFSEntryDeferred.resolve, errorHandler);
					else
						directoryFSEntryDeferred.resolve(fileSystem.root);
				}, errorHandler);
			}

			function getFileEntry(file, create, replace){
				var ret = $q.defer();
				
				directoryFSEntry.then(function(dirEntry){
					dirEntry.getFile(file, {create: !!create, exclusive: !!replace}, function(res){
						ret.resolve(res);
					}, function(err){
						ret.reject(err);
					});
				}, function(err){
					ret.reject(err);
				});

				return ret.promise;
			}

			function getRootDirectoryEntry(root, dir, create){
				var ret = $q.defer();

				// If create is true, we have to manually create one by one.
				if(create){
					var dirs = dir.split("/");
					// So we get the first one.
					root.getDirectory(dirs[0], {create: true}, function(dirEntry){
						if(dirs.length > 1 && dirs[1] != ""){
							// And call the next one
							dirs.splice(0, 1);
							getRootDirectoryEntry(dirEntry, dirs.join("/"), true);
						}else{
							// Until we end. Then we return the last dirEntry.
							ret.resolve(dirEntry);
						}
					}, ret.reject);
				}else{
					root.getDirectory(dir, {create: false}, ret.resolve, ret.reject);
				}

				return ret.promise;
			}
			function getDirectoryEntry(dir, create){
				var ret = $q.defer();

				directoryFSEntry.then(function(root){
					getRootDirectoryEntry(root, dir, create).then(ret.resolve, ret.reject);
				});
				

				return ret.promise;
			}

			function errorHandler(e) {
				var msg = '';

				switch (e.code) {
					case FileError.QUOTA_EXCEEDED_ERR:
						msg = 'QUOTA_EXCEEDED_ERR';
						break;
					case FileError.NOT_FOUND_ERR:
						msg = 'NOT_FOUND_ERR';
						break;
					case FileError.SECURITY_ERR:
						msg = 'SECURITY_ERR';
						break;
					case FileError.INVALID_MODIFICATION_ERR:
						msg = 'INVALID_MODIFICATION_ERR';
						break;
					case FileError.INVALID_STATE_ERR:
						msg = 'INVALID_STATE_ERR';
						break;
					default:
						msg = 'Unknown Error';
						break;
				};

				console.error("Filesystem access failed: " + msg);
			}

			// INITIALIZE
			if(window.webkitStorageInfo){
				window.webkitStorageInfo.requestQuota(type, 100*1024*1024, initFS, errorHandler);
			}else{
				initFS();
			}



			this.dirExists = function(dir){
				var deferred = $q.defer();

				getFileEntry(dir, false).then(function(res){
					deferred.resolve(true);
				}, function(error){
					if(error.code == FileError.NOT_FOUND_ERR){
						deferred.resolve(false);
					}else{
						deferred.reject(error);
					}
				});

				return deferred.promise;
			}
			this.fileExists = function(file){
				var deferred = $q.defer();

				getFileEntry(file, false).then(function(res){
					deferred.resolve(true);
				}, function(error){
					if(error.code == FileError.NOT_FOUND_ERR){
						deferred.resolve(false);
					}else{
						deferred.reject(error);
					}
				});

				return deferred.promise;
			}
			this.createDir = function(dir, replace){
				// TODO Replace
				return getDirectoryEntry(dir, true);
			}
			this.createFile = function(file, replace){
				return getFileEntry(file, true, replace);
			}
			this.removeFile = function(file){
				var ret = $q.defer();

				getFileEntry(file, true).then(function(res){
					res.remove(ret.resolve, ret.reject);
				});

				return ret;
			}
			this.removeDir = function(dir, recursive){
				var ret = $q.defer();

				getDirectoryEntry(dir, true).then(function(res){
					if(recursive){
						res.removeRecursively(ret.resolve, ret.reject);
					}else{
						res.remove(ret.resolve, ret.reject);
					}
				});

				return ret;
			}
			
			this.getFileURL = function(filename){
				return getFileEntry(filename, true, false).then(function(fileEntry){
					return fileEntry.toURL();
				});
			}

			this.writeFile = function(file, data, replace, mime){
				mime = mime || "text/plain";
				var ret = $q.defer();

				getFileEntry(file, true, replace).then(function(fileEntry){
					fileEntry.createWriter(function(fileWriter){
						if(!replace){
							// Append
							fileWriter.seek(fileWriter.length);
						}

						fileWriter.onwriteend = function(e){
							ret.resolve();
						}
						fileWriter.onerror = function(e){
							ret.reject(e);
						}

						var blob;
						try {
							blob = new Blob([data], {type: mime});
						} catch(e) {
							var BlobBuilder =
								window.BlobBuilder ||
								window.WebKitBlobBuilder;

							if(BlobBuilder){
								var bb = new BlobBuilder();
								bb.append([data]);
								blob = bb.getBlob(mime);
							}
						}

						if(blob)
							fileWriter.write(blob);
						else{
							console.error("filesystem error: This browser doesn't support Blob.");
							ret.reject();
						}
					});
				}, ret.reject);

				return ret.promise;
			}
			this.readAsText = function(file){
				var ret = $q.defer();

				getFileEntry(file, false).then(function(fileEntry){
					fileEntry.file(function(file){
						var reader = new FileReader();

						reader.onloadend = function(e){
							ret.resolve(this.result);
						};

						reader.readAsText(file);
					}, function(err){ ret.reject(err); });
				}, function(err){ ret.reject(err); });

				return ret.promise;
			}
			this.readAsDataURL = function(file){
				var ret = $q.defer();

				getFileEntry(file, false).then(function(fileEntry){
					fileEntry.file(function(file){
						var reader = new FileReader();

						reader.onloadend = function(e){
							ret.resolve(this.result);
						};

						reader.readAsDataURL(file);
					}, ret.reject);
				}, ret.reject);

				return ret.promise;
			}
			this.readAsBinaryString = function(file){
				var ret = $q.defer();

				getFileEntry(file, false).then(function(fileEntry){
					fileEntry.file(function(file){
						var reader = new FileReader();

						reader.onloadend = function(e){
							ret.resolve(this.result);
						};

						reader.readAsBinaryString(file);
					}, ret.reject);
				}, ret.reject);

				return ret.promise;
			}
			this.readAsArrayBuffer = function(file){
				var ret = $q.defer();

				getFileEntry(file, false).then(function(fileEntry){
					fileEntry.file(function(file){
						var reader = new FileReader();

						reader.onloadend = function(e){
							ret.resolve(this.result);
						};

						reader.readAsArrayBuffer(file);
					}, ret.reject);
				}, ret.reject);

				return ret.promise;
			}
			this.moveDir = function(dir, newDir){
				console.error("filesystem error: Not implemented for browser yet");
			}
			this.moveFile = function(file, newFile){
				console.error("filesystem error: Not implemented for browser yet");
			}
			this.copyDir = function(dir, newDir){
				console.error("filesystem error: Not implemented for browser yet");
			}
			this.copyFile = function(file, newFile){
				console.error("filesystem error: Not implemented for browser yet");
			}
		}

		return {
			APP_DIR: "APP_DIR",
			DATA_DIR: "DATA_DIR",
			SD_DIR: "SD_DIR",
			TMP_DIR: "TMP_DIR",

			getRootDirectory: function(type){
				if(window.device){
					if(!window.cordova || !window.cordova.file){
						console.error("Cordova not ready for filesystem or cordova-plugin-file not installed");
						return null;
					}

					var fileScheme = null;

					if(window.device.platform == "Android"){
						switch(type){
							case this.APP_DIR:
								fileScheme = cordova.file.applicationDirectory;
								break;
							case this.DATA_DIR:
								fileScheme = cordova.file.dataDirectory;
								break;
							case this.SD_DIR:
								fileScheme = cordova.file.externalApplicationStorageDirectory;
								break;
							case this.TMP_DIR:
								fileScheme = cordova.file.cacheDirectory;
								break;
						}
					}else if(window.device.platform == "iOS"){
						switch(type){
							case this.APP_DIR:
								fileScheme = cordova.file.applicationDirectory;
								break;
							case this.DATA_DIR:
								fileScheme = cordova.file.dataDirectory;
								break;
							case this.SD_DIR:
								fileScheme = cordova.file.documentsDirectory;
								break;
							case this.TMP_DIR:
								fileScheme = cordova.file.cacheDirectory;
								break;
						}
					}else{
						console.error("Platform not supported yet for filesystem");
						return null;
					}

					return new NativeDirectory(fileScheme);
				}else{
					return new HTML5Directory(type);
				}
			}
		}
	});
})();
