// External libraries
var express = require('express');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var fs = require('fs');
var app = express();
var path = require('path');



// Connect to database
mongoose.connect(process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/bdigital');

// Load models
var models_path = __dirname + '/models'
fs.readdirSync(models_path).forEach(function(file) {
	if (~file.indexOf('.js')) require(models_path + '/' + file)
});

// Setup server
app.use(logger('dev'));
app.use(bodyParser.json());



app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(cookieParser());



app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Device-token, Client-token, Authorization");

	next();
});



// Routers
var router = express.Router();
var authrouter = express.Router();

require('./routes/books.router')(router, authrouter);
require('./routes/categories.router')(router, authrouter);
require('./routes/codes.router')(router, authrouter);
require('./routes/clients.router')(router, authrouter);
var credentials = require('./credentials')(router, authrouter);

app.use(credentials.authenticate);

app.use('/api', router);
app.use(express.static("public/src"));
if(process.env.OPENSHIFT_DATA_DIR){
	app.use(express.static(process.env.OPENSHIFT_DATA_DIR + "public/src"));
}

app.use(function(req, res, next){
	if (req.method == "OPTIONS")
		return next();

	if(!req.auth.admin){
		return res.status(401).send();
	}
	return next();
});
app.use('/api', authrouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
	console.log("Sending 404");
	if(req.method == "OPTIONS")
		return res.status(204).send();

	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers
app.use(function(err, req, res, next) {
	if (typeof err.status == "number" && err.status < 500) {
		res.status(err.status).end();
	} else {
		next(err);
	}
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.send(err.stack);
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.send("Internal Server Error");
});

module.exports = app;