(function() {
'use strict';

describe('auto-complete-directive', function() {
    var ENTER = 13, BACKSPACE = 8, ESCAPE = 27, DOWN_ARROW = 40, UP_ARROW = 38;

    var $compile,
        $scope,
        $q,
        element,
        deferred;

    beforeEach(function() {
        module('auto-complete');

        inject(function(_$compile_, _$rootScope_, _$q_) {
            $scope = _$rootScope_;
            $compile = _$compile_;
            $q = _$q_;
        });

        deferred = $q.defer();
        $scope.loadItems = jasmine.createSpy().andReturn(deferred.promise);

        compile();
    });

    function compile(template) {
        template = template || '<input type="text" ng-model="value" auto-complete="loadItems">';

        element = $compile(template)($scope);
        $scope.$digest();
    }

    function getSuggestionsBox() {
        return element.next();
    }

    function getSuggestions() {
        return getSuggestionsBox().find('li');
    }

    function getSuggestion(index) {
        return getSuggestions().eq(index);
    }

    function getSuggestionText(index) {
        return getSuggestion(index).html();
    }

    function changeInputValue(value) {
        element.val(value);
        element.trigger('input');
    }

    function sendKeyPress(charCode) {
        var event = jQuery.Event('keypress', { charCode: charCode });

        element.trigger(event);
        if (!event.isDefaultPrevented()) {
            changeInputValue(element.val() + String.fromCharCode(charCode));
        }

        return event;
    }

    function sendKeyDown(keyCode) {
        var event = jQuery.Event('keydown', { keyCode: keyCode });
        element.trigger(event);

        return event;
    }

    function sendBackspace() {
        var event = sendKeyDown(BACKSPACE);
        if (!event.isDefaultPrevented()) {
            var value = element.val();
            changeInputValue(value.substr(0, value.length - 1));
        }
    }

    function resolve(items) {
        deferred.resolve(items);
        $scope.$digest();
    }

    function loadSuggestions(text, items) {
        element.scope().loadSuggestions(text);
        resolve(items);
    }

    describe('basic features', function() {
        it('ensures that the suggestions list is hidden by default', function() {
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('renders all elements returned by the load function', function() {
            // Act
            loadSuggestions('', ['Item1','Item2','Item3']);

            // Assert
            expect(getSuggestions().length).toBe(3);
            expect(getSuggestionText(0)).toBe('Item1');
            expect(getSuggestionText(1)).toBe('Item2');
            expect(getSuggestionText(2)).toBe('Item3');
        });

        it('shows the suggestions list when there are items to show', function() {
            // Act
            loadSuggestions('', ['Item1']);

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('');
        });

        it('hides the suggestions list when there is no items to show', function() {
            // Act
            loadSuggestions('', []);

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('hides the suggestion box when the input field becomes empty', function() {
            // Arrange
            element.scope().showSuggestions();
            $scope.$digest();

            // Act
            sendBackspace();

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('hides the suggestion box when the escape key is pressed', function () {
            // Arrange
            element.scope().showSuggestions();
            $scope.$digest();

            // Act
            sendKeyDown(ESCAPE);

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('hides the suggestion box when the input field loses focus', function() {
            // Arrange
            element.scope().showSuggestions();
            $scope.$digest();

            // Act
            element.trigger('blur');

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('adds the selected suggestion to the input field when the enter key is pressed and the suggestions box is visible', function () {
            // Arrange
            loadSuggestions('', ['Item1', 'Item2']);
            element.scope().showSuggestions();
            element.scope().selectSuggestion(0);

            // Act
            sendKeyDown(ENTER);

            // Assert
            expect(element.val()).toBe('Item1');
        });

        it('hides the suggestion box after adding the selected suggestion to the input field', function() {
            // Arrange
            loadSuggestions('', ['Item1', 'Item2']);
            element.scope().showSuggestions();
            element.scope().selectSuggestion(0);

            // Act
            sendKeyDown(ENTER);

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('calls the load function for every key pressed passing the input content', function() {
            // Act
            sendKeyPress(65);
            sendKeyPress(66);
            sendKeyPress(67);

            // Assert
            expect($scope.loadItems.callCount).toBe(3);
            expect($scope.loadItems.calls[0].args[0]).toBe('A');
            expect($scope.loadItems.calls[1].args[0]).toBe('AB');
            expect($scope.loadItems.calls[2].args[0]).toBe('ABC');
        });

        it('does not call the load function after adding the selected suggestion to the input field', function () {
            // Arrange
            loadSuggestions('', ['Item1', 'Item2']);
            element.scope().showSuggestions();
            element.scope().selectSuggestion(0);

            // Act
            sendKeyDown(ENTER);

            // Assert
            expect($scope.loadItems.callCount).toBe(1);
        });

        it('calls the load function passing the current input content when the down arrow key is pressed and the suggestions box is hidden', function() {
            // Act
            sendKeyDown(DOWN_ARROW);

            // Assert
            expect($scope.loadItems).toHaveBeenCalledWith('');
        });

        it('highlights the selected suggestion only', function() {
            // Arrange
            loadSuggestions('', ['Item1', 'Item2', 'Item3']);

            // Act
            element.scope().selectSuggestion(1);
            $scope.$digest();

            // Assert
            expect(getSuggestion(0).hasClass('selected')).toBe(false);
            expect(getSuggestion(1).hasClass('selected')).toBe(true);
            expect(getSuggestion(2).hasClass('selected')).toBe(false);
        });

        it('sets the suggestion box width as the input field width', function () {
            // Arrange
            var template = angular.element('<input type="text" ng-model="value" auto-complete="loadItems">');
            $(document.body).append(template);
            compile(template);
            element.scope().showSuggestions();

            // Act
            $scope.$digest();

            // Assert
            expect(element.next().outerWidth()).toBe(element.outerWidth());
        });
    });

    describe('navigation through suggestions', function() {
        beforeEach(function() {
            element.scope().showSuggestions();
        });

        describe('downward', function() {
            beforeEach(function() {
                element.scope().showSuggestions();
            });

            it('selects the first suggestion when the down arrow key is pressed and there\'s nothing selected', function() {
                // Arrange
                loadSuggestions('', ['Item1', 'Item2']);

                // Act
                sendKeyDown(DOWN_ARROW);

                // Assert
                expect(element.scope().suggestions.selected).toBe('Item1');
            });

            it('selects the next suggestion when the down arrow key is pressed and there\'s something selected', function() {
                // Arrange
                loadSuggestions('', ['Item1', 'Item2']);
                element.scope().selectSuggestion(0);

                // Act
                sendKeyDown(DOWN_ARROW);

                // Assert
                expect(element.scope().suggestions.selected).toBe('Item2');
            });

            it('selects the first suggestion when the down arrow key is pressed and the last item is selected', function() {
                // Arrange
                loadSuggestions('', ['Item1', 'Item2']);
                element.scope().selectSuggestion(1);

                // Act
                sendKeyDown(DOWN_ARROW);

                // Assert
                expect(element.scope().suggestions.selected).toBe('Item1');
            });
        });

        describe('upward', function() {
            it('selects the last suggestion when the up arrow key is pressed and there\'s nothing selected', function() {
                // Arrange
                loadSuggestions('', ['Item1', 'Item2']);

                // Act
                sendKeyDown(UP_ARROW);

                // Assert
                expect(element.scope().suggestions.selected).toBe('Item2');
            });

            it('selects the prior suggestion when the down up key is pressed and there\'s something selected', function() {
                // Arrange
                loadSuggestions('', ['Item1', 'Item2']);
                element.scope().selectSuggestion(1);

                // Act
                sendKeyDown(UP_ARROW);

                // Assert
                expect(element.scope().suggestions.selected).toBe('Item1');
            });

            it('selects the last suggestion when the up arrow key is pressed and the first item is selected', function() {
                // Arrange
                loadSuggestions('', ['Item1', 'Item2']);
                element.scope().selectSuggestion(0);

                // Act
                sendKeyDown(UP_ARROW);

                // Assert
                expect(element.scope().suggestions.selected).toBe('Item2');
            });
        });
    });
});

}());
