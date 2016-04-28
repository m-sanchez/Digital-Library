(function(){
	angular.module('slash.bdigital')

	.controller("FaqsCtrl", function($scope,$translate,$state) {
		$scope.sections = [];

		$translate("faqs-faq-1-title").then(function(){
			var i=1;
			do {
				var titleToken = "faqs-faq-" + i + "-title";
				var contentToken = "faqs-faq-" + i + "-content";

				var title = $translate.instant(titleToken);
				if(title != titleToken){
					var content = $translate.instant(contentToken);
					var paragraphs = content.split("{nl}");

					$scope.sections.push({
						title: title,
						content: paragraphs
					});
					i++;
				}
			} while(title != titleToken);
		});

		/*
		* if given group is the selected group, deselect it
		* else, select the given group
		*/
		$scope.toggleGroup = function(faq) {
		if ($scope.isGroupShown(faq)) {
		  $scope.shownGroup = null;
		} else {
		  $scope.shownGroup = faq;
		}
		};
		$scope.isGroupShown = function(faq) {
		return $scope.shownGroup === faq;
		};

	})

	// Define routes
	.config(function($stateProvider) {
		$stateProvider
		.state('faqs', {
			url: "/faqs",
			templateUrl: "app/faqs/faqs.html",
			controller: 'FaqsCtrl'
		});
	});
})();