angular.module('auto-complete', []).directive('autoComplete', function($parse, $compile) {
    var template = '<div class="ngAutocomplete" ng-show="suggestions.visible">' +
                   '  <ul class="suggestions">' +
                   '    <li class="suggestion" ng-repeat="item in suggestions.items" ng-class="getCssClass(item)">{{ item }}</li>' +
                   '  </ul>' +
                   '</div>';

    function loadOptions(scope, attrs) {
        scope.options = {
            loadFn: attrs.autoComplete ? $parse(attrs.autoComplete)(scope) : null
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
                index: -1,
                selected: null,

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
                },
                next: function() {
                    $scope.suggestions.select(++$scope.suggestions.index);
                },
                prior: function() {
                    $scope.suggestions.select(--$scope.suggestions.index);
                },
                select: function(index) {
                    if (index < 0) {
                        index = $scope.suggestions.items.length - 1;
                    }
                    else if (index >= $scope.suggestions.items.length) {
                        index = 0;
                    }
                    $scope.suggestions.index = index;
                    $scope.suggestions.selected = $scope.suggestions.items[$scope.suggestions.index];
                }
            };

            $scope.loadSuggestions = function(text) {
                if ($scope.suggestions.selected === text) {
                    return;
                }
                $scope.suggestions.load(text);
            };

            $scope.showSuggestions = function () {
                $scope.suggestions.show();
            };

            $scope.hideSuggestions = function() {
                $scope.suggestions.hide();
            };

            $scope.nextSuggestion = function() {
                if ($scope.suggestions.visible) {
                    $scope.suggestions.next();
                }
                else {
                    $scope.loadSuggestions('');
                }
            };

            $scope.priorSuggestion = function() {
                $scope.suggestions.prior();
            };

            $scope.selectSuggestion = function(index) {
                $scope.suggestions.select(index);
            };

            $scope.addSuggestion = function(ngModel) {
                ngModel.$setViewValue($scope.suggestions.selected);
                ngModel.$render();

                $scope.hideSuggestions();
            };

            $scope.getCssClass = function(item) {
                return $scope.suggestions.selected === item ? 'selected' : '';
            };
        },
        link: function (scope, element, attrs, ngModel) {
            var suggestions = $compile(template)(scope);
            suggestions.css('width', element[0].offsetWidth + 'px');

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
                var keys = { downArrow: 40, upArrow: 38, enter: 13, escape: 27 };

                var apply = false;

                if (e.keyCode === keys.downArrow) {
                    scope.nextSuggestion();
                    apply = true;
                }
                else if (e.keyCode === keys.upArrow) {
                    scope.priorSuggestion();
                    apply = true;
                }
                else if (e.keyCode === keys.escape) {
                    scope.hideSuggestions();
                    apply = true;
                }
                else if (e.keyCode === keys.enter) {
                    scope.addSuggestion(ngModel);
                    apply = true;
                }

                if (apply) {
                    scope.$apply();
                }
            });

            element.bind('blur', function() {
                scope.hideSuggestions();
                scope.$apply();
            })
        }
    };
});