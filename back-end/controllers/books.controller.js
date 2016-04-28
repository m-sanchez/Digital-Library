/**
 * Created by miguelsanchez on 18/8/15.
 */
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var multer = require('multer');
var mkdirp = require('mkdirp');
var fs = require('fs');
var Q = require('q');
var Book = mongoose.model('Book');
var Client = mongoose.model('Client');

var rootDir = process.env.OPENSHIFT_DATA_DIR ? process.env.OPENSHIFT_DATA_DIR : "";

var uploadForCover = multer({
	storage: multer.diskStorage({
		destination: rootDir + 'public/src/uploads/covers/', // Passing a string will create the dirs for us
		filename: function(req, file, cb) {

			cb(null, req.body.id + '-' + Date.now() + '-' + file.originalname)
		}
	})
}).single('file');

var uploadForBook = multer({
	storage: multer.diskStorage({
		destination: rootDir + 'private/uploads/books/', // Passing a string will create the dirs for us
		filename: function(req, file, cb) {

			cb(null, req.body.id + '-' + Date.now() + '-' + file.originalname)
		}
	})
}).single('file');


function transformBookFile(book){
	book.bookFile = "/books/" + book._id + "/file";
	book.coverFile = book.coverFile.replace(rootDir + "public/src", "")
}

/**
 * Upload a cover
 */
exports.uploadCover = function(req, res) {
	uploadForCover(req, res, function(err) {
		if (err) {
			// An error occurred when uploading
			return res.json(err);
		}
		res.json(req.file.path);
		// Everything went fine
	})
};

/**
 * Upload a book
 */
exports.uploadBook = function(req, res) {
	uploadForBook(req, res, function(err) {
		if (err) {
			// An error occurred when uploading
			res.json(err);
		}
		res.json(req.file.path);
		// Everything went fine
	})
};
/**
 * Create a book
 */
exports.create = function(req, res) {
	var book = new Book(); // create a new instance of the Book model
	book.title = req.body.title; // set the books title (comes from the request)
	book.synopsis = req.body.synopsis;
	book.author = req.body.author;
	book.isDefault = req.body.isDefault;
	book.coverFile = req.body.cover;
	book.bookFile = req.body.file;
	book.category = req.body.category;
	var client_id = req.body.client_id;

	book.save(function(err) {
		if (err) {
			res.send(err);
		} else {
			Client.findById(client_id, function(err, client) {
				if (err) {
					res.send(err);
				} else {

					client.books.push(book._id);
					client.save(function(err) {
						if (err) {
							res.send(err);
						} else {
							res.json(book);
						}
					});
				}

			});


		}
	});

};

exports.getAll = function(req, res) {
	Book.find(function(err, books) {
		if (err) {
			res.send(err);
		} else {
			res.json(books);
		}
	});

};
exports.checkCodeAndDevice = function(code, deviceId, clientId) {
	return checkCode(code, deviceId, clientId);
}

var checkCode = function(code, deviceId, clientId) {
	var deferred = Q.defer();
	if (!code || !deviceId || !clientId) {

		deferred.resolve({
			res: false,
			message: 'PARAMETERS_MISSING'
		});
	} else {

		var fullCode = code;
		var codeClient = code.substring(0, 2);
		var codePackage = code.substring(2, 5);
		var singleCode = code.substring(5, 8);
		Client.findOne({
				'codeClient': codeClient
			})
			.populate({
				path: 'codePackages',
				match: {
					'codePackage': codePackage,
					'codes.code': singleCode
				},
				//select: 'codePackages',
				//options: {}
			})
			//.populate('codePackages')
			.exec(function(err, client) {
				if (client.codePackages.length == 0 || client._id != clientId) {
					deferred.resolve({
						res: false,
						message: 'NOT_FOUND'
					});
				} else {
					var packageFound = client.codePackages[0];
					var result = packageFound.codes.filter(function(v) {
							return v.code === singleCode; // filter out appropriate one
						})[0] // get result and access foo property
					var currentDate = new Date();

					if (currentDate > packageFound.endDate) {
						deferred.resolve({
							res: false,
							message: 'EXPIRED'
						});
					} else if (currentDate < packageFound.startDate) {
						deferred.resolve({
							res: false,
							message: 'WAITING'
						});
					} else if (result.activatedBy != deviceId) {
						deferred.resolve({
							res: false,
							message: 'NOT_AVAILABLE'
						});

					} else {
						deferred.resolve({
							res: true
						});
					}
				}

			});
	}
	return deferred.promise;
}

