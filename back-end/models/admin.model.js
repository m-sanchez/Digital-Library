var mongoose = require('mongoose');
var crypto = require("crypto");
var Schema = mongoose.Schema;
var privatePaths = require("mongoose-private-paths");

var HASH_ALGO = "sha256";
var SALT_SIZE = 128;

var adminSchema = new Schema({
	username: String,
	_password: String,
	_salt: String
});
adminSchema.plugin(privatePaths);

adminSchema.methods.checkPassword = function(password) {
	var hash = crypto.createHash(HASH_ALGO);
	hash.update(password + this._salt);
	var hashed = hash.digest("hex");

	return this._password == hashed;
}

adminSchema.methods.setPassword = function(password) {
	var hash = crypto.createHash(HASH_ALGO);
	this._salt = crypto.randomBytes(SALT_SIZE).toString('base64');

	hash.update(password + this._salt);
	this._password = hash.digest("hex");

	this.save();
}

mongoose.model('Admin', adminSchema);