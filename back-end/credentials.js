var mongoose = require('mongoose');
var Client = mongoose.model('Client');
var Code = mongoose.model('Code');
var Admin = mongoose.model("Admin");
var Q = require("q");
var jwt = require("jwt-simple");

var BEARER_SECRET = "bdigital own secret :3";
var TOKEN_ALG = "HS256";

module.exports = function(router){
	router.route('/login').post(function(req, res, next){
		return Admin.findOne({username: req.body.email}, function(err, admin){
			if(err){
				return res.send(err);
			}

			if(!admin){
				return res.status(404).send("USER NOT FOUND");
			}

			if(!admin.checkPassword(req.body.password)){
				return res.status(401).send("WRONG PASSWORD");
			}

			var token = jwt.encode({
				id: admin._id,
				timestamp: new Date().getTime() // Ponemos un timestamp para si luego queremos deshabilitar los tokens antiguos, o que caduquen en un tiempo
			}, BEARER_SECRET, TOKEN_ALG);

			return res.send({
				token: token
			});
		});
	});

	// TODO Disable in pro!
	router.route('/register').post(function(req, res, next){
		var admin = new Admin();
		admin.username = req.body.email;
		admin.setPassword(req.body.password);
		return admin.save().then(function(){
			res.status(204).send();
		});
	});

	return {
		authenticate: function(req, res, next) {
			// Autenticar el usuario
			/* Hay tres autenticaciones:
				App
					- El usuario (tablet) se identifica como cliente, para poder acceder a los libros por defecto.
						=> Se hace con un "token" hardcodeado en la aplicacion que se cambiará para cada cliente.
						=> De momento lo planteo como "Client-token", que sera el _id del Cliente (a saco paco)
					- El usuario (tablet) se identifica como dispositivo, para poder saber si tiene acceso o no a los libros
						=> Para ello, en el modelo Codigo tenemos el campo "activatedBy".
						=> Acordarse de que los codigos solo pueden ser activados una sola vez, pero quien lo haya activado
							tendrá acceso a los libros mientras el Codigo sea vigente
						=> De momento lo planteo como "Device-token"
				Panel de Admin
					- Usuario/password normal para crear clientes, gestionar codigos y libros
						=> Lo dejo como "Authorization"
			*/
			var clientToken = req.get("Client-token");
			var deviceToken = req.get("Device-token");
			var adminToken = req.get("Authorization");

			req.auth = {
				client: false,
				code: false,
				admin: false
			}
			var promises = {
				client: Q.when(false),
				code: Q.when(false),
				admin: Q.when(false)
			}
			if (clientToken) {
				(function(){
					var deferred = Q.defer();

					Client.findById(clientToken, function(err, client) {
						if (err)
							return deferred.resolve(false);

						return deferred.resolve(client);
					});

					promises.client = deferred.promise;
				})();
			}
			if (deviceToken) {
				(function(){
					var deferred = Q.defer();

					Code.find({"codes.activatedBy": deviceToken}, function(err, codes){
						if(err)
							return deferred.resolve(false);

						// Encontrar un codigo vigente.
						var now = new Date();
						var found = codes.some(function(code) {
							if (code.startDate <= now && code.endDate >= now) {
								deferred.resolve(code);
								return true; // Salimos del loop
							}
							return false; // Seguimos el loop
						});

						if(!found){
							return deferred.resolve(false);	
						}
					});

					promises.code = deferred.promise;
				})();
			}
			if (adminToken) {
				try {
					var decoded = jwt.decode(adminToken, BEARER_SECRET, false, TOKEN_ALG);

					(function(){
						var deferred = Q.defer();

						Admin.findById(decoded.id, function(err, admin){
							if(err)
								return deferred.resolve(false);

							deferred.resolve(admin);
						});

						promises.admin = deferred.promise;
					})();
				}catch(ex){
					// Signatura invalida
				}
			}
			
			return Q.all([promises.client, promises.code, promises.admin]).then(function(result){
				req.auth.client = result[0];
				req.auth.code = result[1];
				req.auth.admin = result[2];

				return next();
			});
		}
	}
}