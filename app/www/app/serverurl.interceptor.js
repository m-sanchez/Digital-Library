(function(){
	"use strict";

	var _api_path;

	angular.module('slash.bdigital.serverurl', [])
	.run(function(api_path){
		_api_path = api_path;
	})
	.config(function(restProvider){
		restProvider.addInterceptor(function(req){
			// Exclude absolute requests
			if(/^[^:/]+:\/\//.exec(req.url)){
				return req;
			}
			
			req.url = _api_path + req.url;

			return req;
		}, function(req, res){
			if(req.options.serverurl_orig){
				req.url = req.options.serverurl_orig;
			}
			return res;
		});
	});
})();