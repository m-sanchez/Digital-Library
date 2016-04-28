'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose');
var Q = require('q');
var Code = mongoose.model('Code');
var json2csv = require('json2csv');
var fs = require('fs');
var Client = mongoose.model('Client');


var generateCodePackage = function() {
	var code = randomString(3);
	var deferred = Q.defer();
	Code.find({
		'codePackage': code
	}, function(err, clients) {
		if (err) {
			res.send(err);
		} else {
			if (clients.length == 0) {
				deferred.resolve(code)
			} else {
				deferred.resolve(generateCodePackage());
			}
		}
	});
	return deferred.promise;
}
var randomString = function(length) {
	var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
	return result;
}

var generateCodeSingle = function(array) {
	var codeNew = randomString(3);
	if (array.indexOf(codeNew) == -1) {
		return codeNew;
	} else {
		return generateCodeSingle(array);
	}
}
var generateArrayCodes = function(number) {
	var i = 0;
	var codesSimple = [];
	var codes = [];
	while (i < number) {
		var code = generateCodeSingle(codesSimple);
		codesSimple.push(code);
		codes.push({
			code: code,
			activatedBy: null
		});
		i++;
	}
	return codes;
}

exports.create = function(req, res) {
	Client.findById(req.body.client_id, function(err, client) {
		if (err) {activateCode
			res.send(err);
		} else {
			var codes = [];
			var code = new Code();
			code.startDate = new Date(req.body.startDate);
			code.endDate = new Date(req.body.endDate);
			code.Number = req.body.number;
			code.createdAt = new Date();
			code.description = req.body.description;
			code.number = req.body.number;
			generateCodePackage().then(function(data) {

				code.codePackage = data;
				code.codes = generateArrayCodes(code.Number);
				code.save();
				client.codePackages.push(code._id);
				client.save();
				res.json({
					'client': client,
					'code': code
				});
			})
		}
	});
};
exports.getByClient = function(req, res) {
	Client.findById(req.query.client_id).populate('codePackages', 'number startDate endDate number committed description').exec(function(err, client) {

		if (err)
			res.send(err);
		res.json(client.codePackages);


	});
}
exports.findById = function(req, res) {
	Code.findById(req.params.code_id, function(err, code) {
		if (err)
			res.send(err);
		res.json(code);
	});
};
exports.generateCodeCSV = function(req, res) {
	if(!req.query.client_id){
		return res.status(400).send();
	}

	Client.findById(req.query.client_id, function(err, client) {
		if (err) {
			res.send(err);
		} else {
			Code.findById(req.params.code_id, function(err, code) {
				if (err) {
					res.send(err);
				} else {
					var codesPopulated = [];
					code.codes.forEach(function(codeSingle) {
						codesPopulated.push({
							'paquete': code.description,
							'fecha inicio': code.startDate,
							'fecha fin': code.endDate,
							'code': client.codeClient + code.codePackage + codeSingle.code
						})
					})
					var fields = ['paquete', 'fecha inicio', 'fecha fin', 'code'];

					json2csv({
						data: codesPopulated,
						fields: fields
					}, function(err, csv) {
						if (err)
							console.log(err);
						res.send(csv);
					});
				}
			});
		}
	});
};


exports.generateAllCodesCSV = function(req, res) {
	if(!req.query.client_id){
		return res.status(400).send();
	}

	Client.findById(req.query.client_id).populate('codePackages').exec(function(err, client) {
		if (err) {
			res.send(err);
		} else {
			var codesPopulated = [];
			client.codePackages.forEach(function(codePackage) {
				codePackage.codes.forEach(function(codeSingle) {
					codesPopulated.push({
						'paquete': codePackage.description,
						'fecha inicio': codePackage.startDate,
						'fecha fin': codePackage.endDate,
						'code': client.codeClient + codePackage.codePackage + codeSingle.code
					})
				})
			})
			var fields = ['paquete', 'fecha inicio', 'fecha fin', 'code'];

			json2csv({
				data: codesPopulated,
				fields: fields
			}, function(err, csv) {
				if (err)
					console.log(err);
				res.send(csv);

			});
		}
	});
};
exports.update = function(req, res) {
	Code.findById(req.params.code_id, function(err, code) {
		if (err) {
			res.send(err);
		} else {
			code.startDate = new Date(req.body.startDate);
			code.endDate = new Date(req.body.endDate);
			code.committed = req.body.committed;
			code.description = req.body.description;
			code.save(function(err) {
				if (err) {
					res.send(err);
				} else {
					res.json({
						message: 'updated',
						code: code
					});
				}
			});
		}
	});
};

exports.delete = function(req, res) {
	Code.remove({
		_id: req.params.code_id
	}, function(err, client) {
		if (err) {
			res.send(err);
		} else {

			Client.findById(req.params.client_id, function(err, client) {

				if (err) {
					res.send(err);
				} else {

					var ind = client.codePackages.indexOf(req.params.code_id);

					if (ind > -1) {
						client.codePackages.splice(ind, 1);
					}

					client.save(function(error) {
						if (err) {
							res.send(err);
						} else {

							res.json({
								message: 'successfully deleted'
							});
						}
					})

				}

			});

		}

	});;
};

exports.checkCode = function(req, res) {
	if(req.auth.code){
		// Hide stuff...
		req.auth.code.codes = undefined;
		req.auth.code.codePackage = undefined;
		req.auth.code.number = undefined;

		res.json({
			message: "VALID",
			object: {
				_id: req.auth.code._id,
				description: req.auth.code.description,
				startDate: req.auth.code.startDate,
				endDate: req.auth.code.endDate
			}
		});
	}else{
		res.json({
			message: "NOT VALID"
		});
	}
};



exports.activateCode = function(req, res) {
	//console.log(req);
	var code = req.body.code;
	var deviceId = req.get("Device-token");

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
			
			if (client == null || client.codePackages.length == 0) {
				res.json({
					message: 'NOT_FOUND'
				});
			} else {
				var packageFound = client.codePackages[0];
				var result = packageFound.codes.filter(function(v) {
						return v.code === singleCode; // filter out appropriate one
					})[0] // get result and access foo property
				var currentDate = new Date();
				result.code = req.params.code;
				if (currentDate > packageFound.endDate) {
					res.json({
						message: 'EXPIRED'
					});
				} else if (currentDate < packageFound.startDate) {
					res.json({
						message: 'WAITING'
					});
				} else if (result.activatedBy != null) {
					res.json({
						message: 'NOT_AVAILABLE'
					});
				} else {
					result.activatedBy = deviceId;
					Code.findById(packageFound._id, function(err, codePackage) {
						codePackage.codes.filter(function(v) {
							return v.code === singleCode; // filter out appropriate one
						})[0].activatedBy = deviceId;

						codePackage.save(function(error) {
							if (error) {
								res.send(error);
							} else {

								res.json({
									message: 'OK'
								});
							}
						})
					})

				}
			}

		});
};