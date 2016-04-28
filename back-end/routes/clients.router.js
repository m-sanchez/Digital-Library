/**
 * Created by miguelsanchez on 19/8/15.
 */
module.exports = function(router, authrouter) {
	var clients = require('../controllers/clients.controller');
	var books = require('../controllers/books.controller');

	authrouter.route('/clients').post(clients.create).get(clients.getAll);
	authrouter.route('/clients/:client_id').put(clients.updateClient).delete(clients.delete);

	router.route('/clients/:client_id').get(clients.findById);
	router.route('/clients/:client_id/books').get(books.findByClient);
};