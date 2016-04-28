(function(){
	'use strict';

	/* PUBLIC STUFF */

	var template = "shared/network/loading.html";
	var loadingDefault = true;
	var debounceTime = 0;
	var slShowLoading = false;

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

		$rootScope.loadingIsActive = function(){
			return (slShowLoading || slShowLoading === 0);
		}
		$rootScope.loadingIsIndeterminate = function(){
			return (slShowLoading === true);
		}


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
	var hiding = null;
	var settingProgress = null;
	var n = 0;
	var getStackTrace = function() {
		return (new Error()).stack;
	};
	var service = {
		push: function(){
			/*console.log("push " + n);
			console.log(getStackTrace());*/

			n++;

			if(n == 1){
				this.showLoading();
			}
		},
		pop: function(){
			/*console.log("pop " + n);
			console.log(getStackTrace());*/

			n--;
			
			if(n < 0){
				n = 0;
			}

			if(n == 0){
				this.hideLoading();
			}
		},
		showLoading: function(){
			/*console.log("show");
			console.log(getStackTrace());*/

			if(hiding){
				clearTimeout(hiding);
				hiding = null;
			}else{
				_timeout(function(){
					console.log("do show");
					slShowLoading = true;
				});
			}
		},
		hideLoading: function(){
			if(hiding) return;

			/*console.log("hide");
			console.log(getStackTrace());*/

			n = 0;

			hiding = setTimeout(function(){
				hiding = null;
				_timeout(function(){
					// console.log("do hide 1");
					// There's some kind of bug that although showLoading is false, loadingIsActive is called and returns false, ng-class won't remove the class, unless it's set to true and false again. Weird.
					slShowLoading = true;
					_timeout(function(){
						// console.log("do hide 2");
						slShowLoading = false;
					}, 100);
				}, 100);
			}, debounceTime);
		},
		setProgress: function(progress){
			/*console.log("progress");
			console.log(getStackTrace());*/

			if(settingProgress){
				_timeout.cancel(settingProgress);
			}

			settingProgress = _timeout(function(){
				settingProgress = null;

				if(slShowLoading === false){
					console.warn("No loading dialog, can't set progress");
					return;
				}

				slShowLoading = progress;
			});
		}
	}
	window.loading = service;

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