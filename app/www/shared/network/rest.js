(function() {
	'use strict';

	// Declaration of the service's module
	angular.module('slash.fw.rest', [])

	.provider("rest", function(){
		// Each method returns a $q promise.
		var service = {
			get: function(url, options){
				return sendRequest("get", url, null, options);
			},
			post: function(url, data, options){
				return sendRequest("post", url, data, options);
			},
			put: function(url, data, options){
				return sendRequest("put", url, data, options);
			},
			remove: function(url, options){
				return sendRequest("delete", url, null, options);
			},
			// Used p.e. to resend requests.
			sendRequest: function(req){
				return sendRequest(req.method, req.url, req.data, req.options);
			}
		}

		/*
			This class is module-extensible by interceptors.
			Interceptors can get called:
			- Before the request is executed. It allows to:
				. Cancel the request.
				. Modify the request.
			- After the request is sent. It allows to:
				. Modify the response, even the status code.

			When you register an interceptor, you pass two functions, one for before and one for after. Each function:
			- Takes 2 parameters:
				. Request: {
					"url",
					"method",
					"data",
					"headers",
					"options" // Object for passing custom options for interceptors (p.e., showLoading). Also, may contain Headers to put in the request and a custom timeout
				}
				. Response: { // Only for 'after'
					"statusCode",
					"data",
					"headers"
				}
			- Returns:
				- false to cancel the request. // Only for 'before'
				- A promise that returns or the modified (or not) request object, for 'before'.
				- A promise that returns or the modified (or not) response object, for 'after'.

			Note that 'before' interceptors are handled in the order they are received, and 'after' interceptors in reverse order (just like push & pop)
			If one before interceptor cancels the call, it will call all the executed interceptor's "after" with status = cancelled, including the interceptor that cancelled it.
		*/

		/*
			All the methods return promises. They are resolved if -and only if- statusCode > 0 and statusCode < 400, they are rejected otherwise.
			The status code can have 3 posible special values:
			- cancelled: Request cancelled by one interceptor.
			- timeout: Request timeout.
			- disconnected: (Unkown error, status = 0).
		*/

		var interceptors = [];
		var timeout = 25000;

		// Initialized once Angular calls $get. Safe to use.
		var _q;
		var _http; 

		this.addInterceptor = function(before, after){
			interceptors.push({
				before: before,
				after: after
			});
		}
		this.addBeforeInterceptor = function(before){
			this.addInterceptor(before, function(request, response){ return response; });
		}
		this.addAfterInterceptor = function(after){
			this.addInterceptor(function(request){ return request; }, after);
		}
		this.setTimeout = function(ms){
			timeout = ms;
		}

		var sendRequest = function(method, url, data, options){
			// Return value
			var deferred = _q.defer();

			// Parameter defaults
			data = data || {};
			options = options || {
				headers: {}
			}

			// Create request object
			var request = {
				"url": url,
				"method": method,
				"data": data,
				"options": options
			}
			request.options.timeout = request.options.timeout || timeout;

			/*
				Execute before interceptors.
				We need to chain the promises. As we don't know if the interceptors return a promise
				or the object, we use _q.when() to wrap 'whatever' into a promise.
				i_int will point the next interceptor we have to execute.

				Once we are done, we will call doRequest() to follow the pipeline.
			*/
			var i_int = 0;
			var cancelled = false;
			function nextBefore(request){
				if(i_int >= interceptors.length || cancelled){
					if(cancelled){
						// The last interceptor (i_int-1) has cancelled the request

						var response = {
							"statusCode": "cancelled",
							"data": {},
							"headers": {}
						}
						
						// We call the interceptors in reverse order
						nextAfter(response, i_int);
					}else{
						doRequest();
					}
				}else{
					var interceptor = interceptors[i_int];

					_q.when(interceptor.before(request)).then(function(new_req){
						if(new_req){
							request = new_req;
						}else if(new_req == false){ // If new_req is undefined don't cancel it.
							cancelled = true;
						}
						nextBefore(request);
					});
					
					i_int++;
				}				
			}
			function nextAfter(response, i_int){
				i_int--;
				if(i_int < 0){
					resolveDeferred(response);
				}else{
					var interceptor = interceptors[i_int];
					var promise = _q.when(interceptor.after(request, response));
					promise.then(function(new_resp){
						if(new_resp){
							response = new_resp;
						}
						nextAfter(response, i_int);
					});
				}
			}
			nextBefore(request);

			// Send request with $http service.
			var config = {};
			function doRequest(){
				var startTime = new Date().getTime();
				//console.log("Load " + request.url);

				config = {
					method: request.method,
					url: request.url,
					timeout: request.options.timeout,
					data: request.data,
					headers: request.options.headers,
					responseType: request.options.responseType
				};

				_http(config).success(function(data, status, header, config, statusText){
					finish({
						"statusCode": status,
						"data": data,
						"headers": header()
					});
				}).error(function(data, status, header, config, statusText){
					var respTime = new Date().getTime() - startTime;
					if (status == 0 && respTime >= config.timeout) {
						finish({
							"statusCode": "timeout",
							"data": data,
							"headers": header()
						});
					} else {
						if(status == 0) status = "disconnected";

						finish({
							"statusCode": status,
							"data": data,
							"headers": header()
						});
					}
				});
			}

			// Last step: call 'after' interceptors and return response.
			function finish(response){
				// Call interceptors in reverse order.
				var i_int = interceptors.length;
				function next(response){
					i_int--;
					if(i_int < 0){
						resolveDeferred(response);
					}else{
						var interceptor = interceptors[i_int];
						var promise = _q.when(interceptor.after(request, response));
						promise.then(function(new_resp){
							if(new_resp){
								response = new_resp;
							}
							next(response);
						});
					}
				}
				next(response);
			}

			function resolveDeferred(response){
				// Once we are done, resolve or reject depending on statusCode.
				if(typeof response.statusCode == "number" && response.statusCode < 400){
					deferred.resolve(response);
				}else{
					deferred.reject(response);
				}
			}

			var promise = deferred.promise;

			promise.success = function(fn) {
				promise.then(function(response) {
					fn(response.data, response.status, response.headers, config);
				});
				return promise;
			};

			promise.error = function(fn) {
				promise.then(null, function(response) {
					fn(response.data, response.status, response.headers, config);
				});
				return promise;
			};

			return promise;
		}

		this.$get = function($q, $http){
			_q = $q;
			_http = $http;

			return service;
		}
	});
})();