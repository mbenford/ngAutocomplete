angular.module('auto-complete', []).directive('autoComplete', function($parse, $compile, $timeout, $document) {
    var template =
        '<div class="ngAutocomplete" ng-style="suggestions.style" ng-show="suggestions.visible">' +
        '  <ul class="suggestions">' +
        '    <li class="suggestion" ng-repeat="item in suggestions.items"' +
        '                           ng-class="{selected: item == suggestions.selected}"' +
        '                           ng-click="addSuggestion()"' +
        '                           ng-mouseenter="selectSuggestion($index)">{{ item }}</li>' +
        '  </ul>' +
        '</div>';

    var hotkeys = {
         9: { name: 'tab' },
        13: { name: 'enter' },
        27: { name: 'escape' },
        38: { name: 'up' },
        40: { name: 'down' }
    };

    function Suggestions(loadFn, element) {
        var self = this;

        var updateStyle = function() {
            $timeout(function() {
                self.style = {
                    width: element.prop('offsetWidth') + 'px',
                    left: element.prop('offsetLeft') + 'px'
                };
            });
        };

        self.reset = function() {
            self.items = [];
            self.visible = false;
            self.index = -1;
            self.selected = null;
        };
        self.show = function() {
            updateStyle();
            self.select(0);
            self.visible = true;
        };
        self.hide = function() {
            self.visible = false;
        };
        self.load = function(text) {
            loadFn(text).then(function(items) {
                self.items = items;
                if (items.length > 0) {
                    self.show();
                }
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

        updateStyle();
        self.reset();
    }

    function loadOptions(scope, attrs) {
        scope.options = {
            loadFn: attrs.autoComplete ? $parse(attrs.autoComplete)(scope) : null
        };
    }

    return {
        restrict: 'A',
        require: '?ngModel',
        scope: true,
        link: function (scope, element, attrs, ngModel) {
            loadOptions(scope, attrs);

            // Scope handling
            scope.suggestions = new Suggestions(scope.options.loadFn, element);

            scope.loadSuggestions = function(text) {
                if (scope.suggestions.selected === text) {
                    return;
                }
                scope.suggestions.load(text);
            };

            scope.showSuggestions = function () {
                scope.suggestions.show();
            };

            scope.hideSuggestions = function() {
                scope.suggestions.reset();
            };

            scope.nextSuggestion = function() {
                if (scope.suggestions.visible) {
                    scope.suggestions.next();
                }
                else {
                    scope.loadSuggestions('');
                }
            };

            scope.priorSuggestion = function() {
                scope.suggestions.prior();
            };

            scope.selectSuggestion = function(index) {
                scope.suggestions.select(index);
            };

            scope.addSuggestion = function() {
                ngModel.$setViewValue(scope.suggestions.selected);
                ngModel.$render();

                scope.hideSuggestions();

                element[0].focus();
            };
            
            ngModel.$parsers.unshift(function(viewValue) {
                if (viewValue) {
                    scope.loadSuggestions(viewValue);
                } else {
                    scope.hideSuggestions();
                }

                return viewValue;
            });

            // DOM events
            element.bind('keydown', function(e) {
                var key = hotkeys[e.keyCode];

                if (!key) {
                    return;
                }

                if (key.name === 'down') {
                    scope.nextSuggestion();
                    e.preventDefault();
                    scope.$apply();
                }
                else if (scope.suggestions.visible) {
                    if (key.name === 'up') {
                        scope.priorSuggestion();
                    }
                    else if (key.name === 'escape') {
                        scope.hideSuggestions();
                    }
                    else if (key.name === 'enter' || key.name === 'tab') {
                        scope.addSuggestion();
                    }
                    e.preventDefault();
                    scope.$apply();
                }
            });

            $document.bind('click', function(e) {
                if (scope.suggestions.visible) {
                    scope.hideSuggestions();
                    scope.$apply();
                }
            });

            var suggestions = $compile(template)(scope);
            element.after(suggestions);
        }
    };
});