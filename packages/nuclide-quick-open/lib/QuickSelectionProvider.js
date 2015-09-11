var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use babel';

var React = require('react-for-atom');

/**
 * Base class for a provider for QuickSelectionComponent.
 */

var QuickSelectionProvider = (function () {
  function QuickSelectionProvider() {
    _classCallCheck(this, QuickSelectionProvider);
  }

  _createClass(QuickSelectionProvider, [{
    key: 'getPromptText',

    /**
     *  gets prompt text
     */
    value: function getPromptText() {
      throw new Error('Not implemented');
    }

    /**
     * Returns the number of milliseconds used to debounce any calls to executeQuery.
     */
  }, {
    key: 'getDebounceDelay',
    value: function getDebounceDelay() {
      return 200;
    }

    /**
     * Asynchronously executes a search based on @query.
     */
  }, {
    key: 'executeQuery',
    value: function executeQuery(query) {
      return Promise.reject('Not implemented');
    }

    /**
     * Returns a ReactElement based on @item, which should be an
     * object returned from executeQuery, above.
     */
  }, {
    key: 'getComponentForItem',
    value: function getComponentForItem(item) {
      return React.createElement(
        'div',
        null,
        item.toString()
      );
    }
  }]);

  return QuickSelectionProvider;
})();

module.exports = QuickSelectionProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1F1aWNrU2VsZWN0aW9uUHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsV0FBVyxDQUFDOztBQWdCWixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7Ozs7O0lBS2hDLHNCQUFzQjtXQUF0QixzQkFBc0I7MEJBQXRCLHNCQUFzQjs7O2VBQXRCLHNCQUFzQjs7Ozs7O1dBSWIseUJBQVc7QUFDdEIsWUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3BDOzs7Ozs7O1dBS2UsNEJBQVc7QUFDekIsYUFBTyxHQUFHLENBQUM7S0FDWjs7Ozs7OztXQUtXLHNCQUFDLEtBQWEsRUFBd0I7QUFDaEQsYUFBTyxPQUFPLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDMUM7Ozs7Ozs7O1dBTWtCLDZCQUFDLElBQWdCLEVBQWdCO0FBQ2xELGFBQU87OztRQUFNLElBQUksQ0FBQyxRQUFRLEVBQUU7T0FBTyxDQUFBO0tBQ3BDOzs7U0E1Qkcsc0JBQXNCOzs7QUFnQzVCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsc0JBQXNCLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtcXVpY2stb3Blbi9saWIvUXVpY2tTZWxlY3Rpb25Qcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtcbiAgRmlsZVJlc3VsdCxcbiAgR3JvdXBlZFJlc3VsdFByb21pc2UsXG59IGZyb20gJy4vdHlwZXMnO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xuXG4vKipcbiAqIEJhc2UgY2xhc3MgZm9yIGEgcHJvdmlkZXIgZm9yIFF1aWNrU2VsZWN0aW9uQ29tcG9uZW50LlxuICovXG5jbGFzcyBRdWlja1NlbGVjdGlvblByb3ZpZGVyIHtcbiAgLyoqXG4gICAqICBnZXRzIHByb21wdCB0ZXh0XG4gICAqL1xuICBnZXRQcm9tcHRUZXh0KCk6IHN0cmluZyB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHVzZWQgdG8gZGVib3VuY2UgYW55IGNhbGxzIHRvIGV4ZWN1dGVRdWVyeS5cbiAgICovXG4gIGdldERlYm91bmNlRGVsYXkoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gMjAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzeW5jaHJvbm91c2x5IGV4ZWN1dGVzIGEgc2VhcmNoIGJhc2VkIG9uIEBxdWVyeS5cbiAgICovXG4gIGV4ZWN1dGVRdWVyeShxdWVyeTogc3RyaW5nKTogR3JvdXBlZFJlc3VsdFByb21pc2Uge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgnTm90IGltcGxlbWVudGVkJyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIFJlYWN0RWxlbWVudCBiYXNlZCBvbiBAaXRlbSwgd2hpY2ggc2hvdWxkIGJlIGFuXG4gICAqIG9iamVjdCByZXR1cm5lZCBmcm9tIGV4ZWN1dGVRdWVyeSwgYWJvdmUuXG4gICAqL1xuICBnZXRDb21wb25lbnRGb3JJdGVtKGl0ZW06IEZpbGVSZXN1bHQpOiBSZWFjdEVsZW1lbnQge1xuICAgIHJldHVybiA8ZGl2PntpdGVtLnRvU3RyaW5nKCl9PC9kaXY+XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1aWNrU2VsZWN0aW9uUHJvdmlkZXI7XG4iXX0=
