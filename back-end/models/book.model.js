var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var privatePaths = require("mongoose-private-paths");

var bookSchema = new Schema({
	title: String,
	author: String,
	synopsis: String,
	appointment: String,
	coverFile: String,
	bookFile: String,
	isDefault: Boolean,
	category: {
		type: Schema.Types.ObjectId,
		ref: 'Category'
	}
});

bookSchema.plugin(privatePaths);

mongoose.model('Book', bookSchema);