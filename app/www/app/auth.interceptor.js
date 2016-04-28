(function(){
	"use strict";

	var _client_id;
	var _device_token;

	angular.module('slash.bdigital.auth', [])
	.run(function($q, $ionicPlatform, client_id){
		_client_id = client_id;

		var deferred = $q.defer();
		$ionicPlatform.ready(function() {
			if(window.device && window.device.uuid){
				deferred.resolve(window.device.uuid);
			}else{
				deferred.resolve("desktop");
			}
		});
		_device_token = deferred.promise;
	})

	
	.config(function(restProvider){
		restProvider.addBeforeInterceptor(function(req){
			return _device_token.then(function(device_token){
				req.options.headers = req.options.headers || {};
				
				req.options.headers["Client-token"] = _client_id;
				req.options.headers["Device-token"] = device_token;

				return req;
			});
		});
	});
})();