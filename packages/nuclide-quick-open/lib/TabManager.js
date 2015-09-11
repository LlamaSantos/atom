var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var getServicesForDirectory = _asyncToGenerator(function* (directory) {
  var _require = require('nuclide-client');

  var getClient = _require.getClient;

  var directoryPath = directory.getPath();
  var client = getClient(directoryPath);
  if (!client) {
    // If the RemoteConnection for the Directory has not been re-established yet, then `client` may
    // be null. For now, we just ignore this, but ideally we would find a way to register a listener
    // that notifies us when the RemoteConnection is created that runs updateRenderableTabs().
    return [];
  }

  var remoteUri = require('nuclide-remote-uri');

  var _remoteUri$parse = remoteUri.parse(directoryPath);

  var rootDirectory = _remoteUri$parse.path;

  return yield client.getSearchProviders(rootDirectory);
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _nuclideCommons = require('nuclide-commons');

var _atom = require('atom');

// Keep `action` in sync with listeners in main.js.
'use babel';
var DEFAULT_TABS = [{
  providerName: 'OmniSearchResultProvider',
  title: 'All Results',
  action: 'nuclide-quick-open:toggle-omni-search'
}, {
  providerName: 'FileListProvider',
  title: 'Filenames',
  action: 'nuclide-quick-open:toggle-quick-open'
}, {
  providerName: 'OpenFileListProvider',
  title: 'Open Files',
  action: 'nuclide-quick-open:toggle-openfilename-search'
}];

var DYNAMIC_TABS = {
  biggrep: {
    providerName: 'BigGrepListProvider',
    title: 'BigGrep',
    action: 'nuclide-quick-open:toggle-biggrep-search'
  },
  hack: {
    providerName: 'SymbolListProvider',
    title: 'Symbols',
    action: 'nuclide-quick-open:toggle-symbol-search'
  }
};

function getEligibleServices() {
  var directories = atom.project.getDirectories();
  var services = directories.map(getServicesForDirectory);
  return Promise.all(services);
}

var DID_CHANGE_TABS_EVENT = 'did-change-tabs';

var TabManager = (function () {
  function TabManager() {
    var _this = this;

    var getEligibleServicesFn = arguments.length <= 0 || arguments[0] === undefined ? getEligibleServices : arguments[0];

    _classCallCheck(this, TabManager);

    this._tabsToRender = DEFAULT_TABS.slice();
    this._getEligibleServices = getEligibleServicesFn;
    this._emitter = new _atom.Emitter();
    this._subscription = atom.project.onDidChangePaths(function () {
      return _this._updateRenderableTabs();
    });
    this._updateRenderableTabs(); // Note this is asynchronous.
  }

  /**
   * Gets the last known list of tabs to render synchronously.
   * @return an array that should not be modified by the client. We would declare the return type
   *     to be `Iterable<TabInfo>` to underscore this point, but that would be inconvenient because
   *     then the return value would not have its own `.map()` method.
   */

  _createClass(TabManager, [{
    key: 'getTabs',
    value: function getTabs() {
      return this._tabsToRender;
    }

    /** @return the tab that should have focus, by default. */
  }, {
    key: 'getDefaultTab',
    value: function getDefaultTab() {
      return this._tabsToRender[0];
    }

    /**
     * Subscribe to be notified when the list of tabs changes.
     * @param callback The return value will be ignored.
     * @return Disposable that can be used to remove this subscription.
     */
  }, {
    key: 'onDidChangeTabs',
    value: function onDidChangeTabs(callback) {
      return this._emitter.on(DID_CHANGE_TABS_EVENT, callback);
    }
  }, {
    key: '_updateRenderableTabs',
    value: _asyncToGenerator(function* () {
      var services = yield this._getEligibleServices();

      // Array<Array<{name:string}>> => Array<{name:string}>.
      var flattenedServices = Array.prototype.concat.apply([], services);
      var dynamicTabs = flattenedServices.filter(function (service) {
        return DYNAMIC_TABS.hasOwnProperty(service.name);
      }).map(function (service) {
        return DYNAMIC_TABS[service.name];
      });

      // Insert dynamic tabs at index 1 (after the OmniSearchProvider).
      var tabsToRender = DEFAULT_TABS.slice();
      tabsToRender.splice.apply(tabsToRender, [1, 0].concat(_toConsumableArray(dynamicTabs)));

      if (this._isNewListOfTabs(tabsToRender)) {
        this._tabsToRender = tabsToRender;
        this._emitter.emit(DID_CHANGE_TABS_EVENT, tabsToRender);
      }
    })

    /** @return  */
  }, {
    key: '_isNewListOfTabs',
    value: function _isNewListOfTabs(tabsToRender) {
      var existingTabs = this._tabsToRender;
      if (existingTabs.length !== tabsToRender.length) {
        return true;
      }

      var mismatchedTab = _nuclideCommons.array.find(existingTabs, function (oldTab, index) {
        var newTab = tabsToRender[index];
        if (oldTab.providerName !== newTab.providerName) {
          return newTab;
        }
      });
      return !!mismatchedTab;
    }

    /**
     * In practice, it is unlikely that this will ever be called because TabManager is exposed as a
     * singleton. Nevertheless, it is here for completeness/unit testing.
     */
  }, {
    key: 'dispose',
    value: function dispose() {
      this._subscription.dispose();
      this._emitter.dispose();
    }
  }]);

  return TabManager;
})();

var instance;

module.exports = {
  /** Clients of TabManager should prefer using getInstance() to creating a TabManager directly. */
  getInstance: function getInstance() {
    if (!instance) {
      instance = new TabManager();
    }
    return instance;
  },

  /** Exclusively for use with `import type` and unit tests. */
  TabManager: TabManager
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1RhYk1hbmFnZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7SUFnRGUsdUJBQXVCLHFCQUF0QyxXQUF1QyxTQUFvQixFQUFpQztpQkFDeEUsT0FBTyxDQUFDLGdCQUFnQixDQUFDOztNQUF0QyxTQUFTLFlBQVQsU0FBUzs7QUFDZCxNQUFJLGFBQWEsR0FBRyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDeEMsTUFBSSxNQUFNLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3RDLE1BQUksQ0FBQyxNQUFNLEVBQUU7Ozs7QUFJWCxXQUFPLEVBQUUsQ0FBQztHQUNYOztBQUVELE1BQUksU0FBUyxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOzt5QkFDbEIsU0FBUyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUM7O01BQS9DLGFBQWEsb0JBQW5CLElBQUk7O0FBQ1QsU0FBTyxNQUFNLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztDQUN2RDs7Ozs7Ozs7Ozs7Ozs7Ozs4QkFqRG1CLGlCQUFpQjs7b0JBQ2YsTUFBTTs7O0FBZDVCLFdBQVcsQ0FBQztBQWlCWixJQUFJLFlBQTRCLEdBQUcsQ0FDakM7QUFDQyxjQUFZLEVBQUUsMEJBQTBCO0FBQ3hDLE9BQUssRUFBRSxhQUFhO0FBQ3BCLFFBQU0sRUFBRSx1Q0FBdUM7Q0FDL0MsRUFDRDtBQUNDLGNBQVksRUFBRSxrQkFBa0I7QUFDaEMsT0FBSyxFQUFFLFdBQVc7QUFDbEIsUUFBTSxFQUFFLHNDQUFzQztDQUM5QyxFQUNEO0FBQ0MsY0FBWSxFQUFFLHNCQUFzQjtBQUNwQyxPQUFLLEVBQUUsWUFBWTtBQUNuQixRQUFNLEVBQUUsK0NBQStDO0NBQ3ZELENBQ0YsQ0FBQzs7QUFF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QUksYUFBYSxHQUFHLGdCQTNIaEIsS0FBSyxDQTJIaUIsSUFBSSxDQUM1QixZQUFZLEVBQ1osVUFBQyxNQUFNLEVBQVcsS0FBSyxFQUFhO0FBQ2xDLFlBQUksTUFBTSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxZQUFJLE1BQU0sQ0FBQyxZQUFZLEtBQUssTUFBTSxDQUFDLFlBQVksRUFBRTtBQUMvQyxpQkFBTyxNQUFNLENBQUM7U0FDZjtPQUNGLENBQUMsQ0FBQztBQUNMLGFBQU8sQ0FBQyxDQUFDLGFBQWEsQ0FBQztLQUN4Qjs7Ozs7Ozs7V0FNTSxtQkFBRztBQUNSLFVBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDN0IsVUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUN6Qjs7O1NBbEZHLFVBQVU7OztBQXFGaEIsSUFBSSxRQUFRLENBQUM7O0FBRWIsTUFBTSxDQUFDLE9BQU8sR0FBRzs7QUFFZixhQUFXLEVBQUEsdUJBQWU7QUFDeEIsUUFBSSxDQUFDLFFBQVEsRUFBRTtBQUNiLGNBQVEsR0FBRyxJQUFJLFVBQVUsRUFBRSxDQUFDO0tBQzdCO0FBQ0QsV0FBTyxRQUFRLENBQUM7R0FDakI7OztBQUdELFlBQVUsRUFBVixVQUFVO0NBQ1gsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1xdWljay1vcGVuL2xpYi9UYWJNYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cbmltcG9ydCB0eXBlIHtEaXJlY3RvcnksIERpc3Bvc2FibGV9IGZyb20gJ2F0b20nO1xuaW1wb3J0IHR5cGUge1RhYkluZm99IGZyb20gJy4vdHlwZXMnO1xuXG5pbXBvcnQge2FycmF5fSBmcm9tICdudWNsaWRlLWNvbW1vbnMnO1xuaW1wb3J0IHtFbWl0dGVyfSBmcm9tICdhdG9tJztcblxuLy8gS2VlcCBgYWN0aW9uYCBpbiBzeW5jIHdpdGggbGlzdGVuZXJzIGluIG1haW4uanMuXG52YXIgREVGQVVMVF9UQUJTOiBBcnJheTxUYWJJbmZvPiA9IFtcbiAge1xuICAgcHJvdmlkZXJOYW1lOiAnT21uaVNlYXJjaFJlc3VsdFByb3ZpZGVyJyxcbiAgIHRpdGxlOiAnQWxsIFJlc3VsdHMnLFxuICAgYWN0aW9uOiAnbnVjbGlkZS1xdWljay1vcGVuOnRvZ2dsZS1vbW5pLXNlYXJjaCcsXG4gIH0sXG4gIHtcbiAgIHByb3ZpZGVyTmFtZTogJ0ZpbGVMaXN0UHJvdmlkZXInLFxuICAgdGl0bGU6ICdGaWxlbmFtZXMnLFxuICAgYWN0aW9uOiAnbnVjbGlkZS1xdWljay1vcGVuOnRvZ2dsZS1xdWljay1vcGVuJyxcbiAgfSxcbiAge1xuICAgcHJvdmlkZXJOYW1lOiAnT3BlbkZpbGVMaXN0UHJvdmlkZXInLFxuICAgdGl0bGU6ICdPcGVuIEZpbGVzJyxcbiAgIGFjdGlvbjogJ251Y2xpZGUtcXVpY2stb3Blbjp0b2dnbGUtb3BlbmZpbGVuYW1lLXNlYXJjaCcsXG4gIH0sXG5dO1xuXG52YXIgRFlOQU1JQ19UQUJTOiB7W2tleTogc3RyaW5nXTogVGFiSW5mb30gPSB7XG4gIGJpZ2dyZXA6IHtcbiAgIHByb3ZpZGVyTmFtZTogJ0JpZ0dyZXBMaXN0UHJvdmlkZXInLFxuICAgdGl0bGU6ICdCaWdHcmVwJyxcbiAgIGFjdGlvbjogJ251Y2xpZGUtcXVpY2stb3Blbjp0b2dnbGUtYmlnZ3JlcC1zZWFyY2gnLFxuICB9LFxuICBoYWNrOiB7XG4gICBwcm92aWRlck5hbWU6ICdTeW1ib2xMaXN0UHJvdmlkZXInLFxuICAgdGl0bGU6ICdTeW1ib2xzJyxcbiAgIGFjdGlvbjogJ251Y2xpZGUtcXVpY2stb3Blbjp0b2dnbGUtc3ltYm9sLXNlYXJjaCcsXG4gIH0sXG59O1xuXG5hc3luYyBmdW5jdGlvbiBnZXRTZXJ2aWNlc0ZvckRpcmVjdG9yeShkaXJlY3Rvcnk6IERpcmVjdG9yeSk6IFByb21pc2U8QXJyYXk8e25hbWU6c3RyaW5nfT4+IHtcbiAgdmFyIHtnZXRDbGllbnR9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcbiAgdmFyIGRpcmVjdG9yeVBhdGggPSBkaXJlY3RvcnkuZ2V0UGF0aCgpO1xuICB2YXIgY2xpZW50ID0gZ2V0Q2xpZW50KGRpcmVjdG9yeVBhdGgpO1xuICBpZiAoIWNsaWVudCkge1xuICAgIC8vIElmIHRoZSBSZW1vdGVDb25uZWN0aW9uIGZvciB0aGUgRGlyZWN0b3J5IGhhcyBub3QgYmVlbiByZS1lc3RhYmxpc2hlZCB5ZXQsIHRoZW4gYGNsaWVudGAgbWF5XG4gICAgLy8gYmUgbnVsbC4gRm9yIG5vdywgd2UganVzdCBpZ25vcmUgdGhpcywgYnV0IGlkZWFsbHkgd2Ugd291bGQgZmluZCBhIHdheSB0byByZWdpc3RlciBhIGxpc3RlbmVyXG4gICAgLy8gdGhhdCBub3RpZmllcyB1cyB3aGVuIHRoZSBSZW1vdGVDb25uZWN0aW9uIGlzIGNyZWF0ZWQgdGhhdCBydW5zIHVwZGF0ZVJlbmRlcmFibGVUYWJzKCkuXG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgdmFyIHJlbW90ZVVyaSA9IHJlcXVpcmUoJ251Y2xpZGUtcmVtb3RlLXVyaScpO1xuICB2YXIge3BhdGg6IHJvb3REaXJlY3Rvcnl9ID0gcmVtb3RlVXJpLnBhcnNlKGRpcmVjdG9yeVBhdGgpO1xuICByZXR1cm4gYXdhaXQgY2xpZW50LmdldFNlYXJjaFByb3ZpZGVycyhyb290RGlyZWN0b3J5KTtcbn1cblxuZnVuY3Rpb24gZ2V0RWxpZ2libGVTZXJ2aWNlcygpOiBQcm9taXNlPEFycmF5PEFycmF5PHtuYW1lOnN0cmluZ30+Pj4ge1xuICB2YXIgZGlyZWN0b3JpZXMgPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKTtcbiAgdmFyIHNlcnZpY2VzID0gZGlyZWN0b3JpZXMubWFwKGdldFNlcnZpY2VzRm9yRGlyZWN0b3J5KTtcbiAgcmV0dXJuIFByb21pc2UuYWxsKHNlcnZpY2VzKTtcbn1cblxudmFyIERJRF9DSEFOR0VfVEFCU19FVkVOVCA9ICdkaWQtY2hhbmdlLXRhYnMnO1xuXG5jbGFzcyBUYWJNYW5hZ2VyIHtcbiAgX3RhYnNUb1JlbmRlcjogQXJyYXk8VGFiSW5mbz47XG4gIF9nZXRFbGlnaWJsZVNlcnZpY2VzOiAoKSA9PiBQcm9taXNlPEFycmF5PEFycmF5PHtuYW1lOnN0cmluZ30+Pj47XG4gIF9lbWl0dGVyOiBFbWl0dGVyO1xuICBfc3Vic2NyaXB0aW9uOiBEaXNwb3NhYmxlO1xuXG4gIGNvbnN0cnVjdG9yKGdldEVsaWdpYmxlU2VydmljZXNGbjogKCkgPT4gUHJvbWlzZTxBcnJheTxBcnJheTx7bmFtZTpzdHJpbmd9Pj4+ID0gZ2V0RWxpZ2libGVTZXJ2aWNlcykge1xuICAgIHRoaXMuX3RhYnNUb1JlbmRlciA9IERFRkFVTFRfVEFCUy5zbGljZSgpO1xuICAgIHRoaXMuX2dldEVsaWdpYmxlU2VydmljZXMgPSBnZXRFbGlnaWJsZVNlcnZpY2VzRm47XG4gICAgdGhpcy5fZW1pdHRlciA9IG5ldyBFbWl0dGVyKCk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uID0gYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMoKCkgPT4gdGhpcy5fdXBkYXRlUmVuZGVyYWJsZVRhYnMoKSk7XG4gICAgdGhpcy5fdXBkYXRlUmVuZGVyYWJsZVRhYnMoKTsgLy8gTm90ZSB0aGlzIGlzIGFzeW5jaHJvbm91cy5cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBsYXN0IGtub3duIGxpc3Qgb2YgdGFicyB0byByZW5kZXIgc3luY2hyb25vdXNseS5cbiAgICogQHJldHVybiBhbiBhcnJheSB0aGF0IHNob3VsZCBub3QgYmUgbW9kaWZpZWQgYnkgdGhlIGNsaWVudC4gV2Ugd291bGQgZGVjbGFyZSB0aGUgcmV0dXJuIHR5cGVcbiAgICogICAgIHRvIGJlIGBJdGVyYWJsZTxUYWJJbmZvPmAgdG8gdW5kZXJzY29yZSB0aGlzIHBvaW50LCBidXQgdGhhdCB3b3VsZCBiZSBpbmNvbnZlbmllbnQgYmVjYXVzZVxuICAgKiAgICAgdGhlbiB0aGUgcmV0dXJuIHZhbHVlIHdvdWxkIG5vdCBoYXZlIGl0cyBvd24gYC5tYXAoKWAgbWV0aG9kLlxuICAgKi9cbiAgZ2V0VGFicygpOiBBcnJheTxUYWJJbmZvPiB7XG4gICAgcmV0dXJuIHRoaXMuX3RhYnNUb1JlbmRlcjtcbiAgfVxuXG4gIC8qKiBAcmV0dXJuIHRoZSB0YWIgdGhhdCBzaG91bGQgaGF2ZSBmb2N1cywgYnkgZGVmYXVsdC4gKi9cbiAgZ2V0RGVmYXVsdFRhYigpOiBUYWJJbmZvIHtcbiAgICByZXR1cm4gdGhpcy5fdGFic1RvUmVuZGVyWzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byBiZSBub3RpZmllZCB3aGVuIHRoZSBsaXN0IG9mIHRhYnMgY2hhbmdlcy5cbiAgICogQHBhcmFtIGNhbGxiYWNrIFRoZSByZXR1cm4gdmFsdWUgd2lsbCBiZSBpZ25vcmVkLlxuICAgKiBAcmV0dXJuIERpc3Bvc2FibGUgdGhhdCBjYW4gYmUgdXNlZCB0byByZW1vdmUgdGhpcyBzdWJzY3JpcHRpb24uXG4gICAqL1xuICBvbkRpZENoYW5nZVRhYnMoY2FsbGJhY2s6IChuZXdUYWJzOiBBcnJheTxUYWJJbmZvPikgPT4gbWl4ZWQpOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5fZW1pdHRlci5vbihESURfQ0hBTkdFX1RBQlNfRVZFTlQsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGFzeW5jIF91cGRhdGVSZW5kZXJhYmxlVGFicygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB2YXIgc2VydmljZXMgPSBhd2FpdCB0aGlzLl9nZXRFbGlnaWJsZVNlcnZpY2VzKCk7XG5cbiAgICAvLyBBcnJheTxBcnJheTx7bmFtZTpzdHJpbmd9Pj4gPT4gQXJyYXk8e25hbWU6c3RyaW5nfT4uXG4gICAgdmFyIGZsYXR0ZW5lZFNlcnZpY2VzID0gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgc2VydmljZXMpO1xuICAgIHZhciBkeW5hbWljVGFicyA9IGZsYXR0ZW5lZFNlcnZpY2VzXG4gICAgICAuZmlsdGVyKHNlcnZpY2UgPT4gRFlOQU1JQ19UQUJTLmhhc093blByb3BlcnR5KHNlcnZpY2UubmFtZSkpXG4gICAgICAubWFwKHNlcnZpY2UgPT4gRFlOQU1JQ19UQUJTW3NlcnZpY2UubmFtZV0pO1xuXG4gICAgLy8gSW5zZXJ0IGR5bmFtaWMgdGFicyBhdCBpbmRleCAxIChhZnRlciB0aGUgT21uaVNlYXJjaFByb3ZpZGVyKS5cbiAgICB2YXIgdGFic1RvUmVuZGVyID0gREVGQVVMVF9UQUJTLnNsaWNlKCk7XG4gICAgdGFic1RvUmVuZGVyLnNwbGljZSgxLCAwLCAuLi5keW5hbWljVGFicyk7XG5cbiAgICBpZiAodGhpcy5faXNOZXdMaXN0T2ZUYWJzKHRhYnNUb1JlbmRlcikpIHtcbiAgICAgIHRoaXMuX3RhYnNUb1JlbmRlciA9IHRhYnNUb1JlbmRlcjtcbiAgICAgIHRoaXMuX2VtaXR0ZXIuZW1pdChESURfQ0hBTkdFX1RBQlNfRVZFTlQsIHRhYnNUb1JlbmRlcik7XG4gICAgfVxuICB9XG5cbiAgLyoqIEByZXR1cm4gICovXG4gIF9pc05ld0xpc3RPZlRhYnModGFic1RvUmVuZGVyOiBBcnJheTxUYWJJbmZvPik6IGJvb2xlYW4ge1xuICAgIHZhciBleGlzdGluZ1RhYnMgPSB0aGlzLl90YWJzVG9SZW5kZXI7XG4gICAgaWYgKGV4aXN0aW5nVGFicy5sZW5ndGggIT09IHRhYnNUb1JlbmRlci5sZW5ndGgpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHZhciBtaXNtYXRjaGVkVGFiID0gYXJyYXkuZmluZChcbiAgICAgIGV4aXN0aW5nVGFicyxcbiAgICAgIChvbGRUYWI6IFRhYkluZm8sIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgdmFyIG5ld1RhYiA9IHRhYnNUb1JlbmRlcltpbmRleF07XG4gICAgICAgIGlmIChvbGRUYWIucHJvdmlkZXJOYW1lICE9PSBuZXdUYWIucHJvdmlkZXJOYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIG5ld1RhYjtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgcmV0dXJuICEhbWlzbWF0Y2hlZFRhYjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbiBwcmFjdGljZSwgaXQgaXMgdW5saWtlbHkgdGhhdCB0aGlzIHdpbGwgZXZlciBiZSBjYWxsZWQgYmVjYXVzZSBUYWJNYW5hZ2VyIGlzIGV4cG9zZWQgYXMgYVxuICAgKiBzaW5nbGV0b24uIE5ldmVydGhlbGVzcywgaXQgaXMgaGVyZSBmb3IgY29tcGxldGVuZXNzL3VuaXQgdGVzdGluZy5cbiAgICovXG4gIGRpc3Bvc2UoKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICB0aGlzLl9lbWl0dGVyLmRpc3Bvc2UoKTtcbiAgfVxufVxuXG52YXIgaW5zdGFuY2U7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvKiogQ2xpZW50cyBvZiBUYWJNYW5hZ2VyIHNob3VsZCBwcmVmZXIgdXNpbmcgZ2V0SW5zdGFuY2UoKSB0byBjcmVhdGluZyBhIFRhYk1hbmFnZXIgZGlyZWN0bHkuICovXG4gIGdldEluc3RhbmNlKCk6IFRhYk1hbmFnZXIge1xuICAgIGlmICghaW5zdGFuY2UpIHtcbiAgICAgIGluc3RhbmNlID0gbmV3IFRhYk1hbmFnZXIoKTtcbiAgICB9XG4gICAgcmV0dXJuIGluc3RhbmNlO1xuICB9LFxuXG4gIC8qKiBFeGNsdXNpdmVseSBmb3IgdXNlIHdpdGggYGltcG9ydCB0eXBlYCBhbmQgdW5pdCB0ZXN0cy4gKi9cbiAgVGFiTWFuYWdlcixcbn07XG4iXX0=
