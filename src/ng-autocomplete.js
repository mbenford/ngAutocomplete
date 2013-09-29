angular.module('auto-complete', []).directive('autocomplete', function($parse, $compile) {
    var template =  '<div ng-show="suggestions.visible">' +
                    '  <ul>' +
                    '    <li ng-repeat="item in suggestions.items">{{ item }}</li>' +
                    '  </ul>' +
                    '</div>';

    function loadOptions(scope, attrs) {
        scope.options = {
            loadFn: attrs.autocomplete ? $parse(attrs.autocomplete)(scope) : null
        }
    }

    return {
        restrict: 'A',
        require: '?ngModel',
        scope: true,
        controller: function($scope, $attrs) {
            loadOptions($scope, $attrs);

            $scope.suggestions = {
                items: [],
                visible: false,

                show: function() {
                    $scope.suggestions.visible = true;
                },
                hide: function() {
                    $scope.suggestions.visible = false;
                },
                load: function(text) {
                    $scope.options.loadFn(text).then(function(items) {
                        $scope.suggestions.items = items;
                        $scope.suggestions.visible = items.length > 0;
                    });
                }
            };

            $scope.loadSuggestions = function(text) {
                $scope.suggestions.load(text);
            };

            $scope.showSuggestions = function () {
                $scope.suggestions.show();
            };

            $scope.hideSuggestions = function() {
                $scope.suggestions.hide();
            }
        },
        link: function (scope, element, attrs, ngModel) {
            var keys = { downArrow: 40 };

            var suggestions = $compile(template)(scope);
            element.after(suggestions);

            ngModel.$parsers.unshift(function(viewValue) {
                if (viewValue) {
                    scope.loadSuggestions(viewValue);
                } else {
                    scope.hideSuggestions();
                }

                return viewValue;
            });

            element.bind('keydown', function(e) {
                if (e.keyCode === keys.downArrow) {
                    scope.loadSuggestions('');
                    scope.$apply();
                }
            })
        }
    };
});
