/**
 * Created by miguelsanchez on 19/8/15.
 */
module.exports = function(router, authrouter) {
	var categories = require('../controllers/categories.controller');

	authrouter.route('/categories').post(categories.create).get(categories.getAll);

	authrouter.route('/categories/:category_id').get(categories.findById).delete(categories.delete).put(categories.updateCategory);
};