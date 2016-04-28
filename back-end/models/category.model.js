var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var privatePaths = require("mongoose-private-paths");

var categorySchema = new Schema({
	name: String,
});
categorySchema.plugin(privatePaths);

mongoose.model('Category', categorySchema);