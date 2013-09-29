(function() {
'use strict';

describe('auto-complete-directive', function () {
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
    });

    function compile() {
        var template = '<input type="text" ng-model="value" autocomplete="loadItems">';

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

    describe('basic features', function () {
        it('ensures that the suggestions list is hidden by default', function () {
            // Arrange/Act
            compile();

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('shows the suggestions list when there are items to show', function () {
            // Arrange
            compile();

            // Act
            resolve(['Item1']);
            sendKeyPress(65);

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('');
        });

        it('doesn\'t show the suggestions list when there is no items to show', function () {
            // Arrange
            compile();

            // Act
            resolve([]);
            sendKeyPress(65);

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('hides suggestion box when the input box becomes empty', function () {
            // Arrange
            compile();
            resolve(['Item1']);
            sendKeyPress(65);

            // Act
            sendBackspace();

            // Assert
            expect(getSuggestionsBox().css('display')).toBe('none');
        });

        it('calls the load function for every key pressed passing the input content', function () {
            // Arrange
            compile();

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

        it('renders all elements returned by the load function', function () {
            // Arrange
            compile();

            // Act
            resolve(['Item1','Item2','Item3']);
            sendKeyPress(65);

            // Assert
            expect(getSuggestions().length).toBe(3);
            expect(getSuggestionText(0)).toBe('Item1');
            expect(getSuggestionText(1)).toBe('Item2');
            expect(getSuggestionText(2)).toBe('Item3');
        });

        it('calls the load function passing the current input content when the down arrow key is pressed and the suggestions box is hidden', function () {
            // Arrange
            compile();

            // Act
            sendKeyDown(DOWN_ARROW);

            // Assert
            expect($scope.loadItems).toHaveBeenCalledWith('');
        });
    });

    describe('navigation', function () {
        it('', function () {


        });
    });
});

}());
