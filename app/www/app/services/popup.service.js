(function(){
	angular.module('slash.bdigital')

	//return a popup
	.factory('popupService', function($ionicPopup, $rootScope, codeService){
		var loginPopup = null;

		return {
			popup: function (name, $scope, callback){
				callback = callback || function(){};

				var template,css,subtitle,title;
				var popup={};

				if (name == "login"){
					var popupScope = $scope.$new(true);

					popupScope.validateCode = function(codeId){
						codeId = codeId || "";
						if(codeId.length == 0) return;

						codeService.validCode(codeId).then(function(stateCode){
							switch (stateCode){
								case 'NOT_FOUND':
									console.log('NOT_FOUND');
									$scope.login=false;
									break;
								case 'WAITING':
									console.log('OK');
									break;
								case 'EXPIRED':
									console.log('EXPIRED');
									break;
								case 'NOT_AVAILABLE':
									console.log('NOT_AVAILABLE');
									break;
								case 'OK':
									console.log('OK');
									$rootScope.codeValid=true;
									window.localStorage.codeValid=true;
									callback(true);

									popupScope.closePopup();
									break;
								default:
									break;
							}
						});
					}
					popupScope.closePopup = function(){
						loginPopup.close();
						loginPopup = null;
					}

					popup = {
						templateUrl: "app/login/contentLogin.html",
						cssClass: "custom-popup",
						subTitle: 'LIBROS DE EMPRESA', // $translate.instant("popup-title")
						title: 'Planeta',
						scope: popupScope
					}

					if(loginPopup){
						loginPopup.close();
					}
					loginPopup = $ionicPopup.show(popup);
				}
			}

		}
	
	})
})();