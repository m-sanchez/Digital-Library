/**
 * Created by miguelsanchez on 18/8/15.
 */
module.exports = function(router, authrouter) {
	var codes = require('../controllers/code.controller');

	authrouter.route('/codes').post(codes.create).get(codes.getByClient);

	router.route('/codes/check').post(codes.checkCode);
	
	router.route('/codes/activate').post(codes.activateCode);

	authrouter.route('/codes/:code_id').get(codes.findById).put(codes.update).delete(codes.delete);

	authrouter.route('/codes/csv').get(codes.generateAllCodesCSV);
	authrouter.route('/codes/csv/:code_id').get(codes.generateCodeCSV);
};