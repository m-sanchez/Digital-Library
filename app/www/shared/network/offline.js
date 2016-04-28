// Needs plugin cordova-plugin-network-information

(function() {
	'use strict';

	var onlineDefault = false;
	var actionFnQueue = [];

	var offline = null;
	var _q;

	// Declaration of the service's module
	angular.module('slash.fw.offline', ["slash.fw.rest"])

	// Services
	.provider('offline', function() {
		offline = {
			getConnection: function(){
				if(window.navigator.connection && window.navigator.connection.type){
					if(!window.Connection){
						window.Connection = {
							WIFI: "wifi"
							// TODO others
						}
					}
					var state = window.navigator.connection.type;
					if(state == Connection.UNKNOWN) return "unknown";
					if(state == Connection.ETHERNET) return "ethernet";
					if(state == Connection.WIFI) return "wifi";
					if(state == Connection.NONE) return "none";
					return "cell";
				}else{
					// Desktop
					return window.navigator.onLine ? "unknown" : "none";
				}
			},
			isConnected: function(){
				return offline.getConnection() != "none";
			},
			doIfOnline: function(fn){
				/* Only calls fn if we're online at this moment.
				Returns wether the function has been called.
				*/
				if(offline.isConnected()){
					fn();
					return true;
				}else{
					return false;
				}
			},
			doWhenOnline: function(fn){
				// Calls fn when we're online

				if(offline.isConnected()){
					fn();
				}else{
					actionFnQueue.push(fn);
				}
			},
			sendWhenOnline: function(request){
				// TODO. This should be persistent after killing the app (i.e. store the request in localStorage or something and send it when we're online... Kinda like ClickEdu)
				// For this reason, we can't have a callback (callbacks can't be stored in localstorage unless they're really isolated)
			},

			_tryFlush: function(){
				if(offline.isConnected() && actionFnQueue.length > 0){
					var fn = actionFnQueue.shift();
					_q.when(fn()).then(offline._tryFlush);
				}
			}
		}

		this.setDefault = function(active){
			onlineDefault = active;
		}

		this.$get = function($q){
			_q = $q
			return offline;
		}
	})

	.config(function(restProvider){
		function requestWantsOnline(request){
			return request.options.sendWhenOnline || (onlineDefault && typeof(request.options.sendWhenOnline) == "undefined");
		}

		restProvider.addBeforeInterceptor(function(req){
			if(requestWantsOnline(req)){
				var deferred = _q.defer();

				offline.doWhenOnline(function(){
					deferred.resolve(req);
				});

				// Rest will wait the promise to fulfill.
				return deferred.promise;
			}else{
				return req;
			}
		});
	})

	.run(function($ionicPlatform, offline){
		$ionicPlatform.ready(function() {
			document.addEventListener("online", offline._tryFlush, false);
		});
	});
})();