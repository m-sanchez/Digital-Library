(function() {
	'use strict';

	// Declaration of the service's module
	angular.module('slash.fw.utils', ['ngCordova'])

	// Services
	.factory('utils', function($ionicPopup, $translate, $ionicScrollDelegate) {
		var popup = null;
		var popupText = "";
		var defaultPopupTitle = "Slashmobility";

		return {
			/**
				Returns the number with at least 2 digits, by adding trailing zeros.
			*/
			to2Digits : function(number){
				if(number < 10) return "0" + number;
				return number;
			},

			/**
				Returns a MOCKED date that when printed with the default locale will show the time in the zone wanted
				Requires moment.js library with timezone data: http://momentjs.com/
			*/
			changeTimezone : function(date, timezone){
				var aux = moment(date);
				aux.tz(timezone);
				return new Date(aux.year(), aux.month(), aux.date(), aux.hour(), aux.minute(), aux.second());
			},

			reverseTimezone : function(date, timezone){
				var localOffset = moment().zone(); // In minutes
				var tzOffset = moment().tz(timezone).zone(); // In minutes

				var fakeUtcTime = date.getTime();
				var utcTime = fakeUtcTime + (tzOffset - localOffset) * 60000;
				return new Date(utcTime);
			},

			getTimezoneAbbr : function(timezone){
				if(typeof(timezone) == 'undefined') return "";
				return moment.tz(timezone).format("z");
			},

			/**
				Shows a confirm box.
				Callback is a function whose argument is a boolean representing the response of the user.
			*/
			confirm : function(title, translate, callback, options){
				title = title || defaultPopupTitle;
				options = options || {};
				var text = $translate.instant(translate);

				options.title = title;
				options.template = text;
				if(!options.okText) options.okText = "Yes"; // TODO Locale

				function showConfirm(){
					popupText = text;
					popup = $ionicPopup.confirm(options).then(function(res){
						popup = null;
						callback(res);
					});
				}

				if(popup != null){
					if(popupText == text)
						popup.then(callback);
					else
						popup.then(showConfirm);
				}else{
					showConfirm();
				}
			},

			/**
				Shows an alert box.
			*/
			alert : function(title, translate, callback, options){
				callback = callback || function(){};
				title = title || defaultPopupTitle;
				options = options || {};

				var text = $translate.instant(translate);

				options.title = title;
				options.template = text;

				function showAlert(){
					popupText = text;
					popup = $ionicPopup.alert(options).then(function(){
						popup = null;
						callback();
					});
				}

				if(popup != null){
					if(popupText == text)
						popup.then(callback);
					else
						popup.then(showAlert);
				}else{
					showAlert();
				}
			},

			scrollToBottom: function(){
				$ionicScrollDelegate.resize().then(function(){
					$ionicScrollDelegate.scrollBottom(true); // true means animate the scroll
				});
			}
		}
	})
	
	// DatePicker component (Available in this repo)
	.directive('datePicker', function($cordovaDatePicker, utils){
		return {
			restrict: 'E',
			scope: {
				ngModel: '='
			},
			template:
				'<div ng-if="isNative" ng-bind="dateToLocaleString(ngModel)" ng-click="openDatePicker()"></div>' +
				'<input ng-if="!isNative" type="date" ng-model="protectedModel.date" />',
			link: function($scope, element, attrs){
				function dateToString(date){
					return date.getFullYear() + "-" + utils.to2Digits(date.getMonth() + 1) + "-" + utils.to2Digits(date.getDate());
				}
				function stringToDate(str){
					return new Date(str);
				}

				$scope.dateToLocaleString = function(date){
					return utils.to2Digits(date.getDate()) + "/" + utils.to2Digits(date.getMonth() + 1) + "/" + date.getFullYear();
				}

				$scope.isNative = typeof window.cordova != "undefined";

				if(!$scope.isNative){
					$scope.protectedModel = {
						date: null
					}

					$scope.$watch('ngModel', function(){
						$scope.protectedModel.date = dateToString($scope.ngModel);
					})
					$scope.$watch('protectedModel.date', function(){
						$scope.ngModel = stringToDate($scope.protectedModel.date);
					});
				}

				$scope.openDatePicker = function(){
					$cordovaDatePicker.show({
						date: $scope.ngModel,
						mode: 'date'
					}).then(function(date){
						if(!isNaN(date.getTime())) // Else it means it's cancelled.
							$scope.ngModel = date;
					});
				}
			}
		}
	})
	.directive('timePicker', function($cordovaDatePicker, utils){
		return {
			restrict: 'E',
			scope: {
				ngModel: '='
			},
			template:
				'<div ng-if="isNative" ng-bind="dateToLocaleString(ngModel)" ng-click="openTimePicker()"></div>' +
				'<input ng-if="!isNative" type="time" ng-model="protectedModel.date" />',
			link: function($scope, element, attrs){
				function dateToString(date){
					return utils.to2Digits(date.getHours()) + ":" + utils.to2Digits(date.getMinutes());
				}
				function stringToDate(str){
					if(!str) return null;

					var ret = new Date();
					var time = str.split(":");
					ret.setHours(time[0]);
					ret.setMinutes(time[1]);

					return ret;
				}

				$scope.dateToLocaleString = function(date){
					if(!date) return "--:--";
					return dateToString(date);
				}

				$scope.isNative = typeof window.cordova != "undefined";

				if(!$scope.isNative){
					$scope.protectedModel = {
						date: null
					}

					$scope.$watch('ngModel', function(){
						if($scope.ngModel)
							$scope.protectedModel.date = dateToString($scope.ngModel);
					})
					$scope.$watch('protectedModel.date', function(){
						$scope.ngModel = stringToDate($scope.protectedModel.date);
					});
				}

				$scope.openTimePicker = function(){
					var date = $scope.ngModel ? $scope.ngModel : new Date();

					$cordovaDatePicker.show({
						date: date,
						mode: 'time'
					}).then(function(time){
						if(!isNaN(time.getTime())) // Else it means it's cancelled.
							$scope.ngModel = time;
					});
				}
			}
		}
	})
	;
})();