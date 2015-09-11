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

var logger;
var pathUtil = require('path');
var React = require('react-for-atom');
var QuickSelectionProvider = require('./QuickSelectionProvider');
var SymbolListProvider = require('./SymbolListProvider');
var BigGrepListProvider = require('./BigGrepListProvider');
var FileListProvider = require('./FileListProvider');
var OpenFileListProvider = require('./OpenFileListProvider');

var assign = Object.assign || require('object-assign');

var MAX_RESULTS_PER_SERVICE = 5;
var CUSTOM_RENDERERS = {
  hack: SymbolListProvider,
  biggrep: BigGrepListProvider,
  filelist: FileListProvider,
  openfiles: OpenFileListProvider
};

var OmniSearchResultProvider = (function (_QuickSelectionProvider) {
  _inherits(OmniSearchResultProvider, _QuickSelectionProvider);

  function OmniSearchResultProvider() {
    _classCallCheck(this, OmniSearchResultProvider);

    _get(Object.getPrototypeOf(OmniSearchResultProvider.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(OmniSearchResultProvider, [{
    key: 'getPromptText',
    value: function getPromptText() {
      return 'Search for anything...';
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (query) {
      var _this = this;

      if (query.length === 0) {
        return {
          workspace: {
            openfiles: require('./OpenFileListProvider').getOpenTabsForQuery(query)
          }
        };
      } else {
        var queries = atom.project.getDirectories().map(_asyncToGenerator(function* (directory) {
          return _this._getQueriesForDirectory(query, directory);
        }));

        queries.push(Promise.resolve({
          workspace: {
            openfiles: require('./OpenFileListProvider').getOpenTabsForQuery(query)
          }
        }));

        try {
          var outputs = yield Promise.all(queries);
        } catch (e) {
          this.getLogger().error(e);
        }
        return assign.apply(null, [{}].concat(outputs));
      }
    })
  }, {
    key: '_getQueriesForDirectory',
    value: _asyncToGenerator(function* (query, directory) {
      var _require = require('nuclide-client');

      var getClient = _require.getClient;

      var directoryPath = directory.getPath();
      var basename = directory.getBaseName();
      var client = getClient(directoryPath);

      var remoteUri = require('nuclide-remote-uri');

      var _remoteUri$parse = remoteUri.parse(directoryPath);

      var protocol = _remoteUri$parse.protocol;
      var host = _remoteUri$parse.host;
      var rootDirectory = _remoteUri$parse.path;

      var providers = yield client.getSearchProviders(rootDirectory);

      var searchRequests = {};
      // fileName search
      searchRequests.filelist = client.searchDirectory(directoryPath, query).then(function (files) {
        return {
          results: files.slice(0, MAX_RESULTS_PER_SERVICE)
        };
      });
      var shouldPrependBasePath = !!(protocol && host);
      providers.forEach(function (provider) {
        searchRequests[provider.name] = client.doSearchQuery(rootDirectory, provider.name, query).then(function (results) {
          return assign({}, results, {
            results: results.results.slice(0, MAX_RESULTS_PER_SERVICE).map(function (r) {
              r.path = shouldPrependBasePath ? protocol + '//' + host + r.path : r.path;
              return r;
            })
          });
        });
      });
      var queryMap = {};
      queryMap[basename] = searchRequests;
      return queryMap;
    })
  }, {
    key: 'getComponentForItem',
    value: function getComponentForItem(item, serviceName) {

      var customRenderer = CUSTOM_RENDERERS[serviceName];
      if (customRenderer) {
        return new customRenderer().getComponentForItem(item);
      }
      var filename = pathUtil.basename(item.path);

      return React.createElement(
        'div',
        { className: 'file icon icon-file-text' },
        filename
      );
    }
  }, {
    key: 'getLogger',
    value: function getLogger() {
      if (!logger) {
        logger = require('nuclide-logging').getLogger();
      }
      return logger;
    }
  }]);

  return OmniSearchResultProvider;
})(QuickSelectionProvider);

module.exports = OmniSearchResultProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL09tbmlTZWFyY2hSZXN1bHRQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxXQUFXLENBQUM7O0FBZ0JaLElBQUksTUFBTSxDQUFDO0FBQ1gsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3RDLElBQUksc0JBQXNCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDakUsSUFBSSxrQkFBa0IsR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUN6RCxJQUFJLG1CQUFtQixHQUFHLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0FBQzNELElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDckQsSUFBSSxvQkFBb0IsR0FBRyxPQUFPLENBQUMsd0JBQXdCLENBQUMsQ0FBQzs7QUFFN0QsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7O0FBRXZELElBQUksdUJBQXVCLEdBQUcsQ0FBQyxDQUFDO0FBQ2hDLElBQUksZ0JBQWdCLEdBQUc7QUFDckIsTUFBSSxFQUFFLGtCQUFrQjtBQUN4QixTQUFPLEVBQUUsbUJBQW1CO0FBQzVCLFVBQVEsRUFBRSxnQkFBZ0I7QUFDMUIsV0FBUyxFQUFFLG9CQUFvQjtDQUNoQyxDQUFDOztJQUVJLHdCQUF3QjtZQUF4Qix3QkFBd0I7O1dBQXhCLHdCQUF3QjswQkFBeEIsd0JBQXdCOzsrQkFBeEIsd0JBQXdCOzs7ZUFBeEIsd0JBQXdCOztXQUNmLHlCQUFH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ZUFBQyxDQUFDLElBQUksR0FBRyxxQkFBcUIsR0FBTSxRQUFRLFVBQUssSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUssQ0FBQyxDQUFDLElBQUksQ0FBQztBQUMxRSxxQkFBTyxDQUFDLENBQUM7YUFDVixDQUFDO1dBQ0wsQ0FDRjtTQUFBLENBQ0YsQ0FBQztPQUNQLENBQUMsQ0FBQztBQUNILFVBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNsQixjQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsY0FBYyxDQUFDO0FBQ3BDLGFBQU8sUUFBUSxDQUFDO0tBQ2pCOzs7V0FFa0IsNkJBQUMsSUFBZ0IsRUFBRSxXQUFvQixFQUFnQjs7QUFFeEUsVUFBSSxjQUFjLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDbkQsVUFBSSxjQUFjLEVBQUU7QUFDbEIsZUFBTyxBQUFDLElBQUksY0FBYyxFQUFFLENBQUUsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDekQ7QUFDRCxVQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFNUMsYUFDRTs7VUFBSyxTQUFTLEVBQUMsMEJBQTBCO1FBQ3RDLFFBQVE7T0FDTCxDQUNOO0tBQ0g7OztXQUVRLHFCQUFHO0FBQ1YsVUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLGNBQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztPQUNqRDtBQUNELGFBQU8sTUFBTSxDQUFDO0tBQ2Y7OztTQWhHRyx3QkFBd0I7R0FBUyxzQkFBc0I7O0FBbUc3RCxNQUFNLENBQUMsT0FBTyxHQUFHLHdCQUF3QixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL09tbmlTZWFyY2hSZXN1bHRQcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtcbiAgRmlsZVJlc3VsdCxcbiAgR3JvdXBlZFJlc3VsdFByb21pc2UsXG59IGZyb20gJy4vdHlwZXMnO1xuXG52YXIgbG9nZ2VyO1xudmFyIHBhdGhVdGlsID0gcmVxdWlyZSgncGF0aCcpO1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcbnZhciBRdWlja1NlbGVjdGlvblByb3ZpZGVyID0gcmVxdWlyZSgnLi9RdWlja1NlbGVjdGlvblByb3ZpZGVyJyk7XG52YXIgU3ltYm9sTGlzdFByb3ZpZGVyID0gcmVxdWlyZSgnLi9TeW1ib2xMaXN0UHJvdmlkZXInKTtcbnZhciBCaWdHcmVwTGlzdFByb3ZpZGVyID0gcmVxdWlyZSgnLi9CaWdHcmVwTGlzdFByb3ZpZGVyJyk7XG52YXIgRmlsZUxpc3RQcm92aWRlciA9IHJlcXVpcmUoJy4vRmlsZUxpc3RQcm92aWRlcicpO1xudmFyIE9wZW5GaWxlTGlzdFByb3ZpZGVyID0gcmVxdWlyZSgnLi9PcGVuRmlsZUxpc3RQcm92aWRlcicpO1xuXG52YXIgYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbnZhciBNQVhfUkVTVUxUU19QRVJfU0VSVklDRSA9IDU7XG52YXIgQ1VTVE9NX1JFTkRFUkVSUyA9IHtcbiAgaGFjazogU3ltYm9sTGlzdFByb3ZpZGVyLFxuICBiaWdncmVwOiBCaWdHcmVwTGlzdFByb3ZpZGVyLFxuICBmaWxlbGlzdDogRmlsZUxpc3RQcm92aWRlcixcbiAgb3BlbmZpbGVzOiBPcGVuRmlsZUxpc3RQcm92aWRlcixcbn07XG5cbmNsYXNzIE9tbmlTZWFyY2hSZXN1bHRQcm92aWRlciBleHRlbmRzIFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIge1xuICBnZXRQcm9tcHRUZXh0KCkge1xuICAgIHJldHVybiAnU2VhcmNoIGZvciBhbnl0aGluZy4uLic7XG4gIH1cblxuICBhc3luYyBleGVjdXRlUXVlcnkocXVlcnk6IHN0cmluZyk6IEdyb3VwZWRSZXN1bHRQcm9taXNlIHtcbiAgICBpZiAocXVlcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB3b3Jrc3BhY2U6IHtcbiAgICAgICAgICBvcGVuZmlsZXM6IHJlcXVpcmUoJy4vT3BlbkZpbGVMaXN0UHJvdmlkZXInKS5nZXRPcGVuVGFic0ZvclF1ZXJ5KHF1ZXJ5KVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcXVlcmllcyA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLm1hcChcbiAgICAgICAgYXN5bmMoZGlyZWN0b3J5KSA9PiB0aGlzLl9nZXRRdWVyaWVzRm9yRGlyZWN0b3J5KHF1ZXJ5LCBkaXJlY3RvcnkpXG4gICAgICApO1xuXG4gICAgICBxdWVyaWVzLnB1c2goUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgd29ya3NwYWNlOiB7XG4gICAgICAgICAgb3BlbmZpbGVzOiByZXF1aXJlKCcuL09wZW5GaWxlTGlzdFByb3ZpZGVyJykuZ2V0T3BlblRhYnNGb3JRdWVyeShxdWVyeSksXG4gICAgICAgIH0sXG4gICAgICB9KSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciBvdXRwdXRzID0gYXdhaXQgUHJvbWlzZS5hbGwocXVlcmllcyk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgdGhpcy5nZXRMb2dnZXIoKS5lcnJvcihlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhc3NpZ24uYXBwbHkobnVsbCwgW3t9XS5jb25jYXQob3V0cHV0cykpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIF9nZXRRdWVyaWVzRm9yRGlyZWN0b3J5KHF1ZXJ5OiBzdHJpbmcsIGRpcmVjdG9yeTogYW55KTogYW55IHtcbiAgICB2YXIge2dldENsaWVudH0gPSByZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpO1xuICAgIHZhciBkaXJlY3RvcnlQYXRoID0gZGlyZWN0b3J5LmdldFBhdGgoKTtcbiAgICB2YXIgYmFzZW5hbWUgPSBkaXJlY3RvcnkuZ2V0QmFzZU5hbWUoKTtcbiAgICB2YXIgY2xpZW50ID0gZ2V0Q2xpZW50KGRpcmVjdG9yeVBhdGgpO1xuXG4gICAgdmFyIHJlbW90ZVVyaSA9IHJlcXVpcmUoJ251Y2xpZGUtcmVtb3RlLXVyaScpO1xuICAgIHZhciB7cHJvdG9jb2wsIGhvc3QsIHBhdGg6IHJvb3REaXJlY3Rvcnl9ID0gcmVtb3RlVXJpLnBhcnNlKGRpcmVjdG9yeVBhdGgpO1xuICAgIHZhciBwcm92aWRlcnMgPSBhd2FpdCBjbGllbnQuZ2V0U2VhcmNoUHJvdmlkZXJzKHJvb3REaXJlY3RvcnkpO1xuXG4gICAgdmFyIHNlYXJjaFJlcXVlc3RzID0ge307XG4gICAgLy8gZmlsZU5hbWUgc2VhcmNoXG4gICAgc2VhcmNoUmVxdWVzdHMuZmlsZWxpc3QgPSBjbGllbnQuc2VhcmNoRGlyZWN0b3J5KGRpcmVjdG9yeVBhdGgsIHF1ZXJ5KVxuICAgICAgLnRoZW4oZmlsZXMgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHJlc3VsdHM6IGZpbGVzLnNsaWNlKDAsIE1BWF9SRVNVTFRTX1BFUl9TRVJWSUNFKVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgdmFyIHNob3VsZFByZXBlbmRCYXNlUGF0aCA9ICEhKHByb3RvY29sICYmIGhvc3QpO1xuICAgIHByb3ZpZGVycy5mb3JFYWNoKHByb3ZpZGVyID0+IHtcbiAgICAgIHNlYXJjaFJlcXVlc3RzW3Byb3ZpZGVyLm5hbWVdID1cbiAgICAgICAgY2xpZW50XG4gICAgICAgICAgLmRvU2VhcmNoUXVlcnkocm9vdERpcmVjdG9yeSwgcHJvdmlkZXIubmFtZSwgcXVlcnkpXG4gICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICByZXN1bHRzID0+IGFzc2lnbihcbiAgICAgICAgICAgICAge30sXG4gICAgICAgICAgICAgIHJlc3VsdHMsXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzOiByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAucmVzdWx0c1xuICAgICAgICAgICAgICAgICAgLnNsaWNlKDAsIE1BWF9SRVNVTFRTX1BFUl9TRVJWSUNFKVxuICAgICAgICAgICAgICAgICAgLm1hcChyID0+IHtcbiAgICAgICAgICAgICAgICAgICAgci5wYXRoID0gc2hvdWxkUHJlcGVuZEJhc2VQYXRoID8gYCR7cHJvdG9jb2x9Ly8ke2hvc3R9JHtyLnBhdGh9YCA6IHIucGF0aDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcbiAgICB9KTtcbiAgICB2YXIgcXVlcnlNYXAgPSB7fTtcbiAgICBxdWVyeU1hcFtiYXNlbmFtZV0gPSBzZWFyY2hSZXF1ZXN0cztcbiAgICByZXR1cm4gcXVlcnlNYXA7XG4gIH1cblxuICBnZXRDb21wb25lbnRGb3JJdGVtKGl0ZW06IEZpbGVSZXN1bHQsIHNlcnZpY2VOYW1lOiA/c3RyaW5nKTogUmVhY3RFbGVtZW50IHtcblxuICAgIHZhciBjdXN0b21SZW5kZXJlciA9IENVU1RPTV9SRU5ERVJFUlNbc2VydmljZU5hbWVdO1xuICAgIGlmIChjdXN0b21SZW5kZXJlcikge1xuICAgICAgcmV0dXJuIChuZXcgY3VzdG9tUmVuZGVyZXIoKSkuZ2V0Q29tcG9uZW50Rm9ySXRlbShpdGVtKTtcbiAgICB9XG4gICAgdmFyIGZpbGVuYW1lID0gcGF0aFV0aWwuYmFzZW5hbWUoaXRlbS5wYXRoKTtcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpbGUgaWNvbiBpY29uLWZpbGUtdGV4dFwiPlxuICAgICAgICB7ZmlsZW5hbWV9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgZ2V0TG9nZ2VyKCkge1xuICAgIGlmICghbG9nZ2VyKSB7XG4gICAgICBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcbiAgICB9XG4gICAgcmV0dXJuIGxvZ2dlcjtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE9tbmlTZWFyY2hSZXN1bHRQcm92aWRlcjtcbiJdfQ==
