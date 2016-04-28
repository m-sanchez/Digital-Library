(function(){
	'use strict';

	/* How to create a patch, by git diff:
	-> go to www directory
	git diff --name-only --diff-filter=ACMRTUXB --relative 8aef38a 8384c2 | zip patch.zip -@
	                                                       [old]   [new]
	(replace old and new by the commits you want to diff)

	--name-only: Only show a list of filenames (not the content)
	--diff-filter: Do not show deleted files (But Added, Copied, Modified, Renamed, Type-changed, Unmerged, Unkown, Broken)
	--relative: Show file names relative to this directory.
	*/

	var PLUGIN_VERSION = 1;
	var LOCAL_PACKAGE_VERSION = 1;
	var currentVersion = parseInt(window.localStorage.appVersion || LOCAL_PACKAGE_VERSION);

	var START_FILE = "index.html";

	var appPath = null;
	window.appUpdater = {
		init: function(callback){
			if(!window.ContentSync){
				return callback({
					localPath: "."
				});
			}

			if(appPath){
				return callback({
					localPath: appPath
				});
			}

			document.getElementById("progress").innerHTML = "Initializing...";

			var now = (new Date()).getTime();

			var sync = ContentSync.sync({
				src: null,
				id: "app",
				copyCordovaAssets: true,
				copyRootApp: true,
				type: "local"
			});

			sync.on("progress", function(data){
			});
			sync.on("complete", function(data){
				appPath = data.localPath;
				callback(data);
			});
			sync.on("error", function(data) {
				callback(false, data);
			});
			sync.on("cancel", function(data) {
				callback(false, data);
			});
		},
		run: function(){
			this.init(function(data){
				window.location.replace(data.localPath + "/" + START_FILE);
			});
		},
		update: function(url, version, callback){
			if(!window.ContentSync){
				return callback({
					localPath: "."
				});
			}
			
			document.getElementById("progress").innerHTML = "Downloading";

			var sync = ContentSync.sync({
				src: url,
				id: "app",
				copyCordovaAssets: false, // As we already have everything copied (bc of init), do not recopy them.
				type: "merge"
			});

			sync.on("progress", function(data) {
				var percent = 100 * data.loaded / data.total;
				if(percent){
					percent = Math.floor(percent) + "%";
					document.getElementById("progress").innerHTML = "Downloading " + percent;
				}else{
					console.log(percent, data.loaded, data.total, data);
				}
			});
			sync.on("complete", function(data) {
				document.getElementById("progress").innerHTML = "Download complete";
				window.localStorage.appVersion = version;
				callback(data);
			});
			sync.on("error", function(data) {
				document.getElementById("progress").innerHTML = "Download failed";
				callback(false, data);
			});
			sync.on("cancel", function(data) {
				document.getElementById("progress").innerHTML = "Download failed";
				callback(false, data);
			});
		},
		checkForUpdates: function(callback){
			document.getElementById("progress").innerHTML = "Checking updates...";

			// Get last version from server to see if we have to update
			var xhr = new XMLHttpRequest();
			xhr.onreadystatechange = function(){
				try {
					if(xhr.readyState == 4){
						var response = JSON.parse(xhr.responseText);
						if(response.plugin > PLUGIN_VERSION){
							document.getElementById("progress").innerHTML = "Cordova outdated";

							callback({
								outdated: true,
								type: "cordova",
								pluginVersion: response.plugin,
								appVersion: response.version
							});
						}else if(response.version > currentVersion) {
							document.getElementById("progress").innerHTML = "App outdated";

							callback({
								outdated: true,
								type: "app",
								pluginVersion: response.plugin,
								appVersion: response.version
							});
						}else{
							document.getElementById("progress").innerHTML = "No updates found";

							callback({
								outdated: false,
								pluginVersion: response.plugin,
								appVersion: response.version
							});
						}
					}
				}catch(ex){
					console.error("Couldn't check for updates: " + ex);
					callback({
						outdated: false
					});
				}
			}
			xhr.open("GET", "http://192.168.1.54:3000/version.json", true);
			xhr.setRequestHeader("Pragma", "no-cache");
			xhr.setRequestHeader("Cache-Control", "no-store, no-cache, must-revalidate, post-check=0, pre-check=0");
			xhr.setRequestHeader("Expires", 0);
			xhr.setRequestHeader("Last-Modified", new Date(0));
			xhr.setRequestHeader("If-Modified-Since", new Date(0));
			xhr.send();
		},
		getCurrentVersion: function(){
			return currentVersion;
		}
	}
	
})();