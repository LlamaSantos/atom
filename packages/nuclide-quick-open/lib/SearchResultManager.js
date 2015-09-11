
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var QuickSelectionProvider = require('./QuickSelectionProvider');

function _loadProvider(providerName) {
  var provider = null;
  try {
    // for now, assume that providers are stored in quick-open/lib
    provider = require('./' + providerName);
  } catch (e) {
    throw new Error('Provider "' + providerName + '" not found', e);
  }
  return provider;
}

/**
 * A singleton cache for search providers and results.
 */

var SearchResultManager = (function () {
  function SearchResultManager() {
    _classCallCheck(this, SearchResultManager);

    this._cachedProviders = {};
  }

  /**
   * Returns a lazily loaded, cached instance of the search provider with the given name.
   *
   * @param providerName Name of the provider to be `require()`d, instantiated and returned.
   * @return cached provider instance.
   */

  _createClass(SearchResultManager, [{
    key: 'getProvider',
    value: function getProvider(providerName) {
      if (!this._cachedProviders[providerName]) {
        var LazyProvider = _loadProvider(providerName);
        this._cachedProviders[providerName] = new LazyProvider();
      }
      return this._cachedProviders[providerName];
    }
  }]);

  return SearchResultManager;
})();

module.exports = new SearchResultManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1NlYXJjaFJlc3VsdE1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztBQVdaLElBQUksc0JBQXNCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7O0FBRWpFLFNBQVMsYUFBYSxDQUFDLFlBQW9CLEVBQUU7QUFDM0MsTUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLE1BQUk7O0FBRUYsWUFBUSxHQUFHLE9BQU8sQ0FBQyxJQUFJLEdBQUcsWUFBWSxDQUFDLENBQUM7R0FDekMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLFVBQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxHQUFHLFlBQVksR0FBRyxhQUFhLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDakU7QUFDRCxTQUFPLFFBQVEsQ0FBQztDQUNqQjs7Ozs7O0lBS0ssbUJBQW1CO0FBQ1osV0FEUCxtQkFBbUIsR0FDVDswQkFEVixtQkFBbUI7O0FBRXJCLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7R0FDNUI7Ozs7Ozs7OztlQUhHLG1CQUFtQjs7V0FXWixxQkFBQyxZQUFvQixFQUEyQjtBQUN6RCxVQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxFQUFFO0FBQ3hDLFlBQUksWUFBWSxHQUFHLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUMvQyxZQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztPQUMxRDtBQUNELGFBQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQzVDOzs7U0FqQkcsbUJBQW1COzs7QUFxQnpCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1NlYXJjaFJlc3VsdE1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciA9IHJlcXVpcmUoJy4vUXVpY2tTZWxlY3Rpb25Qcm92aWRlcicpO1xuXG5mdW5jdGlvbiBfbG9hZFByb3ZpZGVyKHByb3ZpZGVyTmFtZTogc3RyaW5nKSB7XG4gIHZhciBwcm92aWRlciA9IG51bGw7XG4gIHRyeSB7XG4gICAgLy8gZm9yIG5vdywgYXNzdW1lIHRoYXQgcHJvdmlkZXJzIGFyZSBzdG9yZWQgaW4gcXVpY2stb3Blbi9saWJcbiAgICBwcm92aWRlciA9IHJlcXVpcmUoJy4vJyArIHByb3ZpZGVyTmFtZSk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb3ZpZGVyIFwiJyArIHByb3ZpZGVyTmFtZSArICdcIiBub3QgZm91bmQnLCBlKTtcbiAgfVxuICByZXR1cm4gcHJvdmlkZXI7XG59XG5cbi8qKlxuICogQSBzaW5nbGV0b24gY2FjaGUgZm9yIHNlYXJjaCBwcm92aWRlcnMgYW5kIHJlc3VsdHMuXG4gKi9cbmNsYXNzIFNlYXJjaFJlc3VsdE1hbmFnZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9jYWNoZWRQcm92aWRlcnMgPSB7fTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbGF6aWx5IGxvYWRlZCwgY2FjaGVkIGluc3RhbmNlIG9mIHRoZSBzZWFyY2ggcHJvdmlkZXIgd2l0aCB0aGUgZ2l2ZW4gbmFtZS5cbiAgICpcbiAgICogQHBhcmFtIHByb3ZpZGVyTmFtZSBOYW1lIG9mIHRoZSBwcm92aWRlciB0byBiZSBgcmVxdWlyZSgpYGQsIGluc3RhbnRpYXRlZCBhbmQgcmV0dXJuZWQuXG4gICAqIEByZXR1cm4gY2FjaGVkIHByb3ZpZGVyIGluc3RhbmNlLlxuICAgKi9cbiAgZ2V0UHJvdmlkZXIocHJvdmlkZXJOYW1lOiBzdHJpbmcpIDogUXVpY2tTZWxlY3Rpb25Qcm92aWRlciB7XG4gICAgaWYgKCF0aGlzLl9jYWNoZWRQcm92aWRlcnNbcHJvdmlkZXJOYW1lXSkge1xuICAgICAgdmFyIExhenlQcm92aWRlciA9IF9sb2FkUHJvdmlkZXIocHJvdmlkZXJOYW1lKTtcbiAgICAgIHRoaXMuX2NhY2hlZFByb3ZpZGVyc1twcm92aWRlck5hbWVdID0gbmV3IExhenlQcm92aWRlcigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY2FjaGVkUHJvdmlkZXJzW3Byb3ZpZGVyTmFtZV07XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBTZWFyY2hSZXN1bHRNYW5hZ2VyKCk7XG4iXX0=
