var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');

console.log("Repopulating database. Connecting...");

mongoose.connect(process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/bdigital');

console.log("Connected. Loading models...");

var models_path = __dirname + '/models'
fs.readdirSync(models_path).forEach(function(file) {
	if (~file.indexOf('.js')) require(models_path + '/' + file)
});

var Client = mongoose.model("Client");
var Code = mongoose.model('Code');

console.log("Loaded models");

var clients = [{
	"_id": "55cb1afe79168b821197b36b",
	"company": "Slashmobility",
	"contact": "Emilio Aviles",
	"phone": "933 096 754",
	"mail": "emilio@slashmobility.com",
	"_codes": [
		"55cb1a7151808a7b11cbfa40"
	],
	"_books": []
}];

var codes = [{
	"_id": "55cb1a7151808a7b11cbfa40",
	"activatedBy": "me",
	"endDate": new Date("2015-09-12T10:02:04.369Z"),
	"startDate": new Date("2015-08-12T10:02:04.369Z"),
	"code": "1234567890",
	"createdAt": new Date("2015-08-12T10:02:04.369Z")
}];


var settingUp = true;
var nModels = 0;
var nDone = 0;

function finish() {
	console.log("Disconnecting");
	mongoose.connection.close();
}

function initizalize(Model, values) {
	values.forEach(function(v) {
		function done(err, doc, result) {
			nDone++;
			if (err) {
				console.log(err);
			}

			if (!settingUp && nModels == nDone) {
				finish();
			}
		}

		nModels++;
		if (v._id) {
			Model.findOneAndUpdate({
				_id: v._id
			}, v, {
				upsert: true
			}, done);
		} else {
			Model.create(v, done);
		}
	});
}

initizalize(Code, codes);
initizalize(Client, clients);
settingUp = false;

if (nModels == nDone) {
	finish();
}