exports.findByClient = function(req, res) {
	Client.findById(req.params.client_id).populate('books category').exec(function(err, client) {
		if (err) {
			res.send(err);
		} else {
			if(!client){
				return res.status(400).send("CLIENT_NOT_FOUND");
			}

			var booksDefault = [];
			client.books.forEach(function(book) {
				transformBookFile(book);

				if(book.isDefault)
					booksDefault.push(book)
			});

			if(req.query.default === "true"){
				res.json(booksDefault);
			}else{
				res.json(client.books);
			}
		}
	});
};

exports.findByClientAndCode = function(req, res) {
	var param_code = req.body.code;
	var param_device = req.body.deviceId;
	checkCode(param_code, param_device, req.params.client_id).then(function(data) {
		if (data.res) {
			Client.findById(req.params.client_id).populate('books category').exec(function(err, client) {
				if (err) {
					res.send(err);
				} else {
					res.json(client.books);
				}
			});
		} else {
			res.send(403, {
				error: data.message
			});
		}
	});
};

exports.getDefaultBooks = function(req, res) {
	var from = req.params.from;
	var to = req.params.to;
	Book.find({
		isDefault: true
	}).exec(function(err, books) {
		if (err) {
			res.send(err);
		} else {
			res.json(books);
		}
	});

};

exports.findById = function(req, res) {
	Book.findById(req.params.book_id, function(err, book) {
		if (err)
			res.send(err);
		res.json(book);
	});

};

exports.update = function(req, res) {

	Book.findById(req.params.book_id, function(err, book) {

		if (err) {
			res.send(err);
		}
		if (req.body.coverEdited) {
			var filePath = book.coverFile;
			fs.unlinkSync(filePath);
			book.coverFile = req.body.cover;
		}
		if (req.body.bookEdited) {
			var filePath = book.bookFile;
			fs.unlinkSync(filePath);
			book.bookFile = req.body.file;
		}
		book.title = req.body.title;
		book.synopsis = req.body.synopsis;
		book.author = req.body.author;
		book.isDefault = req.body.isDefault;
		book.category = req.body.category;
		book.save(function(err) {
			if (err) {
				res.send(err);
			}

			res.json(book);
		});

	});

};
exports.delete = function(req, res) {
	Book.findById(req.params.book_id, function(err, book) {
		if (err)
			res.send(err);
		try {
			var filePath = book.coverFile;
			fs.unlinkSync(filePath);
			var filePath2 = book.bookFile;
			fs.unlinkSync(filePath2);
		} catch (e) {
		}

		Client.find({books: mongoose.Types.ObjectId(req.params.book_id)}, function(err, clients) {
			clients.forEach(function(client){
				if (err) {
					res.send(err);
				} else {
					var ind = client.books.indexOf(book._id);

					if (ind > -1) {
						client.books.splice(ind, 1);
					}
					client.save(function(err) {
						if (err) {
							res.send(err);
						} else {
							book.remove(
								function(err) {
									if (err) {
										res.send(err);
									} else {
										res.json({
											message: book.title + ' successfully deleted'
										});
									}
								}
							);
						}
					});
				}
			});
		});
		
	});

};

exports.getByName = function(req, res) {

	Book.find({
		title: new RegExp(req.params.title, 'i')
	}, function(err, book) {
		if (err)
			res.send(err);
		res.json(book);
	});

};


exports.getBookFile = function(req, res) {
	/* Things to check:
	1. req.auth.client must have this book
	AND {
		2. the book is flagged as default
		OR
		3. req.auth.code must be a code for req.auth.client
	}
	*/

	if(!req.auth.client){
		return res.status(403).send({
			error: "Invalid client"
		});
	}

	// 1. req.auth.client must have this book
	var bookFound = req.auth.client.books.some(function(book_id){
		return (book_id == req.params.book_id);
	});
	if(!bookFound){
		return res.status(404).send({
			error: "Client doesn't have this book"
		});
	}

	function redirectToFile(book){
		var options = undefined;
		if(book.bookFile.indexOf("/") != 0){
			options = {
				root: __dirname + "/.."
			}
		}
		return res.sendFile(book.bookFile, options);
	}

	return Book.findById(req.params.book_id, function(err, book){
		if(err){
			return res.status(404).send({
				error: "Book not found"
			});
		}

		// 2. the book is flagged as default
		if(book.isDefault){
			return redirectToFile(book);
		}

		// 3. req.auth.code must be a code for req.auth.client
		// We assume req.auth.code is valid (it's checked in credentials.js)
		var codeFound = req.auth.code && req.auth.client.codePackages.some(function(code_id){
			return (code_id == req.auth.code.id);
		});
		if(codeFound){
			return redirectToFile(book);
		}

		res.status(403).send({
			error: 'Invalid code'
		});
	});
}