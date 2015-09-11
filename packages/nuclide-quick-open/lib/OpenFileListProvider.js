var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

'use babel';

var QuickSelectionProvider = require('./QuickSelectionProvider');
var FileResultComponent = require('./FileResultComponent');

var OPENFILE_SEARCH_PROVIDER = 'openfiles';

var OpenFileListProvider = (function (_QuickSelectionProvider) {
  _inherits(OpenFileListProvider, _QuickSelectionProvider);

  function OpenFileListProvider() {
    _classCallCheck(this, OpenFileListProvider);

    _get(Object.getPrototypeOf(OpenFileListProvider.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(OpenFileListProvider, [{
    key: 'getDebounceDelay',
    value: function getDebounceDelay() {
      return 0;
    }
  }, {
    key: 'getPromptText',
    value: function getPromptText() {
      return 'Search names of open files';
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (query) {
      var openTabs = Promise.resolve({
        results: OpenFileListProvider.getOpenTabsMatching(query)
      });
      var result = { workspace: {} };
      result.workspace[OPENFILE_SEARCH_PROVIDER] = Promise.resolve(openTabs);
      return result;
    })
  }, {
    key: 'getComponentForItem',
    value: function getComponentForItem(item) {
      return FileResultComponent.getComponentForItem(item);
    }
  }], [{
    key: 'getOpenTabsMatching',

    // Returns the currently opened tabs, ordered from most recently opened to least recently opened.
    value: function getOpenTabsMatching(query) {
      var seenPaths = {};
      return atom.workspace.getTextEditors().sort(function (a, b) {
        // Note that the lastOpened property is not a standard field of TextEditor, but an expando
        // property added via the fuzzy-finder package:
        // https://github.com/atom/fuzzy-finder/blob/00195eb4/lib/main.coffee#L31
        if (typeof a.lastOpened === 'number' && typeof b.lastOpened === 'number') {
          return b.lastOpened - a.lastOpened;
        } else {
          return 0;
        }
      }).map(function (editor) {
        return editor.getPath();
      }).filter(function (filePath) {
        if (filePath == null || // This is true for "untitled" tabs.
        query.length && !new RegExp(query, 'i').test(filePath) || seenPaths[filePath]) {
          return false;
        } else {
          seenPaths[filePath] = true;
          return true;
        }
      }).map(function (filePath) {
        return { path: filePath, matchIndexes: [] };
      });
    }
  }, {
    key: 'getOpenTabsForQuery',
    value: _asyncToGenerator(function* (query) {
      var openTabs = Promise.resolve({
        results: this.getOpenTabsMatching(query)
      });
      return Promise.resolve(openTabs);
    })
  }]);

  return OpenFileListProvider;
})(QuickSelectionProvider);

module.exports = OpenFileListProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL09wZW5GaWxlTGlzdFByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7QUFZWixJQUFJLHNCQUFzQixHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBQ2pFLElBQUksbUJBQW1CLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7O0FBRTNELElBQUksd0JBQXdCLEdBQUcsV0FBVyxDQUFDOztJQUVyQyxvQkFBb0I7WUFBcEIsb0JBQW9COztXQUFwQixvQkFBb0I7MEJBQXBCLG9CQUFvQjs7K0JBQXBCLG9CQUFvQjs7O2VBQXBCLG9CQUFvQjs7V0FnQ1IsNEJBQVc7QUFDekIsYUFBTyxDQUFDLENBQUM7S0FDVjs7O1dBRVkseUJBQVc7QUFDdEIsYUFBTyw0QkFBNEIsQ0FBQztLQUNyQzs7OzZCQUVpQixXQUFDLEtBQWEsRUFBK0M7QUFDN0UsVUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztBQUM3QixlQUFPLEVBQUUsb0JBQW9CLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDO09BQ3pELENBQUMsQ0FBQztBQUNILFVBQUksTUFBTSxHQUFHLEVBQUMsU0FBUyxFQUFFLEVBQUUsRUFBQyxDQUFDO0FBQzdCLFlBQU0sQ0FBQyxTQUFTLENBQUMsd0JBQXdCLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZFLGFBQU8sTUFBTSxDQUFDO0tBQ2Y7OztXQVNrQiw2QkFBQyxJQUFnQixFQUFnQjtBQUNsRCxhQUFPLG1CQUFtQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3REOzs7OztXQXZEeUIsNkJBQUMsS0FBYSxFQUFzRDtBQUM1RixVQUFJLFNBQW1DLEdBQUcsRUFBRSxDQUFDO0FBQzdDLGFBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FDbkMsSUFBSSxDQUFDLFVBQUMsQ0FBQyxFQUFjLENBQUMsRUFBaUI7Ozs7QUFJdEMsWUFBSSxPQUFPLENBQUMsQ0FBQyxVQUFVLEtBQUssUUFBUSxJQUFJLE9BQU8sQ0FBQyxDQUFDLFVBQVUsS0FBSyxRQUFRLEVBQUU7QUFDeEUsaUJBQU8sQ0FBQyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO1NBQ3BDLE1BQU07QUFDTCxpQkFBTyxDQUFDLENBQUM7U0FDVjtPQUNGLENBQUMsQ0FDRCxHQUFHLENBQUMsVUFBQyxNQUFNO2VBQTBCLE1BQU0sQ0FBQyxPQUFPLEVBQUU7T0FBQSxDQUFDLENBQ3RELE1BQU0sQ0FBQyxVQUFDLFFBQVEsRUFBYztBQUM3QixZQUNFLFFBQVEsSUFBSSxJQUFJO0FBQ2YsYUFBSyxDQUFDLE1BQU0sSUFBSSxDQUFDLEFBQUMsSUFBSSxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQUFBQyxJQUMxRCxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQ25CO0FBQ0EsaUJBQU8sS0FBSyxDQUFDO1NBQ2QsTUFBTTtBQUNMLG1CQUFTLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQzNCLGlCQUFPLElBQUksQ0FBQztTQUNiO09BQ0YsQ0FBQyxDQUNELEdBQUcsQ0FBQyxVQUFDLFFBQVE7ZUFBYyxFQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBQztPQUFDLENBQUMsQ0FBQztLQUNwRTs7OzZCQW1CK0IsV0FBQyxLQUFhLEVBQStDO0FBQzNGLFVBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDN0IsZUFBTyxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUM7T0FDekMsQ0FBQyxDQUFDO0FBQ0gsYUFBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2xDOzs7U0F0REcsb0JBQW9CO0dBQVMsc0JBQXNCOztBQTZEekQsTUFBTSxDQUFDLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1xdWljay1vcGVuL2xpYi9PcGVuRmlsZUxpc3RQcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5pbXBvcnQgdHlwZSB7VGV4dEVkaXRvcn0gZnJvbSAnYXRvbSc7XG5cbnZhciBRdWlja1NlbGVjdGlvblByb3ZpZGVyID0gcmVxdWlyZSgnLi9RdWlja1NlbGVjdGlvblByb3ZpZGVyJyk7XG52YXIgRmlsZVJlc3VsdENvbXBvbmVudCA9IHJlcXVpcmUoJy4vRmlsZVJlc3VsdENvbXBvbmVudCcpO1xuXG52YXIgT1BFTkZJTEVfU0VBUkNIX1BST1ZJREVSID0gJ29wZW5maWxlcyc7XG5cbmNsYXNzIE9wZW5GaWxlTGlzdFByb3ZpZGVyIGV4dGVuZHMgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciB7XG5cbiAgLy8gUmV0dXJucyB0aGUgY3VycmVudGx5IG9wZW5lZCB0YWJzLCBvcmRlcmVkIGZyb20gbW9zdCByZWNlbnRseSBvcGVuZWQgdG8gbGVhc3QgcmVjZW50bHkgb3BlbmVkLlxuICBzdGF0aWMgZ2V0T3BlblRhYnNNYXRjaGluZyhxdWVyeTogc3RyaW5nKTogQXJyYXk8e3BhdGg6IHN0cmluZzsgbWF0Y2hJbmRleGVzOiBBcnJheTxudW1iZXI+fT4ge1xuICAgIHZhciBzZWVuUGF0aHM6IHtba2V5OiBzdHJpbmddOiBib29sZWFufSA9IHt9O1xuICAgIHJldHVybiBhdG9tLndvcmtzcGFjZS5nZXRUZXh0RWRpdG9ycygpXG4gICAgICAuc29ydCgoYTogVGV4dEVkaXRvciwgYjogVGV4dEVkaXRvcikgPT4ge1xuICAgICAgICAvLyBOb3RlIHRoYXQgdGhlIGxhc3RPcGVuZWQgcHJvcGVydHkgaXMgbm90IGEgc3RhbmRhcmQgZmllbGQgb2YgVGV4dEVkaXRvciwgYnV0IGFuIGV4cGFuZG9cbiAgICAgICAgLy8gcHJvcGVydHkgYWRkZWQgdmlhIHRoZSBmdXp6eS1maW5kZXIgcGFja2FnZTpcbiAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2F0b20vZnV6enktZmluZGVyL2Jsb2IvMDAxOTVlYjQvbGliL21haW4uY29mZmVlI0wzMVxuICAgICAgICBpZiAodHlwZW9mIGEubGFzdE9wZW5lZCA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGIubGFzdE9wZW5lZCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICByZXR1cm4gYi5sYXN0T3BlbmVkIC0gYS5sYXN0T3BlbmVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLm1hcCgoZWRpdG9yOiBUZXh0RWRpdG9yKTogP3N0cmluZyA9PiBlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgLmZpbHRlcigoZmlsZVBhdGg6ID9zdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIGZpbGVQYXRoID09IG51bGwgfHwgLy8gVGhpcyBpcyB0cnVlIGZvciBcInVudGl0bGVkXCIgdGFicy5cbiAgICAgICAgICAocXVlcnkubGVuZ3RoICYmICEobmV3IFJlZ0V4cChxdWVyeSwgJ2knKSkudGVzdChmaWxlUGF0aCkpIHx8XG4gICAgICAgICAgc2VlblBhdGhzW2ZpbGVQYXRoXVxuICAgICAgICApIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VlblBhdGhzW2ZpbGVQYXRoXSA9IHRydWU7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAubWFwKChmaWxlUGF0aDogc3RyaW5nKSA9PiAoe3BhdGg6IGZpbGVQYXRoLCBtYXRjaEluZGV4ZXM6IFtdfSkpO1xuICB9XG5cbiAgZ2V0RGVib3VuY2VEZWxheSgpOiBudW1iZXIge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZ2V0UHJvbXB0VGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnU2VhcmNoIG5hbWVzIG9mIG9wZW4gZmlsZXMnO1xuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiB7W2tleTogc3RyaW5nXTogUHJvbWlzZTxBcnJheTxGaWxlUmVzdWx0Pj59IHtcbiAgICB2YXIgb3BlblRhYnMgPSBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgcmVzdWx0czogT3BlbkZpbGVMaXN0UHJvdmlkZXIuZ2V0T3BlblRhYnNNYXRjaGluZyhxdWVyeSlcbiAgICB9KTtcbiAgICB2YXIgcmVzdWx0ID0ge3dvcmtzcGFjZToge319O1xuICAgIHJlc3VsdC53b3Jrc3BhY2VbT1BFTkZJTEVfU0VBUkNIX1BST1ZJREVSXSA9IFByb21pc2UucmVzb2x2ZShvcGVuVGFicyk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHN0YXRpYyBhc3luYyBnZXRPcGVuVGFic0ZvclF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiB7W2tleTogc3RyaW5nXTogUHJvbWlzZTxBcnJheTxGaWxlUmVzdWx0Pj59IHtcbiAgICB2YXIgb3BlblRhYnMgPSBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgcmVzdWx0czogdGhpcy5nZXRPcGVuVGFic01hdGNoaW5nKHF1ZXJ5KVxuICAgIH0pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob3BlblRhYnMpO1xuICB9XG5cbiAgZ2V0Q29tcG9uZW50Rm9ySXRlbShpdGVtOiBGaWxlUmVzdWx0KTogUmVhY3RFbGVtZW50IHtcbiAgICByZXR1cm4gRmlsZVJlc3VsdENvbXBvbmVudC5nZXRDb21wb25lbnRGb3JJdGVtKGl0ZW0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gT3BlbkZpbGVMaXN0UHJvdmlkZXI7XG4iXX0=
