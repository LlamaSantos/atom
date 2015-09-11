var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use babel';

var NullHackClient = (function () {
  function NullHackClient() {
    _classCallCheck(this, NullHackClient);
  }

  _createClass(NullHackClient, [{
    key: 'getHackDiagnostics',
    value: function getHackDiagnostics() {
      return Promise.resolve({ errors: [] });
    }
  }, {
    key: 'getHackCompletions',
    value: function getHackCompletions(query) {
      return Promise.resolve([]);
    }
  }, {
    key: 'getHackDefinition',
    value: function getHackDefinition(query, symbolType) {
      return Promise.resolve([]);
    }
  }, {
    key: 'getHackDependencies',
    value: function getHackDependencies(dependenciesInfo) {
      return Promise.resolve({});
    }
  }, {
    key: 'getHackSearchResults',
    value: function getHackSearchResults(search, filterTypes, searchPostfix) {
      return Promise.resolve([]);
    }
  }, {
    key: 'getHackReferences',
    value: _asyncToGenerator(function* (query) {
      return [];
    })
  }]);

  return NullHackClient;
})();

module.exports = NullHackClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL051bGxIYWNrQ2xpZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQUEsV0FBVyxDQUFDOztJQWFOLGNBQWM7V0FBZCxjQUFjOzBCQUFkLGNBQWM7OztlQUFkLGNBQWM7O1dBRUEsOEJBQXdCO0FBQ3hDLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDO0tBQ3RDOzs7V0FFaUIsNEJBQUMsS0FBYSxFQUF1QjtBQUNyRCxhQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDNUI7OztXQUVnQiwyQkFBQyxLQUFhLEVBQUUsVUFBc0IsRUFBdUI7QUFDNUUsYUFBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQzVCOzs7V0FFa0IsNkJBQUMsZ0JBQXFELEVBQWdCO0FBQ3ZGLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUM1Qjs7O1dBRW1CLDhCQUNoQixNQUFjLEVBQ2QsV0FBcUMsRUFDckMsYUFBc0IsRUFDRDtBQUN2QixhQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDNUI7Ozs2QkFFc0IsV0FBQyxLQUFhLEVBQWlDO0FBQ3BFLGFBQU8sRUFBRSxDQUFDO0tBQ1g7OztTQTVCRyxjQUFjOzs7QUFnQ3BCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL051bGxIYWNrQ2xpZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge0hhY2tSZWZlcmVuY2V9IGZyb20gJ251Y2xpZGUtaGFjay1jb21tb24nO1xuXG5jbGFzcyBOdWxsSGFja0NsaWVudCB7XG5cbiAgZ2V0SGFja0RpYWdub3N0aWNzKCk6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe2Vycm9yczogW119KTtcbiAgfVxuXG4gIGdldEhhY2tDb21wbGV0aW9ucyhxdWVyeTogc3RyaW5nKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gIH1cblxuICBnZXRIYWNrRGVmaW5pdGlvbihxdWVyeTogc3RyaW5nLCBzeW1ib2xUeXBlOiBTeW1ib2xUeXBlKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gIH1cblxuICBnZXRIYWNrRGVwZW5kZW5jaWVzKGRlcGVuZGVuY2llc0luZm86IEFycmF5PHtuYW1lOiBzdHJpbmc7IHR5cGU6IHN0cmluZ30+KTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcbiAgfVxuXG4gIGdldEhhY2tTZWFyY2hSZXN1bHRzKFxuICAgICAgc2VhcmNoOiBzdHJpbmcsXG4gICAgICBmaWx0ZXJUeXBlczogP0FycmF5PFNlYXJjaFJlc3VsdFR5cGU+LFxuICAgICAgc2VhcmNoUG9zdGZpeDogP3N0cmluZ1xuICAgICk6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICB9XG5cbiAgYXN5bmMgZ2V0SGFja1JlZmVyZW5jZXMocXVlcnk6IHN0cmluZyk6IFByb21pc2U8QXJyYXk8SGFja1JlZmVyZW5jZT4+IHtcbiAgICByZXR1cm4gW107XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE51bGxIYWNrQ2xpZW50O1xuIl19
