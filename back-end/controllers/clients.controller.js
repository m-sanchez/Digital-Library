/**
 * Created by miguelsanchez on 18/8/15.
 */
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');


var Client = mongoose.model('Client');
var Q = require('q');
var randomString = function(length) {
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
	return result;
}
var generateCode = function() {
	var code = randomString(2);
	var deferred = Q.defer();
	Client.find({
		'codeClient': code
	}, function(err, clients) {
		if (err) {
			res.send(err);
		} else {
			if (clients.length == 0) {
				deferred.resolve(code)
			} else {
				deferred.resolve(generateCode());
			}
		}
	});
	return deferred.promise;
}


/**
 * Create a client
 */
exports.create = function(req, res) {
	var client = new Client(); // create a new instance of the Client model



	client.company = req.body.company;
	client.contact = req.body.contact;
	client.phone = req.body.phone;
	client.mail = req.body.mail;
	generateCode().then(function(data) {
		client.codeClient = data;
		client.save(function(err) {
			if (err) {
				res.send(err);
			} else {
				res.json(client);
			}
		});
	});


};

exports.getAll = function(req, res) {

	Client.find(function(err, clients) {
		if (err) {
			res.send(err);
		} else {
			res.json(clients);
		}
	});

};

exports.findById = function(req, res) {
	Client.findById(req.params.client_id, function(err, client) {
		if (err)
			res.send(err);
		res.json(client);
	});

};

exports.updateClient = function(req, res) {

	Client.findById(req.params.client_id, function(err, client) {
		if (err) {

			res.send(err);
		}
		client.company = req.body.company;
		client.contact = req.body.contact;
		client.phone = req.body.phone;
		client.mail = req.body.mail;
		client.save(function(err) {
			if (err) {
				res.send(err);
			}

			res.json(client);
		});

	});

};
exports.delete = function(req, res) {


	Client.remove({
		_id: req.params.client_id
	}, function(err, client) {
		if (err)
			res.send(err);


		res.json({
			message: client.title + ' successfully deleted'
		});
	});

};

exports.getByName = function(req, res) {

	Client.find({
		title: new RegExp(req.params.title, 'i')
	}, function(err, client) {
		if (err)
			res.send(err);
		res.json(client);
	});

};