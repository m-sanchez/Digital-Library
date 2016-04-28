(function(){
	'use strict';

	function getFile(filename, type, callback){
		var req = new XMLHttpRequest();
		req.open("GET", filename, true);
		req.responseType = type;
		req.onload = function () {
			var doc = null;
			try {
				doc = new DOMParser().parseFromString(req.responseText || "", "text/xml");
			}catch(ex){
			}

			callback(req, doc);
		};
		req.send();
	}
	function getDir(path) {
		return path.split('/').slice(0, -1).join('/');
	}
	function joinPaths(path1, path2) {
		var scheme = (/^[^:/]+:\/\//.exec(path1) || [""])[0];
		path1 = path1.replace(scheme, "");

		var path = path1.split('/').concat(path2.split('/')),
			normpath = [];
		var first = true; // We allow to start with / (to preserve absolute paths)
		for (var i in path) {
			var dir = path[i];
			if (dir == "..")
				normpath.pop();
			else if (dir != "." && (first || dir != ""))
				normpath.push(dir);

			first = false;
		}
		return scheme + normpath.join('/');
	}
	var URL_TAGS = {
		img: "src",
		link: "href",
		image: "xlink:href", // Image in in-line SVG.  (Calibre uses these for covers.)
	};

	function Epub(epubfolder, callback){
		getContainer(epubfolder, function(result){
			var data_urls = {};

			callback({
				getMetaData: function(key){
					return result.metadata[key];
				},
				getContents: function(){
					return result.contents;
				},
				getComponents: function(){
					return result.spine;
				},
				getComponent: function(id, callback){
					var nElements = null;
					var nDone = null;
					var doc = null;
					function checkFinished(){
						if(nDone == nElements){
							callback(new XMLSerializer().serializeToString(doc));
						}
					}

					getFile(epubfolder + "/" + id, "", function(req, loadedDoc){
						doc = loadedDoc;
						// var absdir = joinPaths(epubfolder, getDir(id));
						var reldir = getDir(id);

						var ext = id.split('.').slice(-1)[0];
						if (["html", "htm", "xhtml", "xml"].indexOf(ext) != -1) {
							nElements = 0;
							nDone = 0;

							for (var tag in URL_TAGS) {
								var attribute = URL_TAGS[tag];
								var elements = doc.getElementsByTagName(tag);
								nElements += elements.length;

								for (var i = 0; i < elements.length; i++) {
									var element = elements[i];
									
									// var path = joinPaths(absdir, element.getAttribute(attribute));
									var path = joinPaths(reldir, element.getAttribute(attribute));

									var data_url = data_urls[path];
									if (data_url != undefined){
										element.setAttribute(attribute, data_url);
										nDone++;
									}else{
										(function(path, attribute, element){ // We need these to stay still
											getFile(epubfolder + "/" + path, "blob", function(req, doc){
												// Recheck it hasn't been created again
												var data_url = data_urls[path];
												if(!data_url){
													data_url = window.URL.createObjectURL(req.response)
													data_urls[path] = data_url;
												}
												element.setAttribute(attribute, data_url);
												nDone++;
												checkFinished();
											});
										})(path, attribute, element);
									}
								}
							}

							checkFinished();
						} else {
							callback(req.responseText);
						}
					});
				}
			})
		});
	}
	window.UnzipedEpub = Epub;

	// Step by step!
	function getContainer(epubfolder, callback){
		getFile(epubfolder + "/META-INF/container.xml", "", function(request, doc){
			var opffn = doc.getElementsByTagName("rootfile")[0].getAttribute("full-path");
			getOPF(epubfolder, opffn, callback);
		});
	}

	function getOPF(epubfolder, filename, callback){
		var reldir = getDir(filename);

		// var files = {}; // Maps filename to zip.Entry
		var spine = []; // List of filenames in spine
		var metadata = {}; // Maps keys to metadata
		// var data_urls = {}; // Maps filename to data URL of file contents
		// var num_data_urls = 0;

		getFile(epubfolder + "/" + filename, "", function(request, doc){
			var idmap = {};
			var nav_href = null;

			// Parse manifest
			var manifest = doc.getElementsByTagName("manifest")[0];
			var items = manifest.getElementsByTagName("item");
			for (var i = 0; i < items.length; i++) {
				var item = items[i];
				var id = item.getAttribute("id");
				var href = item.getAttribute("href");
				idmap[id] = joinPaths(reldir, href);
				var props = item.getAttribute("properties");
				if (props != null && props.split(" ").indexOf("nav") > -1)
					nav_href = idmap[id];
			}

			// Parse spine
			var spineel = doc.getElementsByTagName("spine")[0];
			var sitems = spineel.getElementsByTagName("itemref");
			for (var i = 0; i < sitems.length; i++) {
				var id = sitems[i].getAttribute("idref");
				spine.push(idmap[id]);
			}

			// Parse metadata
			var metadatael = doc.getElementsByTagName("metadata")[0];
			for (var i = 0; i < metadatael.childNodes.length; i++) {
				var node = metadatael.childNodes[i];
				if (node.nodeType == 1 && node.firstChild != null)
					metadata[node.localName] = node.firstChild.nodeValue;
			}

			// Make data URLs for auxillary files, for future use
			/*for (var fn in files) {
				if (spine.indexOf(fn) == -1 && ["mimetype", "META-INF/container.xml"].indexOf(fn) == -1) {
					num_data_urls += 1;
					getEncodedComponent(fn, function(f) {
						return function(data) {
							data_urls[f] = data;
							num_data_urls -= 1;
							if (num_data_urls == 0)
								onLoaded();
						};
					}(fn));
				}
			}*/
			// if (num_data_urls == 0) {
			// callback();
			// }

			console.log(spine);
			console.log(metadata);

			// Parse table of contents
			if (nav_href != null) { // Epub3 navigation
				getEpub3Contents(epubfolder, nav_href, finish);
			} else { // Epub2 navigation
				var ncxfile = idmap[spineel.getAttribute("toc")];
				if (ncxfile != undefined){
					getEpub2Contents(epubfolder, ncxfile, finish);
				}
			}

			function finish(contents){
				callback({
					contents: contents,
					spine: spine,
					metadata: metadata
				});
			}
		});
	}

	function getEpub3Contents(epubfolder, filename, callback){
		var reldir = getDir(filename);

		var contents = []; // Table of contents

		getFile(epubfolder + "/" + filename, "", function(request, navdoc){
			var navs = navdoc.getElementsByTagName("nav");
			for (var i = 0; i < navs.length; i++) {
				var nav = navs[i];
				if (nav.getAttribute("epub:type") == "toc")
					contents = parseNavList(nav.getElementsByTagName("ol")[0], reldir);
			}

			callback(contents);
		});
	}

	function parseNavList(element, reldir) {
		var children = [];
		for (var i = 0; i < element.childNodes.length; i++) {
			var node = element.childNodes[i];
			if (node.nodeType == 1 && node.nodeName == "li") {
				var link = node.getElementsByTagName("a")[0];
				if (link != undefined) {
					var child = {
						title: link.firstChild.nodeValue,
						src: joinPaths(reldir, link.getAttribute("href"))
					};
					var olist = node.getElementsByTagName("ol")[0];
					if (olist != undefined)
						child["children"] = parseNavList(olist, reldir);
					children.push(child);
				}
			}
		}
		return children;
	};

	function getEpub2Contents(epubfolder, filename, callback){
		var reldir = getDir(filename);

		var contents = []; // Table of contents

		getFile(epubfolder + "/" + filename, "", function(request, ncx){
			var navmap = ncx.getElementsByTagName("navMap")[0];
			contents = parseNCXChildren(navmap, reldir);

			callback(contents);
		});
	}


	function parseNCXChildren(element, reldir) {
		var children = [];
		for (var i = 0; i < element.childNodes.length; i++) {
			var node = element.childNodes[i];
			if (node.nodeType == 1 && node.nodeName == "navPoint") {
				var child = {};
				var nav_label = node.getElementsByTagName("text")[0];
				child["title"] = nav_label.firstChild.nodeValue;
				var content = node.getElementsByTagName("content")[0];
				child["src"] = joinPaths(reldir, content.getAttribute("src"));
				var child_nav = parseNCXChildren(node, reldir);
				if (child_nav.length > 0)
					child["children"] = child_nav;
				children.push(child);
			}
		}
		return children;
	};
})();
