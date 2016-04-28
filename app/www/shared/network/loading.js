(function(){
	'use strict';

	/* PUBLIC STUFF */

	var template = "shared/network/loading.html";
	var loadingDefault = true;
	var debounceTime = 0;


	// Declaration of the service's module
	var module = angular.module('slash.fw.loading', ["slash.fw.rest"])
	.provider("loading", function(){
		this.setTemplateUrl = function(url){
			template = url;
		}
		this.setLoadingDefault = function(loading){
			loadingDefault = loading;
		}
		this.setDebounceTime = function(ms){
			debounceTime = ms;
		}

		this.$get = function(){
			return service;
		}
	})
	.run(function($timeout, $rootScope, $templateRequest, $sce, $compile){
		_timeout = $timeout;
		_rootScope = $rootScope;

		var templateUrl = $sce.getTrustedResourceUrl(template);
		$templateRequest(templateUrl).then(function(template){
			var templateElement = angular.element(template);
			var loadingContainer = angular.element("<div></div>");

			loadingContainer.append(templateElement);
			$compile(loadingContainer.contents())($rootScope);

			angular.element(document.body).append(templateElement);
		});
	})

	var _timeout;
	var _rootScope;
	var hiding = null;
	var settingProgress = null;
	var n = 0;
	var service = {
		push: function(){
			n++;

			if(n == 1){
				this.showLoading();
			}
		},
		pop: function(){
			n--;
			
			if(n < 0){
				n = 0;
			}

			if(n == 0){
				this.hideLoading();
			}
		},
		showLoading: function(){
			if(hiding){
				clearTimeout(hiding);
				hiding = null;
			}else{
				_timeout(function(){

					_rootScope.showLoading = true;
				});
			}
		},
		hideLoading: function(){
			if(hiding) return;

			n = 0;

			hiding = setTimeout(function(){
				hiding = null;
				_timeout(function(){
					_rootScope.showLoading = false;
				});
			}, debounceTime);
		},
		setProgress: function(progress){
			// console.log(progress);
			if(settingProgress){
				_timeout.cancel(settingProgress);
			}

			settingProgress = _timeout(function(){
				settingProgress = null;

				if(_rootScope.showLoading === false){
					console.warn("No loading dialog, can't set progress");
					return;
				}

				_rootScope.showLoading = progress;
			});
		}
	}

	module.config(function(restProvider){
		function requestWantsLoading(request){
			return request.options.loading || (loadingDefault && typeof(request.options.loading) == "undefined");
		}

		restProvider.addInterceptor(function(request){
			/* In WP8 there's a bug with ionic that ngClick dispatches the event twice. And in angular there's a bug 
				 that if you make 2 identical requests very close to each other, then the promise never gets resolved,
				 making the loading window to get stuck.
				To solve this, if we detect two identical requests, we will cancel the last one, and at 'after' return
				 a promise that will be solved when the first request is solved.
				But we should put this in another interceptor to keep this one clean.
			*/
			if(requestWantsLoading(request))
				service.push();

			return request;
		}, function(request, response){
			if(requestWantsLoading(request))
				service.pop();

			return response;
		});
	});


})();