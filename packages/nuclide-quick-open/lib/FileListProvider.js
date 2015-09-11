var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

'use babel';

var QuickSelectionProvider = require('./QuickSelectionProvider');

var _require = require('nuclide-atom-helpers');

var fileTypeClass = _require.fileTypeClass;

var _require2 = require('nuclide-client');

var getClient = _require2.getClient;

var React = require('react-for-atom');
var path = require('path');

var _require3 = require('nuclide-client');

var getClient = _require3.getClient;

var QuickSelectionProvider = require('./QuickSelectionProvider');
var FileResultComponent = require('./FileResultComponent');

var assign = Object.assign || require('object-assign');
var logger;

function getLogger() {
  if (!logger) {
    logger = require('nuclide-logging').getLogger();
  }
  return logger;
}

var FileListProvider = (function (_QuickSelectionProvider) {
  _inherits(FileListProvider, _QuickSelectionProvider);

  function FileListProvider() {
    _classCallCheck(this, FileListProvider);

    _get(Object.getPrototypeOf(FileListProvider.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(FileListProvider, [{
    key: 'getPromptText',
    value: function getPromptText() {
      return 'Fuzzy File Name Search';
    }
  }, {
    key: 'executeQuery',
    value: _asyncToGenerator(function* (query) {
      if (query.length === 0) {
        return {};
      }
      var queries = atom.project.getDirectories().map(_asyncToGenerator(function* (directory) {
        var directoryPath = directory.getPath();
        var basename = directory.getBaseName();
        var client = getClient(directoryPath);

        var searchRequests = {
          filelist: client.searchDirectory(directoryPath, query).then(function (files) {
            return { results: files };
          })
        };
        return _defineProperty({}, basename, searchRequests);
      }));

      var outputs = [];
      try {
        outputs = yield Promise.all(queries);
      } catch (e) {
        getLogger().error(e);
      }
      return assign.apply(null, [{}].concat(outputs));
    })

    // Returns a component with the filename on top, and the file's folder on the bottom.
    // Styling based on https://github.com/atom/fuzzy-finder/blob/master/lib/fuzzy-finder-view.coffee
  }, {
    key: 'getComponentForItem',
    value: function getComponentForItem(item) {
      return FileResultComponent.getComponentForItem(item);
    }
  }]);

  return FileListProvider;
})(QuickSelectionProvider);

module.exports = FileListProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL0ZpbGVMaXN0UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxXQUFXLENBQUM7O0FBZ0JaLElBQUksc0JBQXNCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7O2VBQzNDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzs7SUFBaEQsYUFBYSxZQUFiLGFBQWE7O2dCQUNBLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7SUFBdEMsU0FBUyxhQUFULFNBQVM7O0FBQ2QsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDdEMsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztnQkFDVCxPQUFPLENBQUMsZ0JBQWdCLENBQUM7O0lBQXRDLFNBQVMsYUFBVCxTQUFTOztBQUNkLElBQUksc0JBQXNCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDakUsSUFBSSxtQkFBbUIsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQzs7QUFFM0QsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDdkQsSUFBSSxNQUFNLENBQUM7O0FBRVgsU0FBUyxTQUFTLEdBQUc7QUFDbkIsTUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLFVBQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztHQUNqRDtBQUNELFNBQU8sTUFBTSxDQUFDO0NBQ2Y7O0lBQ0ssZ0JBQWdCO1lBQWhCLGdCQUFnQjs7V0FBaEIsZ0JBQWdCOzBCQUFoQixnQkFBZ0I7OytCQUFoQixnQkFBZ0I7OztlQUFoQixnQkFBZ0I7O1dBRVAseUJBQUc7QUFDZCxhQUFPLHdCQUF3QixDQUFDO0tBQ2pDOzs7NkJBRWlCLFdBQUMsS0FBYSxFQUF3QjtBQUN0RCxVQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO0FBQ3RCLGVBQU8sRUFBRSxDQUFDO09BQ1g7QUFDRCxVQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDLEdBQUcsbUJBQUMsV0FBTyxTQUFTLEVBQUs7QUFDbkUsWUFBSSxhQUFhLEdBQUcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3hDLFlBQUksUUFBUSxHQUFHLFNBQVMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7O0FBRXRDLFlBQUksY0FBYyxHQUFHO0FBQ25CLGtCQUFRLEVBQUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQUMsbUJBQU8sRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUM7V0FBQyxDQUFDO1NBQ2pHLENBQUM7QUFDRixtQ0FBUyxRQUFRLEVBQUcsY0FBYyxFQUFFO09BQ3JDLEVBQUMsQ0FBQzs7QUFFSCxVQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDakIsVUFBSTtBQUNGLGVBQU8sR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7T0FDdEMsQ0FBQyxPQUFNLENBQUMsRUFBRTtBQUNULGlCQUFTLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDdEI7QUFDRCxhQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDakQ7Ozs7OztXQUlrQiw2QkFBQyxJQUFnQixFQUFnQjtBQUNsRCxhQUFPLG1CQUFtQixDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3REOzs7U0FsQ0csZ0JBQWdCO0dBQVMsc0JBQXNCOztBQXFDckQsTUFBTSxDQUFDLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1xdWljay1vcGVuL2xpYi9GaWxlTGlzdFByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge1xuICBGaWxlUmVzdWx0LFxuICBHcm91cGVkUmVzdWx0UHJvbWlzZSxcbn0gZnJvbSAnLi90eXBlcyc7XG5cbnZhciBRdWlja1NlbGVjdGlvblByb3ZpZGVyID0gcmVxdWlyZSgnLi9RdWlja1NlbGVjdGlvblByb3ZpZGVyJyk7XG52YXIge2ZpbGVUeXBlQ2xhc3N9ID0gcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKTtcbnZhciB7Z2V0Q2xpZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIge2dldENsaWVudH0gPSByZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpO1xudmFyIFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIgPSByZXF1aXJlKCcuL1F1aWNrU2VsZWN0aW9uUHJvdmlkZXInKTtcbnZhciBGaWxlUmVzdWx0Q29tcG9uZW50ID0gcmVxdWlyZSgnLi9GaWxlUmVzdWx0Q29tcG9uZW50Jyk7XG5cbnZhciBhc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcbnZhciBsb2dnZXI7XG5cbmZ1bmN0aW9uIGdldExvZ2dlcigpIHtcbiAgaWYgKCFsb2dnZXIpIHtcbiAgICBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcbiAgfVxuICByZXR1cm4gbG9nZ2VyO1xufVxuY2xhc3MgRmlsZUxpc3RQcm92aWRlciBleHRlbmRzIFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIge1xuXG4gIGdldFByb21wdFRleHQoKSB7XG4gICAgcmV0dXJuICdGdXp6eSBGaWxlIE5hbWUgU2VhcmNoJztcbiAgfVxuXG4gIGFzeW5jIGV4ZWN1dGVRdWVyeShxdWVyeTogc3RyaW5nKTogR3JvdXBlZFJlc3VsdFByb21pc2Uge1xuICAgIGlmIChxdWVyeS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgdmFyIHF1ZXJpZXMgPSBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKS5tYXAoYXN5bmMgKGRpcmVjdG9yeSkgPT4ge1xuICAgICAgdmFyIGRpcmVjdG9yeVBhdGggPSBkaXJlY3RvcnkuZ2V0UGF0aCgpO1xuICAgICAgdmFyIGJhc2VuYW1lID0gZGlyZWN0b3J5LmdldEJhc2VOYW1lKCk7XG4gICAgICB2YXIgY2xpZW50ID0gZ2V0Q2xpZW50KGRpcmVjdG9yeVBhdGgpO1xuXG4gICAgICB2YXIgc2VhcmNoUmVxdWVzdHMgPSB7XG4gICAgICAgIGZpbGVsaXN0OiBjbGllbnQuc2VhcmNoRGlyZWN0b3J5KGRpcmVjdG9yeVBhdGgsIHF1ZXJ5KS50aGVuKGZpbGVzID0+IHtyZXR1cm4ge3Jlc3VsdHM6IGZpbGVzfTt9KSxcbiAgICAgIH07XG4gICAgICByZXR1cm4ge1tiYXNlbmFtZV06IHNlYXJjaFJlcXVlc3RzfTtcbiAgICB9KTtcblxuICAgIHZhciBvdXRwdXRzID0gW107XG4gICAgdHJ5IHtcbiAgICAgIG91dHB1dHMgPSBhd2FpdCBQcm9taXNlLmFsbChxdWVyaWVzKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGdldExvZ2dlcigpLmVycm9yKGUpO1xuICAgIH1cbiAgICByZXR1cm4gYXNzaWduLmFwcGx5KG51bGwsIFt7fV0uY29uY2F0KG91dHB1dHMpKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBjb21wb25lbnQgd2l0aCB0aGUgZmlsZW5hbWUgb24gdG9wLCBhbmQgdGhlIGZpbGUncyBmb2xkZXIgb24gdGhlIGJvdHRvbS5cbiAgLy8gU3R5bGluZyBiYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vYXRvbS9mdXp6eS1maW5kZXIvYmxvYi9tYXN0ZXIvbGliL2Z1enp5LWZpbmRlci12aWV3LmNvZmZlZVxuICBnZXRDb21wb25lbnRGb3JJdGVtKGl0ZW06IEZpbGVSZXN1bHQpOiBSZWFjdEVsZW1lbnQge1xuICAgIHJldHVybiBGaWxlUmVzdWx0Q29tcG9uZW50LmdldENvbXBvbmVudEZvckl0ZW0oaXRlbSk7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZUxpc3RQcm92aWRlcjtcbiJdfQ==
