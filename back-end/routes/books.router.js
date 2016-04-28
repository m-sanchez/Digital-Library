/**
 * Created by miguelsanchez on 18/8/15.
 */
module.exports = function(router, authrouter) {
	var books = require('../controllers/books.controller');

	authrouter.route('/books').post(books.create).get(books.getAll);

	authrouter.route('/books/:book_id').get(books.findById).put(books.update).delete(books.delete);

	authrouter.route('/books/cover').post(books.uploadCover);

	authrouter.route('/books/file').post(books.uploadBook);

	authrouter.route('/books/name/:name').get(books.getByName);

	router.route('/books/:book_id/file').get(books.getBookFile)
};