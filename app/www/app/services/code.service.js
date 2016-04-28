(function (){
	angular.module('slash.bdigital')

	.factory('codeService', function(rest,$rootScope,$q){
		
		return{
			checkCode: function(){
				var deferred = $q.defer();
				var promise = deferred.promise;
				var a;
				
				//check if codeValid is true in localStoragea
				$rootScope.codeValid = (window.localStorage.codeValid == "true");
				console.log($rootScope.codeValid ? "Content unlocked for this device" : "Content locked for this device");

				rest.post("/codes/check", null, {
					sendWhenOnline: true,
					loading: false
				}).then(function(result){
					$rootScope.codeValid = (result.data.message == "VALID");

					console.log($rootScope.codeValid ? "Content unlocked for this device" : "Content locked for this device");

					if($rootScope.codeValid) window.localStorage.codeValid = "true"; 
					else window.localStorage.removeItem("codeValid");

					deferred.resolve($rootScope.codeValid);
				});

				return promise;
				
			},
			validCode: function(codeId){
				var deferred=$q.defer();
				var promise=deferred.promise;

				rest.post("/codes/activate",{"code":codeId}).then(function(data){
					deferred.resolve(data.data.message);
				});
				return promise;
			}
		}
	})

})();