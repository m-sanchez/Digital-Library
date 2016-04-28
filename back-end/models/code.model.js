var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var privatePaths = require("mongoose-private-paths");

var codeSchema = new Schema({
	// String para que pueda ser algo como 00130493 (con ceros)
	startDate: Date,
	endDate: Date,
	createdAt: Date,
	description: String,
	committed: {
		type: Boolean,
		default: false
	},
	number: Number,
	codePackage: String,
	codes: [{
			code: String,
			activatedBy: String
		}]
		// Identificador del usuario/tablet que lo ha usado
});
codeSchema.plugin(privatePaths);

codeSchema.methods.isAvailable = function(password) {
	return (typeof this.activatedBy == "string" && this.activatedBy.length > 0);
}

mongoose.model('Code', codeSchema);