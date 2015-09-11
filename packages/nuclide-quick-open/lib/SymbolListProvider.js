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

var assign = Object.assign || require('object-assign');
var cx = require('react-classset');

var HACK_SEARCH_PROVIDER = 'hack';

var ICONS = {
  'interface': 'icon-puzzle',
  'function': 'icon-zap',
  'method': 'icon-zap',
  'typedef': 'icon-tag',
  'class': 'icon-code',
  'abstract class': 'icon-code',
  'constant': 'icon-quote',
  'trait': 'icon-checklist',
  'enum': 'icon-file-binary',
  'default': 'no-icon',
  'unknown': 'icon-squirrel'
};

function bestIconForItem(item) {
  if (!item.additionalInfo) {
    return ICONS['default'];
  }
  // look for exact match
  if (ICONS[item.additionalInfo]) {
    return ICONS[item.additionalInfo];
  };
  // look for presence match, e.g. in 'static method in FooBarClass'
  for (var keyword in ICONS) {
    if (item.additionalInfo.indexOf(keyword) !== -1) {
      return ICONS[keyword];
    }
  }
  return ICONS.unknown;
}

function getLogger() {
  if (!logger) {
    logger = require('nuclide-logging').getLogger();
  }
  return logger;
}

var SymbolListProvider = (function (_QuickSelectionProvider) {
  _inherits(SymbolListProvider, _QuickSelectionProvider);

  function SymbolListProvider() {
    _classCallCheck(this, SymbolListProvider);

    _get(Object.getPrototypeOf(SymbolListProvider.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(SymbolListProvider, [{
    key: 'getPromptText',
    value: function getPromptText() {
      return 'Symbol Search: prefix @ = function % = constants # = class';
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (query) {
      var _require = require('nuclide-client');

      var getClient = _require.getClient;

      if (query.length === 0) {
        return [];
      } else {
        var queries = atom.project.getDirectories().map(_asyncToGenerator(function* (directory) {
          var directoryPath = directory.getPath();
          var basename = directory.getBaseName();

          var client = getClient(directoryPath);

          var remoteUri = require('nuclide-remote-uri');

          var _remoteUri$parse = remoteUri.parse(directoryPath);

          var protocol = _remoteUri$parse.protocol;
          var host = _remoteUri$parse.host;
          var rootDirectory = _remoteUri$parse.path;

          var allProviders = yield client.getSearchProviders(rootDirectory);
          var providers = allProviders.filter(function (p) {
            return p.name === HACK_SEARCH_PROVIDER;
          });
          if (!providers.length) {
            return [];
          }
          var shouldPrependBasePath = !!(protocol && host);
          var searchRequests = {};
          providers.forEach(function (provider) {
            var request = client.doSearchQuery(rootDirectory, provider.name, query);
            if (shouldPrependBasePath) {
              request = request.then(function (response) {
                response.results.forEach(function (r) {
                  r.path = protocol + '//' + host + r.path;
                });
                return response;
              });
            }
            searchRequests[provider.name] = request;
          });
          var queries = {};
          queries[basename] = searchRequests;
          return queries;
        }));

        var outputs = [];
        try {
          outputs = yield Promise.all(queries);
        } catch (e) {
          getLogger().error(e);
        }
        return assign.apply(null, [{}].concat(outputs));
      }
    })

    // Returns a component with the name of the symbol on top, and the file's name on the bottom.
    // Styling based on https://github.com/atom/fuzzy-finder/blob/master/lib/fuzzy-finder-view.coffee
  }, {
    key: 'getComponentForItem',
    value: function getComponentForItem(item) {
      var filePath = item.path;
      var filename = pathUtil.basename(filePath);
      var name = item.name;

      var icon = bestIconForItem(item);
      var symbolClasses = cx('file', 'icon', icon);
      return React.createElement(
        'div',
        { title: item.additionalInfo || '' },
        React.createElement(
          'span',
          { className: symbolClasses },
          React.createElement(
            'code',
            null,
            name
          )
        ),
        React.createElement(
          'span',
          { className: 'omnisearch-symbol-result-filename' },
          filename
        )
      );
    }
  }]);

  return SymbolListProvider;
})(QuickSelectionProvider);

module.exports = SymbolListProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1N5bWJvbExpc3RQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxXQUFXLENBQUM7O0FBZ0JaLElBQUksTUFBTSxDQUFDO0FBQ1gsSUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztBQUV0QyxJQUFJLHNCQUFzQixHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDOztBQUVqRSxJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUN2RCxJQUFJLEVBQUUsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7QUFFbkMsSUFBSSxvQkFBb0IsR0FBRyxNQUFNLENBQUM7O0FBRWxDLElBQUksS0FBSyxHQUFHO0FBQ1YsYUFBVyxFQUFFLGFBQWE7QUFDMUIsWUFBVSxFQUFFLFVBQVU7QUFDdEIsVUFBUSxFQUFFLFVBQVU7QUFDcEIsV0FBUyxFQUFFLFVBQVU7QUFDckIsU0FBTyxFQUFFLFdBQVc7QUFDcEIsa0JBQWdCLEVBQUUsV0FBVztBQUM3QixZQUFVLEVBQUUsWUFBWTtBQUN4QixTQUFPLEVBQUUsZ0JBQWdCO0FBQ3pCLFFBQU0sRUFBRSxrQkFBa0I7QUFDMUIsV0FBUyxFQUFFLFNBQVM7QUFDcEIsV0FBUyxFQUFFLGVBQWU7Q0FDM0IsQ0FBQTs7QUFFRCxTQUFTLGVBQWUsQ0FBQyxJQUFJLEVBQUU7QUFDN0IsTUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7QUFDeEIsV0FBTyxLQUFLLFdBQVEsQ0FBQztHQUN0Qjs7QUFFRCxNQUFJ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QUFzQjs7QUF1RXZELE1BQU0sQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtcXVpY2stb3Blbi9saWIvU3ltYm9sTGlzdFByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge1xuICBGaWxlUmVzdWx0LFxuICBHcm91cGVkUmVzdWx0UHJvbWlzZSxcbn0gZnJvbSAnLi90eXBlcyc7XG5cbnZhciBsb2dnZXI7XG52YXIgcGF0aFV0aWwgPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xuXG52YXIgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciA9IHJlcXVpcmUoJy4vUXVpY2tTZWxlY3Rpb25Qcm92aWRlcicpO1xuXG52YXIgYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG52YXIgY3ggPSByZXF1aXJlKCdyZWFjdC1jbGFzc3NldCcpO1xuXG52YXIgSEFDS19TRUFSQ0hfUFJPVklERVIgPSAnaGFjayc7XG5cbnZhciBJQ09OUyA9IHtcbiAgJ2ludGVyZmFjZSc6ICdpY29uLXB1enpsZScsXG4gICdmdW5jdGlvbic6ICdpY29uLXphcCcsXG4gICdtZXRob2QnOiAnaWNvbi16YXAnLFxuICAndHlwZWRlZic6ICdpY29uLXRhZycsXG4gICdjbGFzcyc6ICdpY29uLWNvZGUnLFxuICAnYWJzdHJhY3QgY2xhc3MnOiAnaWNvbi1jb2RlJyxcbiAgJ2NvbnN0YW50JzogJ2ljb24tcXVvdGUnLFxuICAndHJhaXQnOiAnaWNvbi1jaGVja2xpc3QnLFxuICAnZW51bSc6ICdpY29uLWZpbGUtYmluYXJ5JyxcbiAgJ2RlZmF1bHQnOiAnbm8taWNvbicsXG4gICd1bmtub3duJzogJ2ljb24tc3F1aXJyZWwnLFxufVxuXG5mdW5jdGlvbiBiZXN0SWNvbkZvckl0ZW0oaXRlbSkge1xuICBpZiAoIWl0ZW0uYWRkaXRpb25hbEluZm8pIHtcbiAgICByZXR1cm4gSUNPTlMuZGVmYXVsdDtcbiAgfVxuICAvLyBsb29rIGZvciBleGFjdCBtYXRjaFxuICBpZiAoSUNPTlNbaXRlbS5hZGRpdGlvbmFsSW5mb10pIHtcbiAgICByZXR1cm4gSUNPTlNbaXRlbS5hZGRpdGlvbmFsSW5mb107XG4gIH07XG4gIC8vIGxvb2sgZm9yIHByZXNlbmNlIG1hdGNoLCBlLmcuIGluICdzdGF0aWMgbWV0aG9kIGluIEZvb0JhckNsYXNzJ1xuICBmb3IgKHZhciBrZXl3b3JkIGluIElDT05TKSB7XG4gICAgaWYgKGl0ZW0uYWRkaXRpb25hbEluZm8uaW5kZXhPZihrZXl3b3JkKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiBJQ09OU1trZXl3b3JkXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIElDT05TLnVua25vd247XG59XG5cbmZ1bmN0aW9uIGdldExvZ2dlcigpIHtcbiAgaWYgKCFsb2dnZXIpIHtcbiAgICBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcbiAgfVxuICByZXR1cm4gbG9nZ2VyO1xufVxuXG5jbGFzcyBTeW1ib2xMaXN0UHJvdmlkZXIgZXh0ZW5kcyBRdWlja1NlbGVjdGlvblByb3ZpZGVyIHtcbiAgZ2V0UHJvbXB0VGV4dCgpIHtcbiAgICByZXR1cm4gJ1N5bWJvbCBTZWFyY2g6IHByZWZpeCBAID0gZnVuY3Rpb24gJSA9IGNvbnN0YW50cyAjID0gY2xhc3MnO1xuICB9XG5cbiAgYXN5bmMgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiBHcm91cGVkUmVzdWx0UHJvbWlzZSB7XG4gICAgdmFyIHtnZXRDbGllbnR9ID0gcmVxdWlyZSgnbnVjbGlkZS1jbGllbnQnKTtcbiAgICBpZiAocXVlcnkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBxdWVyaWVzID0gYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCkubWFwKGFzeW5jIChkaXJlY3RvcnkpID0+IHtcbiAgICAgICAgdmFyIGRpcmVjdG9yeVBhdGggPSBkaXJlY3RvcnkuZ2V0UGF0aCgpO1xuICAgICAgICB2YXIgYmFzZW5hbWUgPSBkaXJlY3RvcnkuZ2V0QmFzZU5hbWUoKTtcblxuICAgICAgICB2YXIgY2xpZW50ID0gZ2V0Q2xpZW50KGRpcmVjdG9yeVBhdGgpO1xuXG4gICAgICAgIHZhciByZW1vdGVVcmkgPSByZXF1aXJlKCdudWNsaWRlLXJlbW90ZS11cmknKTtcbiAgICAgICAgdmFyIHtwcm90b2NvbCwgaG9zdCwgcGF0aDogcm9vdERpcmVjdG9yeX0gPSByZW1vdGVVcmkucGFyc2UoZGlyZWN0b3J5UGF0aCk7XG5cbiAgICAgICAgdmFyIGFsbFByb3ZpZGVycyA9IGF3YWl0IGNsaWVudC5nZXRTZWFyY2hQcm92aWRlcnMocm9vdERpcmVjdG9yeSk7XG4gICAgICAgIHZhciBwcm92aWRlcnMgPSBhbGxQcm92aWRlcnMuZmlsdGVyKHAgPT4gcC5uYW1lID09PSBIQUNLX1NFQVJDSF9QUk9WSURFUik7XG4gICAgICAgIGlmICghcHJvdmlkZXJzLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2hvdWxkUHJlcGVuZEJhc2VQYXRoID0gISEocHJvdG9jb2wgJiYgaG9zdCk7XG4gICAgICAgIHZhciBzZWFyY2hSZXF1ZXN0cyA9IHt9O1xuICAgICAgICBwcm92aWRlcnMuZm9yRWFjaChwcm92aWRlciA9PiB7XG4gICAgICAgICAgdmFyIHJlcXVlc3QgPSBjbGllbnQuZG9TZWFyY2hRdWVyeShyb290RGlyZWN0b3J5LCAgcHJvdmlkZXIubmFtZSwgcXVlcnkpO1xuICAgICAgICAgIGlmIChzaG91bGRQcmVwZW5kQmFzZVBhdGgpIHtcbiAgICAgICAgICAgIHJlcXVlc3QgPSByZXF1ZXN0LnRoZW4oXG4gICAgICAgICAgICAgIHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICByZXNwb25zZS5yZXN1bHRzLmZvckVhY2gociA9PiB7ci5wYXRoID0gYCR7cHJvdG9jb2x9Ly8ke2hvc3R9JHtyLnBhdGh9YH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2VhcmNoUmVxdWVzdHNbcHJvdmlkZXIubmFtZV0gPSByZXF1ZXN0O1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHF1ZXJpZXMgPSB7fTtcbiAgICAgICAgcXVlcmllc1tiYXNlbmFtZV0gPSBzZWFyY2hSZXF1ZXN0cztcbiAgICAgICAgcmV0dXJuIHF1ZXJpZXM7XG4gICAgICB9KTtcblxuICAgICAgdmFyIG91dHB1dHMgPSBbXTtcbiAgICAgIHRyeSB7XG4gICAgICAgIG91dHB1dHMgPSBhd2FpdCBQcm9taXNlLmFsbChxdWVyaWVzKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBnZXRMb2dnZXIoKS5lcnJvcihlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhc3NpZ24uYXBwbHkobnVsbCwgW3t9XS5jb25jYXQob3V0cHV0cykpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgYSBjb21wb25lbnQgd2l0aCB0aGUgbmFtZSBvZiB0aGUgc3ltYm9sIG9uIHRvcCwgYW5kIHRoZSBmaWxlJ3MgbmFtZSBvbiB0aGUgYm90dG9tLlxuICAvLyBTdHlsaW5nIGJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2Z1enp5LWZpbmRlci9ibG9iL21hc3Rlci9saWIvZnV6enktZmluZGVyLXZpZXcuY29mZmVlXG4gIGdldENvbXBvbmVudEZvckl0ZW0oaXRlbTogRmlsZVJlc3VsdCk6IFJlYWN0RWxlbWVudCB7XG4gICAgdmFyIGZpbGVQYXRoID0gaXRlbS5wYXRoO1xuICAgIHZhciBmaWxlbmFtZSA9IHBhdGhVdGlsLmJhc2VuYW1lKGZpbGVQYXRoKTtcbiAgICB2YXIgbmFtZSA9IGl0ZW0ubmFtZTtcblxuICAgIHZhciBpY29uID0gYmVzdEljb25Gb3JJdGVtKGl0ZW0pO1xuICAgIHZhciBzeW1ib2xDbGFzc2VzID0gY3goJ2ZpbGUnLCAnaWNvbicsIGljb24pO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHRpdGxlPXtpdGVtLmFkZGl0aW9uYWxJbmZvIHx8ICcnfT5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzeW1ib2xDbGFzc2VzfT48Y29kZT57bmFtZX08L2NvZGU+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJvbW5pc2VhcmNoLXN5bWJvbC1yZXN1bHQtZmlsZW5hbWVcIj57ZmlsZW5hbWV9PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bWJvbExpc3RQcm92aWRlcjtcbiJdfQ==
