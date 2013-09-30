angular.module('auto-complete', []).directive('autoComplete', function($parse, $compile) {
    var template =
        '<div class="ngAutocomplete" ng-show="suggestions.visible">' +
        '  <ul class="suggestions">' +
        '    <li class="suggestion" ng-repeat="item in suggestions.items"' +
        '                           ng-class="getCssClass(item)"' +
        '                           ng-click="addSuggestion()"' +
        '                           ng-mouseenter="selectSuggestion($index)">{{ item }}</li>' +
        '  </ul>' +
        '</div>';

    function loadOptions(scope, attrs) {
        scope.options = {
            loadFn: attrs.autoComplete ? $parse(attrs.autoComplete)(scope) : null
        };
    }

    function Suggestions(loadFn) {
        var self = this;

        self.loadFn = loadFn;
        self.items = [];
        self.visible = false;
        self.index = -1;
        self.selected = null;

        self.show = function() {
            self.visible = true;
        };
        self.hide = function() {
            self.visible = false;
        };
        self.load = function(text) {
            loadFn(text).then(function(items) {
                self.items = items;
                self.visible = items.length > 0;
            });
        };
        self.next = function() {
            self.select(++self.index);
        };
        self.prior = function() {
            self.select(--self.index);
        };
        self.select = function(index) {
            if (index < 0) {
                index = self.items.length - 1;
            }
            else if (index >= self.items.length) {
                index = 0;
            }
            self.index = index;
            self.selected = self.items[index];
        };
    }

    return {
        restrict: 'A',
        require: '?ngModel',
        scope: true,
        controller: function($scope, $attrs, $element) {
            loadOptions($scope, $attrs);

            $scope.suggestions = new Suggestions($scope.options.loadFn);

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

            $scope.addSuggestion = function() {
                $scope.ngModel.$setViewValue($scope.suggestions.selected);
                $scope.ngModel.$render();

                $scope.hideSuggestions();

                $element[0].focus();
            };

            $scope.getCssClass = function(item) {
                return $scope.suggestions.selected === item ? 'selected' : '';
            };
        },
        link: function (scope, element, attrs, ngModel) {
            scope.ngModel = ngModel;

            ngModel.$parsers.unshift(function(viewValue) {
                if (viewValue) {
                    scope.loadSuggestions(viewValue);
                } else {
                    scope.hideSuggestions();
                }

                return viewValue;
            });

            element.bind('keydown', function(e) {
                var keys = {
                    downArrow: 40, upArrow: 38, enter: 13, escape: 27, tab: 9,
                    isHotkey: function(key) {
                        for (var k in keys) {
                            if (keys.hasOwnProperty(k) && keys[k] === key)
                                return true;
                        }
                        return false;
                    }
                };

                if (!keys.isHotkey(e.keyCode)) {
                    return;
                }

                if (e.keyCode === keys.downArrow) {
                    scope.nextSuggestion();
                }
                else if (e.keyCode === keys.upArrow) {
                    scope.priorSuggestion();
                }
                else if (e.keyCode === keys.escape) {
                    scope.hideSuggestions();
                }
                else if (e.keyCode === keys.enter || e.keyCode === keys.tab) {
                    scope.addSuggestion();
                }

                scope.$apply();
            });

            element.bind('blur', function() {
                scope.hideSuggestions();
                scope.$apply();
            });

            var suggestions = $compile(template)(scope);
            suggestions.css('width', element[0].offsetWidth + 'px');
            element.after(suggestions);
        }
    };
});