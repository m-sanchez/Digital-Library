/**
 * Created by miguelsanchez on 18/8/15.
 */
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');


var Category = mongoose.model('Category');

/**
 * Create a category
 */
exports.create = function(req, res) {

	var category = new Category(); // create a new instance of the Category model
	category.name = req.body.name; // set the categories title (comes from the request)
	category.save(function(err) {
		if (err) {
			res.send(err);
		} else {
			res.json(category);
		}
	});

};

exports.getAll = function(req, res) {

	Category.find(function(err, categories) {
		if (err) {
			res.send(err);
		} else {
			res.json(categories);
		}
	});

};

exports.findById = function(req, res) {
	Category.findById(req.params.category_id, function(err, category) {
		if (err)
			res.send(err);
		res.json(category);
	});

};

exports.updateCategory = function(req, res) {
	Category.findById(req.params.category_id, function(err, category) {
		if (err) {

			res.send(err);
		}
		category.name = req.body.name;
		category.save(function(err) {
			if (err) {
				res.send(err);
			}
			res.json(category);
		});

	});

};
exports.delete = function(req, res) {


	Category.remove({
		_id: req.params.category_id
	}, function(err, category) {
		if (err)
			res.send(err);


		res.json({
			message: category.title + ' successfully deleted'
		});
	});

};

exports.getByName = function(req, res) {

	Category.find({
		title: new RegExp(req.params.title, 'i')
	}, function(err, category) {
		if (err)
			res.send(err);
		res.json(category);
	});

};