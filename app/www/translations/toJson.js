var fs = require('fs');
var csv = require("fast-csv");

var translations = {};
var languages = null;


var input = fs.createReadStream("translations.csv");
var csvStream = csv
	.parse({
		"delimiter":";"
	})
	.on("data", function(data){
		if(!languages){
			languages = [];
			for(var i=1; i<data.length; i++){
				translations[data[i]] = {}
				languages.push(data[i]);
			}
		}else{
			var key = data[0];
			for(var i=1; i<data.length; i++){
				var l = languages[i-1];
				translations[l][key] = data[i];
			}
		}
	})
	.on("end", function(){
		var i = 0;
		function nextLanguage(){
			if(i >= languages.length){
				console.log("done");
				return;
			}

			var l = languages[i];
			fs.writeFile("lang-" + l + ".json", JSON.stringify(translations[l]), "utf8", nextLanguage)
			i++;
		}
		nextLanguage();
	});

input.pipe(csvStream);