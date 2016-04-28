var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var privatePaths = require("mongoose-private-paths");

var clientSchema = new Schema({
	company: String,
	contact: String,
	phone: String,
	mail: String,
	codeClient: String,
	books: [{
		type: Schema.Types.ObjectId,
		ref: 'Book'
	}],
	codePackages: [{
		type: Schema.Types.ObjectId,
		ref: 'Code'
	}]
});
clientSchema.plugin(privatePaths);

mongoose.model('Client', clientSchema);