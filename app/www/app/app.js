(function() {

	var CLIENT_ID = "560a3cff1f229af2712fe3bf";
	var API_HOST = "http://bdigital-slash.cloud.slashpool.com";
	var API_PATH = API_HOST + "/api";

	angular.module('slash.bdigital', [
		'ionic',
		'pascalprecht.translate',
		'slash.fw.images',
		'slash.fw.rest',
		'slash.fw.offline',
		'slash.fw.really',
		'slash.bdigital.serverurl',
		'slash.bdigital.auth',
		'slash.fw.loading',
		'angular-coverflow',
		'slash.fw.filesystem',
		'ngTouchend'
	])
	.constant("client_id", CLIENT_ID)
	.constant("api_host", API_HOST)
	.constant("api_path", API_PATH)

	.run(function($ionicPlatform) {
		$ionicPlatform.ready(function() {
				
			// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
			// for form inputs)
			if (window.cordova && window.cordova.plugins.Keyboard) {
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			}
			if (window.StatusBar) {
				// org.apache.cordova.statusbar required
				StatusBar.hide();
			}
		});

		// Override the android hardware back button to click on backButtonBehavior element.
		$ionicPlatform.registerBackButtonAction(function(){
			var elem = document.querySelectorAll(".backButtonBehavior");
			for(var i=0; i<elem.length; i++){
				if(angular.element(elem[i]).hasClass("ng-hide"))
					continue;

				elem = elem[i];
				var evt = document.createEvent("MouseEvent");
				evt.initMouseEvent(
					"click",
					true /* bubble */, true /* cancelable */,
					window, null,
					0, 0, 0, 0, /* coordinates */
					false, false, false, false, /* Modifier keys */
					0, null
				);
				evt.isIonicTap = true;
				elem.dispatchEvent(evt);

				return;
			}
		},
		101);
	})
	.run(function($rootScope, codeService, popupService){
		codeService.checkCode().then(function(result){
			if(!result){
				if(window.localStorage.loginOmitted) return;

				popupService.popup('login', $rootScope);
				window.localStorage.loginOmitted = "true";
			}
		});
	})
	.config(function($urlRouterProvider, $ionicConfigProvider) {
		$urlRouterProvider.otherwise('/covers');
		console.log("Nocache")
		$ionicConfigProvider.views.maxCache(0);
	})
	.config(function( $compileProvider )
		{   
		$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|filesystem|file):/);
		// Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
		}
	);


	angular.module('pascalprecht.translate')
	.config(function($translateProvider) {
		var preferredLang = function() { 
			var supportedLang = ['en'];
			var forSpanishLang = []; // 'ca', 'gl', 'eu'];
			var defaultLang = 'en';
			var currentLang = navigator.language || navigator.userLanguage;
			
			if (!currentLang) currentLang = '';
			currentLang = currentLang.substr(0, 2).toLowerCase();

			// To know if a lang is supported or not (supported = true OR false)
			var supported = supportedLang.indexOf(currentLang) > -1;
			var toSpanish = forSpanishLang.indexOf(currentLang) > -1;

			var preferredLangKey;
			if (supported) {
				preferredLangKey = currentLang;
			}else if (!supported && toSpanish)  {
				preferredLangKey = 'es';
			} else {
				preferredLangKey = defaultLang;
			}

			return preferredLangKey;
		}
		
		$translateProvider.useSanitizeValueStrategy('escaped');

		$translateProvider.useStaticFilesLoader({
			prefix: 'translations/lang-',
			suffix: '.json'
		});

		$translateProvider.determinePreferredLanguage(preferredLang);
	});
})();