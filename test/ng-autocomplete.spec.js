(function() {
'use strict';

describe('auto-complete-directive', function() {
    var ENTER = 13, TAB = 9, BACKSPACE = 8, ESCAPE = 27, DOWN_ARROW = 40, UP_ARROW = 38;

    var $compile, $scope, $q, $timeout,
        element, deferred;

    beforeEach(function() {
        module('auto-complete');

        inject(function(_$compile_, _$rootScope_, _$q_, _$timeout_) {
            $scope = _$rootScope_;
            $compile = _$compile_;
            $q = _$q_;
            $timeout = _$timeout_;
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

        it('hides the suggestion box when the escape key is pressed', function() {
            // Arrange
            element.scope().showSuggestions();
            $scope.$digest();

            // Act
            sendKeyDown(ESCAPE);

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('hides the suggestion box when the user clicks elsewhere on the page', function() {
            // Arrange
            element.scope().showSuggestions();
            $scope.$digest();

            // Act
            $(document).trigger('click');

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('adds the selected suggestion to the input field when the enter key is pressed and the suggestions box is visible', function() {
            // Arrange
            loadSuggestions('', ['Item1', 'Item2']);
            element.scope().showSuggestions();
            element.scope().selectSuggestion(0);

            // Act
            sendKeyDown(ENTER);

            // Assert
            expect(element.val()).toBe('Item1');
        });

        it('adds the selected suggestion to the input field when the tab key is pressed and there is a suggestion selected', function() {
            // Arrange
            loadSuggestions('', ['Item1', 'Item2']);
            element.scope().showSuggestions();
            element.scope().selectSuggestion(0);

            // Act
            sendKeyDown(TAB);

            // Assert
            expect(element.val()).toBe('Item1');
        });

        it('sets the selected suggestion to null after adding it to the input field', function () {
            // Arrange
            loadSuggestions('', ['Item1', 'Item2']);
            element.scope().selectSuggestion(0);

            // Act
            element.scope().addSuggestion();

            // Assert
            expect(element.scope().suggestions.selected).toBeNull();
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

        it('does not call the load function after adding the selected suggestion to the input field', function() {
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

        describe('suggestion box size and position', function() {
            beforeEach(function () {
                var container = angular.element('<div style="text-align: center;"></div>');
                $(document.body).append(container);
                var template = angular.element('<input type="text" ng-model="value" auto-complete="loadItems">');
                container.append(template);
                compile(template);
            });

            it('sets the suggestion box width as the input field width when the suggestions box is shown', function() {
                // Arrange
                // Done in beforeEach

                // Act
                element.scope().showSuggestions();
                $timeout.flush();

                // Assert
                expect(element.next().css('width')).toBe(element.outerWidth() + 'px');
            });

            it('sets the suggestion box left position relative to the input field\'s', function () {
                // Arrange
                // Done in beforeEach

                // Act
                element.scope().showSuggestions();
                $scope.$digest();
                $timeout.flush();

                // Assert
                expect(element.next().css('left')).toBe(Math.round(element.offset().left) + 'px');
            });
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

        describe('mouse', function() {
            it('selects the suggestion under the mouse pointer', function() {
                // Arrange
                loadSuggestions('', ['Item1', 'Item2', 'Item3']);

                // Act
                getSuggestion(1).mouseenter();

                // Assert
                expect(element.scope().suggestions.selected).toBe('Item2');
            });

            it('adds the selected suggestion to the input field when a mouse click is triggered', function() {
                // Arrange
                loadSuggestions('', ['Item1', 'Item2', 'Item3']);
                getSuggestion(1).mouseenter();

                // Act
                getSuggestion(1).click();

                // Assert
                expect(element.val()).toBe('Item2');
            });

            it('focuses the input field when a suggestion is added via a mouse click', function() {
                // Arrange
                loadSuggestions('', ['Item1', 'Item2', 'Item3']);
                spyOn(element[0], 'focus');

                // Act
                getSuggestion(1).click();

                // Assert
                expect(element[0].focus).toHaveBeenCalled();
            });
        });
    });

    describe('hotkeys propagation handling - suggestion box is visible', function () {
        beforeEach(function () {
            element.scope().showSuggestions();
        });

        it('prevents the down arrow keydown event from being propagated', function () {
            expect(sendKeyDown(DOWN_ARROW).isDefaultPrevented()).toBe(true);
        });

        it('prevents the up arrow keydown event from being propagated', function () {
            expect(sendKeyDown(UP_ARROW).isDefaultPrevented()).toBe(true);
        });

        it('prevents the enter keydown event from being propagated', function () {
            expect(sendKeyDown(ENTER).isDefaultPrevented()).toBe(true);
        });

        it('prevents the tab keydown event from being propagated', function () {
            expect(sendKeyDown(TAB).isDefaultPrevented()).toBe(true);
        });

        it('prevents the escape keydown event from being propagated', function () {
            expect(sendKeyDown(ESCAPE).isDefaultPrevented()).toBe(true);
        });
    });

    describe('hotkeys propagation handling - suggestion box is hidden', function () {
        beforeEach(function () {
            element.scope().hideSuggestions();
        });

        it('prevents the down arrow keydown event from being propagated', function () {
            expect(sendKeyDown(DOWN_ARROW).isDefaultPrevented()).toBe(true);
        });

        it('does not prevent the up arrow keydown event from being propagated', function () {
            expect(sendKeyDown(UP_ARROW).isDefaultPrevented()).toBe(false);
        });

        it('does not prevent the enter keydown event from being propagated', function () {
            expect(sendKeyDown(ENTER).isDefaultPrevented()).toBe(false);
        });

        it('does not prevent the tab keydown event from being propagated', function () {
            expect(sendKeyDown(TAB).isDefaultPrevented()).toBe(false);
        });

        it('does not prevent the escape keydown event from being propagated', function () {
            expect(sendKeyDown(ESCAPE).isDefaultPrevented()).toBe(false);
        });
    });

});

}());
