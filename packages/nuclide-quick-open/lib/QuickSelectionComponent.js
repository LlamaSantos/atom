var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

'use babel';

var AtomInput = require('nuclide-ui-atom-input');

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;
var Disposable = _require.Disposable;
var Emitter = _require.Emitter;

var QuickSelectionProvider = require('./QuickSelectionProvider');

var _require2 = require('nuclide-commons');

var array = _require2.array;
var debounce = _require2.debounce;
var object = _require2.object;

var React = require('react-for-atom');
var NuclideTabs = require('nuclide-ui-tabs');

var _require3 = require('./searchResultHelpers');

var filterEmptyResults = _require3.filterEmptyResults;
var flattenResults = _require3.flattenResults;
var PropTypes = React.PropTypes;

var cx = require('react-classset');

function sanitizeQuery(query) {
  return query.trim();
}

/**
 * Determine what the applicable shortcut for a given action is within this component's context.
 * For example, this will return different keybindings on windows vs linux.
 */
function _findKeybindingForAction(action, target) {
  var _require4 = require('nuclide-keystroke-label');

  var humanizeKeystroke = _require4.humanizeKeystroke;

  var matchingKeyBindings = atom.keymaps.findKeyBindings({
    command: action,
    target: target
  });
  var keystroke = matchingKeyBindings.length && matchingKeyBindings[0].keystrokes || '';
  return humanizeKeystroke(keystroke);
}

var QuickSelectionComponent = (function (_React$Component) {
  _inherits(QuickSelectionComponent, _React$Component);

  function QuickSelectionComponent(props) {
    var _this = this;

    _classCallCheck(this, QuickSelectionComponent);

    _get(Object.getPrototypeOf(QuickSelectionComponent.prototype), 'constructor', this).call(this, props);
    this._emitter = new Emitter();
    this._subscriptions = new CompositeDisposable();
    this._boundSelect = function () {
      return _this.select();
    };
    this._boundHandleTabChange = function (tab) {
      return _this._handleTabChange(tab);
    };

    this.state = {
      activeTab: props.initialActiveTab,
      // treated as immutable
      resultsByService: {
        /* EXAMPLE:
        providerName: {
          directoryName: {
            items: [Array<FileResult>],
            waiting: true,
            error: null,
          },
        },
        */
      },
      selectedDirectory: '',
      selectedService: '',
      selectedItemIndex: -1
    };
  }

  _createClass(QuickSelectionComponent, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var _this2 = this;

      if (nextProps.provider !== this.props.provider) {
        if (nextProps.provider) {
          this._getTextEditor().setPlaceholderText(nextProps.provider.getPromptText());
          var newResults = {};
          this.setState({
            activeTab: nextProps.provider.constructor.name || this.state.activeTab,
            resultsByService: newResults
          }, function () {
            _this2.setQuery(_this2.refs['queryInput'].getText());
            _this2._updateQueryHandler();
            _this2._emitter.emit('items-changed', newResults);
          });
        }
      }
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      if (prevState.resultsByService !== this.state.resultsByService) {
        this._emitter.emit('items-changed', this.state.resultsByService);
      }

      if (prevState.selectedItemIndex !== this.state.selectedItemIndex || prevState.selectedService !== this.state.selectedService || prevState.selectedDirectory !== this.state.selectedDirectory) {
        this._updateScrollPosition();
      }
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this3 = this;

      this._modalNode = React.findDOMNode(this);
      this._subscriptions.add(atom.commands.add(this._modalNode, 'core:move-up', this.moveSelectionUp.bind(this)), atom.commands.add(this._modalNode, 'core:move-down', this.moveSelectionDown.bind(this)), atom.commands.add(this._modalNode, 'core:move-to-top', this.moveSelectionToTop.bind(this)), atom.commands.add(this._modalNode, 'core:move-to-bottom', this.moveSelectionToBottom.bind(this)), atom.commands.add(this._modalNode, 'core:confirm', this.select.bind(this)), atom.commands.add(this._modalNode, 'core:cancel', this.cancel.bind(this)));

      var inputTextEditor = this.getInputTextEditor();
      inputTextEditor.addEventListener('blur', function (event) {
        if (event.relatedTarget !== null) {
          // cancel can be interrupted by user interaction with the modal
          _this3._scheduledCancel = setTimeout(_this3.cancel.bind(_this3), 100);
        }
      });

      this._updateQueryHandler();
      inputTextEditor.model.onDidChange(function () {
        return _this3._handleTextInputChange();
      });
      this.clear();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this._emitter.dispose();
      this._subscriptions.dispose();
    }
  }, {
    key: 'onCancellation',
    value: function onCancellation(callback) {
      return this._emitter.on('canceled', callback);
    }
  }, {
    key: 'onSelection',
    value: function onSelection(callback) {
      return this._emitter.on('selected', callback);
    }
  }, {
    key: 'onSelectionChanged',
    value: function onSelectionChanged(callback) {
      return this._emitter.on('selection-changed', callback);
    }
  }, {
    key: 'onItemsChanged',
    value: function onItemsChanged(callback) {
      return this._emitter.on('items-changed', callback);
    }
  }, {
    key: 'onTabChange',
    value: function onTabChange(callback) {
      return this._emitter.on('active-provider-changed', callback);
    }
  }, {
    key: '_updateQueryHandler',
    value: function _updateQueryHandler() {
      var _this4 = this;

      this._debouncedQueryHandler = debounce(function () {
        return _this4.setQuery(_this4.getInputTextEditor().model.getText());
      }, this.getProvider().getDebounceDelay());
    }
  }, {
    key: '_handleTextInputChange',
    value: function _handleTextInputChange() {
      this._debouncedQueryHandler();
    }
  }, {
    key: 'select',
    value: function select() {
      var selectedItem = this.getSelectedItem();
      if (!selectedItem) {
        this.cancel();
      } else {
        this._emitter.emit('selected', selectedItem);
      }
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this._emitter.emit('canceled');
    }
  }, {
    key: 'clearSelection',
    value: function clearSelection() {
      this.setSelectedIndex('', '', -1);
    }
  }, {
    key: '_getCurrentResultContext',
    value: function _getCurrentResultContext() {
      var nonEmptyResults = filterEmptyResults(this.state.resultsByService);
      var serviceNames = Object.keys(nonEmptyResults);
      var currentServiceIndex = serviceNames.indexOf(this.state.selectedService);
      var currentService = nonEmptyResults[this.state.selectedService];

      if (!currentService) {
        return null;
      }

      var directoryNames = Object.keys(currentService);
      var currentDirectoryIndex = directoryNames.indexOf(this.state.selectedDirectory);
      var currentDirectory = currentService[this.state.selectedDirectory];

      if (!currentDirectory || !currentDirectory.items) {
        return null;
      }

      return {
        nonEmptyResults: nonEmptyResults,
        serviceNames: serviceNames,
        currentServiceIndex: currentServiceIndex,
        currentService: currentService,
        directoryNames: directoryNames,
        currentDirectoryIndex: currentDirectoryIndex,
        currentDirectory: currentDirectory
      };
    }
  }, {
    key: 'moveSelectionDown',
    value: function moveSelectionDown() {
      var context = this._getCurrentResultContext();
      if (!context) {
        this.moveSelectionToTop();
        return;
      }

      if (this.state.selectedItemIndex < context.currentDirectory.items.length - 1) {
        // only bump the index if remaining in current directory
        this.setSelectedIndex(this.state.selectedService, this.state.selectedDirectory, this.state.selectedItemIndex + 1);
      } else {
        // otherwise go to next directory...
        if (context.currentDirectoryIndex < context.directoryNames.length - 1) {
          this.setSelectedIndex(this.state.selectedService, context.directoryNames[context.currentDirectoryIndex + 1], 0);
        } else {
          // ...or the next service...
          if (context.currentServiceIndex < context.serviceNames.length - 1) {
            var newServiceName = context.serviceNames[context.currentServiceIndex + 1];
            var newDirectoryName = Object.keys(context.nonEmptyResults[newServiceName]).shift();
            this.setSelectedIndex(newServiceName, newDirectoryName, 0);
          } else {
            // ...or wrap around to the very top
            this.moveSelectionToTop();
          }
        }
      }
    }
  }, {
    key: 'moveSelectionUp',
    value: function moveSelectionUp() {
      var context = this._getCurrentResultContext();
      if (!context) {
        this.moveSelectionToBottom();
        return;
      }

      if (this.state.selectedItemIndex > 0) {
        // only decrease the index if remaining in current directory
        this.setSelectedIndex(this.state.selectedService, this.state.selectedDirectory, this.state.selectedItemIndex - 1);
      } else {
        // otherwise, go to the previous directory...
        if (context.currentDirectoryIndex > 0) {
          this.setSelectedIndex(this.state.selectedService, context.directoryNames[context.currentDirectoryIndex - 1], context.currentService[context.directoryNames[context.currentDirectoryIndex - 1]].items.length - 1);
        } else {
          // ...or the previous service...
          if (context.currentServiceIndex > 0) {
            var newServiceName = context.serviceNames[context.currentServiceIndex - 1];
            var newDirectoryName = Object.keys(context.nonEmptyResults[newServiceName]).pop();
            this.setSelectedIndex(newServiceName, newDirectoryName, context.nonEmptyResults[newServiceName][newDirectoryName].items.length - 1);
          } else {
            // ...or wrap around to the very bottom
            this.moveSelectionToBottom();
          }
        }
      }
    }

    // Update the scroll position of the list view to ensure the selected item is visible.
  }, {
    key: '_updateScrollPosition',
    value: function _updateScrollPosition() {
      if (!(this.refs && this.refs.selectionList)) {
        return;
      }
      var listNode = React.findDOMNode(this.refs.selectionList);
      var selectedNode = listNode.getElementsByClassName('selected')[0];
      // false is passed for @centerIfNeeded parameter, which defaults to true.
      // Passing false causes the minimum necessary scroll to occur, so the selection sticks to the top/bottom
      if (selectedNode) {
        selectedNode.scrollIntoViewIfNeeded(false);
      }
    }
  }, {
    key: 'moveSelectionToBottom',
    value: function moveSelectionToBottom() {
      var bottom = this._getOuterResults(Array.prototype.pop);
      if (!bottom) {
        return;
      }
      this.setSelectedIndex(bottom.serviceName, bottom.directoryName, bottom.results.length - 1);
    }
  }, {
    key: 'moveSelectionToTop',
    value: function moveSelectionToTop() {
      var top = this._getOuterResults(Array.prototype.shift);
      if (!top) {
        return;
      }
      this.setSelectedIndex(top.serviceName, top.directoryName, 0);
    }
  }, {
    key: '_getOuterResults',
    value: function _getOuterResults(arrayOperation) {
      var nonEmptyResults = filterEmptyResults(this.state.resultsByService);
      var serviceName = arrayOperation.call(Object.keys(nonEmptyResults));
      if (!serviceName) {
        return null;
      }
      var service = nonEmptyResults[serviceName];
      var directoryName = arrayOperation.call(Object.keys(service));
      return {
        serviceName: serviceName,
        directoryName: directoryName,
        results: nonEmptyResults[serviceName][directoryName].items
      };
    }
  }, {
    key: 'getSelectedItem',
    value: function getSelectedItem() {
      return this.getItemAtIndex(this.state.selectedService, this.state.selectedDirectory, this.state.selectedItemIndex);
    }
  }, {
    key: 'getItemAtIndex',
    value: function getItemAtIndex(serviceName, directory, itemIndex) {
      if (itemIndex === -1 || !this.state.resultsByService[serviceName] || !this.state.resultsByService[serviceName][directory] || !this.state.resultsByService[serviceName][directory].items[itemIndex]) {
        return null;
      }
      return this.state.resultsByService[serviceName][directory].items[itemIndex];
    }
  }, {
    key: 'componentForItem',
    value: function componentForItem(item, serviceName) {
      return this.getProvider().getComponentForItem(item, serviceName);
    }
  }, {
    key: 'getSelectedIndex',
    value: function getSelectedIndex() {
      return {
        selectedDirectory: this.state.selectedDirectory,
        selectedService: this.state.selectedService,
        selectedItemIndex: this.state.selectedItemIndex
      };
    }
  }, {
    key: 'setSelectedIndex',
    value: function setSelectedIndex(service, directory, itemIndex) {
      var _this5 = this;

      this.setState({
        selectedService: service,
        selectedDirectory: directory,
        selectedItemIndex: itemIndex
      }, function () {
        return _this5._emitter.emit('selection-changed', _this5.getSelectedIndex());
      });
    }
  }, {
    key: '_setResult',
    value: function _setResult(serviceName, dirName, results) {
      var _this6 = this;

      var updatedResultsByDirectory = _extends({}, this.state.resultsByService[serviceName]);
      updatedResultsByDirectory[dirName] = results;

      var updatedResultsByService = _extends({}, this.state.resultsByService);
      updatedResultsByService[serviceName] = updatedResultsByDirectory;

      this.setState({
        resultsByService: updatedResultsByService
      }, function () {
        _this6._emitter.emit('items-changed', updatedResultsByService);
      });
    }
  }, {
    key: '_subscribeToResult',
    value: function _subscribeToResult(serviceName, directory, resultPromise) {
      var _this7 = this;

      resultPromise.then(function (items) {
        var updatedItems = {
          waiting: false,
          error: null,
          items: items.results
        };
        _this7._setResult(serviceName, directory, updatedItems);
      })['catch'](function (error) {
        var updatedItems = {
          waiting: false,
          error: 'an error occurred: ' + error,
          items: []
        };
        _this7._setResult(serviceName, directory, updatedItems);
      });
    }
  }, {
    key: 'setQuery',
    value: function setQuery(query) {
      var _this8 = this;

      var provider = this.getProvider();
      if (!provider) {
        return;
      }

      var newItems = provider.executeQuery(sanitizeQuery(query));
      newItems.then(function (requestsByDirectory) {
        var groupedByService = {};
        for (var dirName in requestsByDirectory) {
          var servicesForDirectory = requestsByDirectory[dirName];
          for (var serviceName in servicesForDirectory) {
            var promise = servicesForDirectory[serviceName];
            _this8._subscribeToResult(serviceName, dirName, promise);
            if (groupedByService[serviceName] === undefined) {
              groupedByService[serviceName] = {};
            }
            groupedByService[serviceName][dirName] = {
              items: [],
              waiting: true,
              error: null
            };
          }
        }
        _this8.setState({ resultsByService: groupedByService });
      });
    }
  }, {
    key: 'getProvider',
    value: function getProvider() {
      return this.props.provider;
    }

    // TODO: We need a type that corresponds to <atom-text-editor> that is more specific than
    // HTMLElement, which would eliminate a number of Flow type errors in this file.
  }, {
    key: 'getInputTextEditor',
    value: function getInputTextEditor() {
      return React.findDOMNode(this.refs['queryInput']);
    }
  }, {
    key: 'clear',
    value: function clear() {
      this.getInputTextEditor().model.setText('');
      this.clearSelection();
    }
  }, {
    key: 'focus',
    value: function focus() {
      this.getInputTextEditor().focus();
    }
  }, {
    key: 'blur',
    value: function blur() {
      this.getInputTextEditor().blur();
    }
  }, {
    key: 'setInputValue',
    value: function setInputValue(value) {
      this._getTextEditor().setText(value);
    }
  }, {
    key: 'selectInput',
    value: function selectInput() {
      this._getTextEditor().selectAll();
    }
  }, {
    key: '_getTextEditor',
    value: function _getTextEditor() {
      return this.refs['queryInput'].getTextEditor();
    }

    /**
     * @param newTab is actually a TabInfo plus the `name` and `tabContent` properties added by
     *     _renderTabs(), which created the tab object in the first place.
     */
  }, {
    key: '_handleTabChange',
    value: function _handleTabChange(newTab) {
      var _this9 = this;

      clearTimeout(this._scheduledCancel);
      var providerName = newTab.providerName;
      if (providerName !== this.state.activeTab) {
        this.setState({
          activeTab: providerName
        }, function () {
          _this9._emitter.emit('active-provider-changed', newTab.providerName);
        });
      }
    }
  }, {
    key: '_renderTabs',
    value: function _renderTabs() {
      var _this10 = this;

      var tabs = this.props.tabs.map(function (tab) {
        var keyBinding = null;
        if (tab.action) {
          keyBinding = React.createElement(
            'kbd',
            { className: 'key-binding' },
            _findKeybindingForAction(tab.action, _this10._modalNode)
          );
        }
        return _extends({}, tab, {
          name: tab.providerName,
          tabContent: React.createElement(
            'span',
            null,
            tab.title,
            keyBinding
          )
        });
      });
      return React.createElement(
        'div',
        { className: 'omnisearch-tabs' },
        React.createElement(NuclideTabs, {
          tabs: tabs,
          activeTabName: this.state.activeTab,
          onActiveTabChange: this._boundHandleTabChange,
          triggeringEvent: 'onMouseEnter'
        })
      );
    }
  }, {
    key: '_renderEmptyMessage',
    value: function _renderEmptyMessage(message) {
      return React.createElement(
        'ul',
        { className: 'background-message centered' },
        React.createElement(
          'li',
          null,
          message
        )
      );
    }
  }, {
    key: '_hasNoResults',
    value: function _hasNoResults() {
      for (var serviceName in this.state.resultsByService) {
        var service = this.state.resultsByService[serviceName];
        for (var dirName in service) {
          var results = service[dirName];
          if (!results.waiting && results.items.length > 0) {
            return false;
          }
        }
      }
      return true;
    }
  }, {
    key: 'render',
    value: function render() {
      var _this11 = this;

      var itemsRendered = 0;
      var serviceNames = Object.keys(this.state.resultsByService);
      var services = serviceNames.map(function (serviceName) {
        var directories = _this11.state.resultsByService[serviceName];
        var directoryNames = Object.keys(directories);
        var directoriesForService = directoryNames.map(function (dirName) {
          var resultsForDirectory = directories[dirName];
          var message = null;
          if (resultsForDirectory.waiting) {
            itemsRendered++;
            message = React.createElement(
              'span',
              null,
              React.createElement('span', { className: 'loading loading-spinner-tiny inline-block' }),
              'Loading...'
            );
          } else if (resultsForDirectory.error) {
            message = React.createElement(
              'span',
              null,
              React.createElement('span', { className: 'icon icon-circle-slash' }),
              'Error: ',
              React.createElement(
                'pre',
                null,
                resultsForDirectory.error
              )
            );
          } else if (resultsForDirectory.items.length === 0) {
            message = React.createElement(
              'span',
              null,
              React.createElement('span', { className: 'icon icon-x' }),
              'No results'
            );
          }
          var itemComponents = resultsForDirectory.items.map(function (item, itemIndex) {
            var isSelected = serviceName === _this11.state.selectedService && dirName === _this11.state.selectedDirectory && itemIndex === _this11.state.selectedItemIndex;
            itemsRendered++;
            return React.createElement(
              'li',
              {
                className: cx({
                  'quick-open-result-item': true,
                  'list-item': true,
                  selected: isSelected
                }),
                key: serviceName + dirName + itemIndex,
                onMouseDown: _this11._boundSelect,
                onMouseEnter: _this11.setSelectedIndex.bind(_this11, serviceName, dirName, itemIndex) },
              _this11.componentForItem(item, serviceName)
            );
          });
          //hide folders if only 1 level would be shown
          var showDirectories = directoryNames.length > 1;
          var directoryLabel = showDirectories ? React.createElement(
            'div',
            { className: 'list-item' },
            React.createElement(
              'span',
              { className: 'icon icon-file-directory' },
              dirName
            )
          ) : null;
          return React.createElement(
            'li',
            { className: cx({ 'list-nested-item': showDirectories }), key: dirName },
            directoryLabel,
            message,
            React.createElement(
              'ul',
              { className: 'list-tree' },
              itemComponents
            )
          );
        });
        return React.createElement(
          'li',
          { className: 'list-nested-item', key: serviceName },
          React.createElement(
            'div',
            { className: 'list-item' },
            React.createElement(
              'span',
              { className: 'icon icon-gear' },
              serviceName
            )
          ),
          React.createElement(
            'ul',
            { className: 'list-tree', ref: 'selectionList' },
            directoriesForService
          )
        );
      });
      var noResultsMessage = null;
      if (object.isEmpty(this.state.resultsByService)) {
        noResultsMessage = this._renderEmptyMessage('Search away!');
      } else if (itemsRendered === 0) {
        noResultsMessage = this._renderEmptyMessage(React.createElement(
          'span',
          null,
          '¯\\_(ツ)_/¯',
          React.createElement('br', null),
          'No results'
        ));
      }
      var currentProvider = this.getProvider();
      var promptText = currentProvider && currentProvider.getPromptText() || '';
      return React.createElement(
        'div',
        { className: 'select-list omnisearch-modal', ref: 'modal' },
        React.createElement(AtomInput, { ref: 'queryInput', placeholderText: promptText }),
        this._renderTabs(),
        React.createElement(
          'div',
          { className: 'omnisearch-results' },
          noResultsMessage,
          React.createElement(
            'div',
            { className: 'omnisearch-pane' },
            React.createElement(
              'ul',
              { className: 'list-tree' },
              services
            )
          )
        )
      );
    }
  }]);

  return QuickSelectionComponent;
})(React.Component);

var TabInfoPropType = PropTypes.shape({
  providerName: React.PropTypes.string,
  path: React.PropTypes.string,
  score: React.PropTypes.number
});

QuickSelectionComponent.propTypes = {
  provider: PropTypes.instanceOf(QuickSelectionProvider).isRequired,
  tabs: PropTypes.arrayOf(TabInfoPropType).isRequired,
  initialActiveTab: PropTypes.shape(TabInfoPropType).isRequired
};

module.exports = QuickSelectionComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1F1aWNrU2VsZWN0aW9uQ29tcG9uZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLFdBQVcsQ0FBQzs7QUFtQlosSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLHVCQUF1QixDQUFDLENBQUM7O2VBQ0EsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBM0QsbUJBQW1CLFlBQW5CLG1CQUFtQjtJQUFFLFVBQVUsWUFBVixVQUFVO0lBQUUsT0FBTyxZQUFQLE9BQU87O0FBQzdDLElBQUksc0JBQXNCLEdBQUcsT0FBTyxDQUFDLDBCQUEwQixDQUFDLENBQUM7O2dCQUs3RCxPQUFPLENBQUMsaUJBQWlCLENBQUM7O0lBSDVCLEtBQUssYUFBTCxLQUFLO0lBQ0wsUUFBUSxhQUFSLFFBQVE7SUFDUixNQUFNLGFBQU4sTUFBTTs7QUFFUixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN0QyxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQzs7Z0JBS3pDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQzs7SUFGbEMsa0JBQWtCLGFBQWxCLGtCQUFrQjtJQUNsQixjQUFjLGFBQWQsY0FBYztJQUdYLFNBQVMsR0FBSSxLQUFLLENBQWxCLFNBQVM7O0FBRWQsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7O0FBRW5DLFNBQVMsYUFBYSxDQUFDLEtBQWEsRUFBVTtBQUM1QyxTQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztDQUNyQjs7Ozs7O0FBTUQsU0FBUyx3QkFBd0IsQ0FBQyxNQUFjLEVBQUUsTUFBbUIsRUFBVTtrQkFDbkQsT0FBTyxDQUFDLHlCQUF5QixDQUFD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LHVCQUF1QixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL1F1aWNrU2VsZWN0aW9uQ29tcG9uZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUge1xuICBEaXJlY3RvcnlOYW1lLFxuICBGaWxlUmVzdWx0LFxuICBHcm91cGVkUmVzdWx0LFxuICBTZXJ2aWNlTmFtZSxcbiAgVGFiSW5mbyxcbn0gZnJvbSAnLi90eXBlcyc7XG5cbnZhciBBdG9tSW5wdXQgPSByZXF1aXJlKCdudWNsaWRlLXVpLWF0b20taW5wdXQnKTtcbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgRW1pdHRlcn0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgUXVpY2tTZWxlY3Rpb25Qcm92aWRlciA9IHJlcXVpcmUoJy4vUXVpY2tTZWxlY3Rpb25Qcm92aWRlcicpO1xudmFyIHtcbiAgYXJyYXksXG4gIGRlYm91bmNlLFxuICBvYmplY3QsXG59ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xudmFyIE51Y2xpZGVUYWJzID0gcmVxdWlyZSgnbnVjbGlkZS11aS10YWJzJyk7XG5cbnZhciB7XG4gIGZpbHRlckVtcHR5UmVzdWx0cyxcbiAgZmxhdHRlblJlc3VsdHMsXG59ID0gcmVxdWlyZSgnLi9zZWFyY2hSZXN1bHRIZWxwZXJzJyk7XG5cbnZhciB7UHJvcFR5cGVzfSA9IFJlYWN0O1xuXG52YXIgY3ggPSByZXF1aXJlKCdyZWFjdC1jbGFzc3NldCcpO1xuXG5mdW5jdGlvbiBzYW5pdGl6ZVF1ZXJ5KHF1ZXJ5OiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcXVlcnkudHJpbSgpO1xufVxuXG4vKipcbiAqIERldGVybWluZSB3aGF0IHRoZSBhcHBsaWNhYmxlIHNob3J0Y3V0IGZvciBhIGdpdmVuIGFjdGlvbiBpcyB3aXRoaW4gdGhpcyBjb21wb25lbnQncyBjb250ZXh0LlxuICogRm9yIGV4YW1wbGUsIHRoaXMgd2lsbCByZXR1cm4gZGlmZmVyZW50IGtleWJpbmRpbmdzIG9uIHdpbmRvd3MgdnMgbGludXguXG4gKi9cbmZ1bmN0aW9uIF9maW5kS2V5YmluZGluZ0ZvckFjdGlvbihhY3Rpb246IHN0cmluZywgdGFyZ2V0OiBIVE1MRWxlbWVudCk6IHN0cmluZyB7XG4gIHZhciB7aHVtYW5pemVLZXlzdHJva2V9ID0gcmVxdWlyZSgnbnVjbGlkZS1rZXlzdHJva2UtbGFiZWwnKTtcbiAgdmFyIG1hdGNoaW5nS2V5QmluZGluZ3MgPSBhdG9tLmtleW1hcHMuZmluZEtleUJpbmRpbmdzKHtcbiAgICBjb21tYW5kOiBhY3Rpb24sXG4gICAgdGFyZ2V0LFxuICB9KTtcbiAgdmFyIGtleXN0cm9rZSA9IChtYXRjaGluZ0tleUJpbmRpbmdzLmxlbmd0aCAmJiBtYXRjaGluZ0tleUJpbmRpbmdzWzBdLmtleXN0cm9rZXMpIHx8ICcnO1xuICByZXR1cm4gaHVtYW5pemVLZXlzdHJva2Uoa2V5c3Ryb2tlKTtcbn1cblxuXG50eXBlIFJlc3VsdHNCeVNlcnZpY2UgPSB7XG4gIFtrZXk6IFNlcnZpY2VOYW1lXToge1xuICAgIFtrZXk6IERpcmVjdG9yeU5hbWVdOiB7XG4gICAgICBpdGVtczogQXJyYXk8RmlsZVJlc3VsdD4sXG4gICAgICB3YWl0aW5nOiBib29sZWFuLFxuICAgICAgZXJyb3I6ID9zdHJpbmcsXG4gICAgfVxuICB9XG59O1xuXG5jbGFzcyBRdWlja1NlbGVjdGlvbkNvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIF9lbWl0dGVyOiBFbWl0dGVyO1xuICBfc3Vic2NyaXB0aW9uczogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgX3NjaGVkdWxlZENhbmNlbDogbnVtYmVyO1xuICBfbW9kYWxOb2RlOiBIVE1MRWxlbWVudDtcbiAgX2RlYm91bmNlZFF1ZXJ5SGFuZGxlcjogKCkgPT4gdm9pZDtcbiAgX2JvdW5kU2VsZWN0OiAoKSA9PiB2b2lkO1xuICBfYm91bmRIYW5kbGVUYWJDaGFuZ2U6ICh0YWI6IFRhYkluZm8pID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IE9iamVjdCkge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICB0aGlzLl9lbWl0dGVyID0gbmV3IEVtaXR0ZXIoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB0aGlzLl9ib3VuZFNlbGVjdCA9ICgpID0+IHRoaXMuc2VsZWN0KCk7XG4gICAgdGhpcy5fYm91bmRIYW5kbGVUYWJDaGFuZ2UgPSAodGFiOiBUYWJJbmZvKSA9PiB0aGlzLl9oYW5kbGVUYWJDaGFuZ2UodGFiKTtcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBhY3RpdmVUYWI6IHByb3BzLmluaXRpYWxBY3RpdmVUYWIsXG4gICAgICAvLyB0cmVhdGVkIGFzIGltbXV0YWJsZVxuICAgICAgcmVzdWx0c0J5U2VydmljZToge1xuICAgICAgICAvKiBFWEFNUExFOlxuICAgICAgICBwcm92aWRlck5hbWU6IHtcbiAgICAgICAgICBkaXJlY3RvcnlOYW1lOiB7XG4gICAgICAgICAgICBpdGVtczogW0FycmF5PEZpbGVSZXN1bHQ+XSxcbiAgICAgICAgICAgIHdhaXRpbmc6IHRydWUsXG4gICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICAqL1xuICAgICAgfSxcbiAgICAgIHNlbGVjdGVkRGlyZWN0b3J5OiAnJyxcbiAgICAgIHNlbGVjdGVkU2VydmljZTogJycsXG4gICAgICBzZWxlY3RlZEl0ZW1JbmRleDogLTEsXG4gICAgfTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMobmV4dFByb3BzOiBhbnkpIHtcbiAgICBpZiAobmV4dFByb3BzLnByb3ZpZGVyICE9PSB0aGlzLnByb3BzLnByb3ZpZGVyKSB7XG4gICAgICBpZiAobmV4dFByb3BzLnByb3ZpZGVyKSB7XG4gICAgICAgIHRoaXMuX2dldFRleHRFZGl0b3IoKS5zZXRQbGFjZWhvbGRlclRleHQobmV4dFByb3BzLnByb3ZpZGVyLmdldFByb21wdFRleHQoKSk7XG4gICAgICAgIHZhciBuZXdSZXN1bHRzID0ge307XG4gICAgICAgIHRoaXMuc2V0U3RhdGUoXG4gICAgICAgICAge1xuICAgICAgICAgICAgYWN0aXZlVGFiOiBuZXh0UHJvcHMucHJvdmlkZXIuY29uc3RydWN0b3IubmFtZSB8fCB0aGlzLnN0YXRlLmFjdGl2ZVRhYixcbiAgICAgICAgICAgIHJlc3VsdHNCeVNlcnZpY2U6IG5ld1Jlc3VsdHMsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldFF1ZXJ5KHRoaXMucmVmc1sncXVlcnlJbnB1dCddLmdldFRleHQoKSk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVRdWVyeUhhbmRsZXIoKTtcbiAgICAgICAgICAgIHRoaXMuX2VtaXR0ZXIuZW1pdCgnaXRlbXMtY2hhbmdlZCcsIG5ld1Jlc3VsdHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb21wb25lbnREaWRVcGRhdGUocHJldlByb3BzOiBhbnksIHByZXZTdGF0ZTogYW55KSB7XG4gICAgaWYgKHByZXZTdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlICE9PSB0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2UpIHtcbiAgICAgIHRoaXMuX2VtaXR0ZXIuZW1pdCgnaXRlbXMtY2hhbmdlZCcsIHRoaXMuc3RhdGUucmVzdWx0c0J5U2VydmljZSk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgcHJldlN0YXRlLnNlbGVjdGVkSXRlbUluZGV4ICE9PSB0aGlzLnN0YXRlLnNlbGVjdGVkSXRlbUluZGV4IHx8XG4gICAgICBwcmV2U3RhdGUuc2VsZWN0ZWRTZXJ2aWNlICE9PSB0aGlzLnN0YXRlLnNlbGVjdGVkU2VydmljZSB8fFxuICAgICAgcHJldlN0YXRlLnNlbGVjdGVkRGlyZWN0b3J5ICE9PSB0aGlzLnN0YXRlLnNlbGVjdGVkRGlyZWN0b3J5XG4gICAgKSB7XG4gICAgICB0aGlzLl91cGRhdGVTY3JvbGxQb3NpdGlvbigpO1xuICAgIH1cbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMuX21vZGFsTm9kZSA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKFxuICAgICAgYXRvbS5jb21tYW5kcy5hZGQodGhpcy5fbW9kYWxOb2RlLCAnY29yZTptb3ZlLXVwJywgdGhpcy5tb3ZlU2VsZWN0aW9uVXAuYmluZCh0aGlzKSksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl9tb2RhbE5vZGUsICdjb3JlOm1vdmUtZG93bicsIHRoaXMubW92ZVNlbGVjdGlvbkRvd24uYmluZCh0aGlzKSksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl9tb2RhbE5vZGUsICdjb3JlOm1vdmUtdG8tdG9wJywgdGhpcy5tb3ZlU2VsZWN0aW9uVG9Ub3AuYmluZCh0aGlzKSksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl9tb2RhbE5vZGUsICdjb3JlOm1vdmUtdG8tYm90dG9tJywgdGhpcy5tb3ZlU2VsZWN0aW9uVG9Cb3R0b20uYmluZCh0aGlzKSksXG4gICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzLl9tb2RhbE5vZGUsICdjb3JlOmNvbmZpcm0nLCB0aGlzLnNlbGVjdC5iaW5kKHRoaXMpKSxcbiAgICAgIGF0b20uY29tbWFuZHMuYWRkKHRoaXMuX21vZGFsTm9kZSwgJ2NvcmU6Y2FuY2VsJywgdGhpcy5jYW5jZWwuYmluZCh0aGlzKSlcbiAgICApO1xuXG4gICAgdmFyIGlucHV0VGV4dEVkaXRvciA9IHRoaXMuZ2V0SW5wdXRUZXh0RWRpdG9yKCk7XG4gICAgaW5wdXRUZXh0RWRpdG9yLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5yZWxhdGVkVGFyZ2V0ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIGNhbmNlbCBjYW4gYmUgaW50ZXJydXB0ZWQgYnkgdXNlciBpbnRlcmFjdGlvbiB3aXRoIHRoZSBtb2RhbFxuICAgICAgICB0aGlzLl9zY2hlZHVsZWRDYW5jZWwgPSBzZXRUaW1lb3V0KHRoaXMuY2FuY2VsLmJpbmQodGhpcyksIDEwMCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLl91cGRhdGVRdWVyeUhhbmRsZXIoKTtcbiAgICBpbnB1dFRleHRFZGl0b3IubW9kZWwub25EaWRDaGFuZ2UoKCkgPT4gdGhpcy5faGFuZGxlVGV4dElucHV0Q2hhbmdlKCkpO1xuICAgIHRoaXMuY2xlYXIoKTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIHRoaXMuX2VtaXR0ZXIuZGlzcG9zZSgpO1xuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICB9XG5cbiAgb25DYW5jZWxsYXRpb24oY2FsbGJhY2s6ICgpID0+IHZvaWQpOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5fZW1pdHRlci5vbignY2FuY2VsZWQnLCBjYWxsYmFjayk7XG4gIH1cblxuICBvblNlbGVjdGlvbihjYWxsYmFjazogKHNlbGVjdGlvbjogYW55KSA9PiB2b2lkKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuX2VtaXR0ZXIub24oJ3NlbGVjdGVkJywgY2FsbGJhY2spO1xuICB9XG5cbiAgb25TZWxlY3Rpb25DaGFuZ2VkKGNhbGxiYWNrOiAoc2VsZWN0aW9uSW5kZXg6IGFueSkgPT4gdm9pZCk6IERpc3Bvc2FibGUge1xuICAgIHJldHVybiB0aGlzLl9lbWl0dGVyLm9uKCdzZWxlY3Rpb24tY2hhbmdlZCcsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIG9uSXRlbXNDaGFuZ2VkKGNhbGxiYWNrOiAobmV3SXRlbXM6IEdyb3VwZWRSZXN1bHQpID0+IHZvaWQpOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5fZW1pdHRlci5vbignaXRlbXMtY2hhbmdlZCcsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIG9uVGFiQ2hhbmdlKGNhbGxiYWNrOiAocHJvdmlkZXJOYW1lOiBzdHJpbmcpID0+IHZvaWQpOiBEaXNwb3NhYmxlIHtcbiAgICByZXR1cm4gdGhpcy5fZW1pdHRlci5vbignYWN0aXZlLXByb3ZpZGVyLWNoYW5nZWQnLCBjYWxsYmFjayk7XG4gIH1cblxuICBfdXBkYXRlUXVlcnlIYW5kbGVyKCk6IHZvaWQge1xuICAgIHRoaXMuX2RlYm91bmNlZFF1ZXJ5SGFuZGxlciA9IGRlYm91bmNlKFxuICAgICAgKCkgPT4gdGhpcy5zZXRRdWVyeSh0aGlzLmdldElucHV0VGV4dEVkaXRvcigpLm1vZGVsLmdldFRleHQoKSksXG4gICAgICB0aGlzLmdldFByb3ZpZGVyKCkuZ2V0RGVib3VuY2VEZWxheSgpXG4gICAgKTtcbiAgfVxuXG4gIF9oYW5kbGVUZXh0SW5wdXRDaGFuZ2UoKTogdm9pZCB7XG4gICAgdGhpcy5fZGVib3VuY2VkUXVlcnlIYW5kbGVyKCk7XG4gIH1cblxuICBzZWxlY3QoKSB7XG4gICAgdmFyIHNlbGVjdGVkSXRlbSA9IHRoaXMuZ2V0U2VsZWN0ZWRJdGVtKCk7XG4gICAgaWYgKCFzZWxlY3RlZEl0ZW0pIHtcbiAgICAgIHRoaXMuY2FuY2VsKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2VtaXR0ZXIuZW1pdCgnc2VsZWN0ZWQnLCBzZWxlY3RlZEl0ZW0pO1xuICAgIH1cbiAgfVxuXG4gIGNhbmNlbCgpIHtcbiAgICB0aGlzLl9lbWl0dGVyLmVtaXQoJ2NhbmNlbGVkJyk7XG4gIH1cblxuICBjbGVhclNlbGVjdGlvbigpIHtcbiAgICB0aGlzLnNldFNlbGVjdGVkSW5kZXgoJycsICcnLCAtMSk7XG4gIH1cblxuICBfZ2V0Q3VycmVudFJlc3VsdENvbnRleHQoKTogbWl4ZWQge1xuICAgIHZhciBub25FbXB0eVJlc3VsdHMgPSBmaWx0ZXJFbXB0eVJlc3VsdHModGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlKTtcbiAgICB2YXIgc2VydmljZU5hbWVzID0gT2JqZWN0LmtleXMobm9uRW1wdHlSZXN1bHRzKTtcbiAgICB2YXIgY3VycmVudFNlcnZpY2VJbmRleCA9IHNlcnZpY2VOYW1lcy5pbmRleE9mKHRoaXMuc3RhdGUuc2VsZWN0ZWRTZXJ2aWNlKTtcbiAgICB2YXIgY3VycmVudFNlcnZpY2UgPSBub25FbXB0eVJlc3VsdHNbdGhpcy5zdGF0ZS5zZWxlY3RlZFNlcnZpY2VdO1xuXG4gICAgaWYgKCFjdXJyZW50U2VydmljZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGRpcmVjdG9yeU5hbWVzID0gT2JqZWN0LmtleXMoY3VycmVudFNlcnZpY2UpO1xuICAgIHZhciBjdXJyZW50RGlyZWN0b3J5SW5kZXggPSBkaXJlY3RvcnlOYW1lcy5pbmRleE9mKHRoaXMuc3RhdGUuc2VsZWN0ZWREaXJlY3RvcnkpO1xuICAgIHZhciBjdXJyZW50RGlyZWN0b3J5ID0gY3VycmVudFNlcnZpY2VbdGhpcy5zdGF0ZS5zZWxlY3RlZERpcmVjdG9yeV07XG5cbiAgICBpZiAoIWN1cnJlbnREaXJlY3RvcnkgfHwgIWN1cnJlbnREaXJlY3RvcnkuaXRlbXMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBub25FbXB0eVJlc3VsdHMsXG4gICAgICBzZXJ2aWNlTmFtZXMsXG4gICAgICBjdXJyZW50U2VydmljZUluZGV4LFxuICAgICAgY3VycmVudFNlcnZpY2UsXG4gICAgICBkaXJlY3RvcnlOYW1lcyxcbiAgICAgIGN1cnJlbnREaXJlY3RvcnlJbmRleCxcbiAgICAgIGN1cnJlbnREaXJlY3RvcnksXG4gICAgfTtcbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Eb3duKCkge1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5fZ2V0Q3VycmVudFJlc3VsdENvbnRleHQoKTtcbiAgICBpZiAoIWNvbnRleHQpIHtcbiAgICAgIHRoaXMubW92ZVNlbGVjdGlvblRvVG9wKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RhdGUuc2VsZWN0ZWRJdGVtSW5kZXggPCBjb250ZXh0LmN1cnJlbnREaXJlY3RvcnkuaXRlbXMubGVuZ3RoIC0gMSkge1xuICAgICAgLy8gb25seSBidW1wIHRoZSBpbmRleCBpZiByZW1haW5pbmcgaW4gY3VycmVudCBkaXJlY3RvcnlcbiAgICAgIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChcbiAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZFNlcnZpY2UsXG4gICAgICAgIHRoaXMuc3RhdGUuc2VsZWN0ZWREaXJlY3RvcnksXG4gICAgICAgIHRoaXMuc3RhdGUuc2VsZWN0ZWRJdGVtSW5kZXggKyAxXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBvdGhlcndpc2UgZ28gdG8gbmV4dCBkaXJlY3RvcnkuLi5cbiAgICAgIGlmIChjb250ZXh0LmN1cnJlbnREaXJlY3RvcnlJbmRleCA8IGNvbnRleHQuZGlyZWN0b3J5TmFtZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICB0aGlzLnNldFNlbGVjdGVkSW5kZXgoXG4gICAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZFNlcnZpY2UsXG4gICAgICAgICAgY29udGV4dC5kaXJlY3RvcnlOYW1lc1tjb250ZXh0LmN1cnJlbnREaXJlY3RvcnlJbmRleCArIDFdLFxuICAgICAgICAgIDBcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIC4uLm9yIHRoZSBuZXh0IHNlcnZpY2UuLi5cbiAgICAgICAgaWYgKGNvbnRleHQuY3VycmVudFNlcnZpY2VJbmRleCA8IGNvbnRleHQuc2VydmljZU5hbWVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICB2YXIgbmV3U2VydmljZU5hbWUgPSBjb250ZXh0LnNlcnZpY2VOYW1lc1tjb250ZXh0LmN1cnJlbnRTZXJ2aWNlSW5kZXggKyAxXTtcbiAgICAgICAgICB2YXIgbmV3RGlyZWN0b3J5TmFtZSA9IE9iamVjdC5rZXlzKGNvbnRleHQubm9uRW1wdHlSZXN1bHRzW25ld1NlcnZpY2VOYW1lXSkuc2hpZnQoKTtcbiAgICAgICAgICB0aGlzLnNldFNlbGVjdGVkSW5kZXgobmV3U2VydmljZU5hbWUsIG5ld0RpcmVjdG9yeU5hbWUsIDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIC4uLm9yIHdyYXAgYXJvdW5kIHRvIHRoZSB2ZXJ5IHRvcFxuICAgICAgICAgIHRoaXMubW92ZVNlbGVjdGlvblRvVG9wKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBtb3ZlU2VsZWN0aW9uVXAoKSB7XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLl9nZXRDdXJyZW50UmVzdWx0Q29udGV4dCgpO1xuICAgIGlmICghY29udGV4dCkge1xuICAgICAgdGhpcy5tb3ZlU2VsZWN0aW9uVG9Cb3R0b20oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1JbmRleCA+IDApIHtcbiAgICAgIC8vIG9ubHkgZGVjcmVhc2UgdGhlIGluZGV4IGlmIHJlbWFpbmluZyBpbiBjdXJyZW50IGRpcmVjdG9yeVxuICAgICAgdGhpcy5zZXRTZWxlY3RlZEluZGV4KFxuICAgICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkU2VydmljZSxcbiAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZERpcmVjdG9yeSxcbiAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZEl0ZW1JbmRleCAtIDFcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIG90aGVyd2lzZSwgZ28gdG8gdGhlIHByZXZpb3VzIGRpcmVjdG9yeS4uLlxuICAgICAgaWYgKGNvbnRleHQuY3VycmVudERpcmVjdG9yeUluZGV4ID4gMCkge1xuICAgICAgICB0aGlzLnNldFNlbGVjdGVkSW5kZXgoXG4gICAgICAgICAgdGhpcy5zdGF0ZS5zZWxlY3RlZFNlcnZpY2UsXG4gICAgICAgICAgY29udGV4dC5kaXJlY3RvcnlOYW1lc1tjb250ZXh0LmN1cnJlbnREaXJlY3RvcnlJbmRleCAtIDFdLFxuICAgICAgICAgIGNvbnRleHQuY3VycmVudFNlcnZpY2VbY29udGV4dC5kaXJlY3RvcnlOYW1lc1tjb250ZXh0LmN1cnJlbnREaXJlY3RvcnlJbmRleCAtIDFdXS5pdGVtcy5sZW5ndGggLSAxXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyAuLi5vciB0aGUgcHJldmlvdXMgc2VydmljZS4uLlxuICAgICAgICBpZiAoY29udGV4dC5jdXJyZW50U2VydmljZUluZGV4ID4gMCkge1xuICAgICAgICAgIHZhciBuZXdTZXJ2aWNlTmFtZSA9IGNvbnRleHQuc2VydmljZU5hbWVzW2NvbnRleHQuY3VycmVudFNlcnZpY2VJbmRleCAtIDFdO1xuICAgICAgICAgIHZhciBuZXdEaXJlY3RvcnlOYW1lID0gT2JqZWN0LmtleXMoY29udGV4dC5ub25FbXB0eVJlc3VsdHNbbmV3U2VydmljZU5hbWVdKS5wb3AoKTtcbiAgICAgICAgICB0aGlzLnNldFNlbGVjdGVkSW5kZXgoXG4gICAgICAgICAgICBuZXdTZXJ2aWNlTmFtZSxcbiAgICAgICAgICAgIG5ld0RpcmVjdG9yeU5hbWUsXG4gICAgICAgICAgICBjb250ZXh0Lm5vbkVtcHR5UmVzdWx0c1tuZXdTZXJ2aWNlTmFtZV1bbmV3RGlyZWN0b3J5TmFtZV0uaXRlbXMubGVuZ3RoIC0gMVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gLi4ub3Igd3JhcCBhcm91bmQgdG8gdGhlIHZlcnkgYm90dG9tXG4gICAgICAgICAgdGhpcy5tb3ZlU2VsZWN0aW9uVG9Cb3R0b20oKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFVwZGF0ZSB0aGUgc2Nyb2xsIHBvc2l0aW9uIG9mIHRoZSBsaXN0IHZpZXcgdG8gZW5zdXJlIHRoZSBzZWxlY3RlZCBpdGVtIGlzIHZpc2libGUuXG4gIF91cGRhdGVTY3JvbGxQb3NpdGlvbigpIHtcbiAgICBpZiAoISh0aGlzLnJlZnMgJiYgdGhpcy5yZWZzLnNlbGVjdGlvbkxpc3QpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBsaXN0Tm9kZSA9ICBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuc2VsZWN0aW9uTGlzdCk7XG4gICAgdmFyIHNlbGVjdGVkTm9kZSA9IGxpc3ROb2RlLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3NlbGVjdGVkJylbMF07XG4gICAgLy8gZmFsc2UgaXMgcGFzc2VkIGZvciBAY2VudGVySWZOZWVkZWQgcGFyYW1ldGVyLCB3aGljaCBkZWZhdWx0cyB0byB0cnVlLlxuICAgIC8vIFBhc3NpbmcgZmFsc2UgY2F1c2VzIHRoZSBtaW5pbXVtIG5lY2Vzc2FyeSBzY3JvbGwgdG8gb2NjdXIsIHNvIHRoZSBzZWxlY3Rpb24gc3RpY2tzIHRvIHRoZSB0b3AvYm90dG9tXG4gICAgaWYgKHNlbGVjdGVkTm9kZSkge1xuICAgICAgc2VsZWN0ZWROb2RlLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Ub0JvdHRvbSgpOiB2b2lkIHtcbiAgICB2YXIgYm90dG9tID0gdGhpcy5fZ2V0T3V0ZXJSZXN1bHRzKEFycmF5LnByb3RvdHlwZS5wb3ApO1xuICAgIGlmICghYm90dG9tKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2V0U2VsZWN0ZWRJbmRleChib3R0b20uc2VydmljZU5hbWUsIGJvdHRvbS5kaXJlY3RvcnlOYW1lLCBib3R0b20ucmVzdWx0cy5sZW5ndGggLSAxKTtcbiAgfVxuXG4gIG1vdmVTZWxlY3Rpb25Ub1RvcCgpOiB2b2lkIHtcbiAgICB2YXIgdG9wID0gdGhpcy5fZ2V0T3V0ZXJSZXN1bHRzKEFycmF5LnByb3RvdHlwZS5zaGlmdCk7XG4gICAgaWYgKCF0b3ApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zZXRTZWxlY3RlZEluZGV4KHRvcC5zZXJ2aWNlTmFtZSwgdG9wLmRpcmVjdG9yeU5hbWUsIDApO1xuICB9XG5cbiAgX2dldE91dGVyUmVzdWx0cyhhcnJheU9wZXJhdGlvbjogRnVuY3Rpb24pOiA/e3NlcnZpY2VOYW1lOiBzdHJpbmc7IGRpcmVjdG9yeU5hbWU6IHN0cmluZzsgcmVzdWx0czogQXJyYXk8bWl4ZWQ+fSB7XG4gICAgdmFyIG5vbkVtcHR5UmVzdWx0cyA9IGZpbHRlckVtcHR5UmVzdWx0cyh0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2UpO1xuICAgIHZhciBzZXJ2aWNlTmFtZSA9IGFycmF5T3BlcmF0aW9uLmNhbGwoT2JqZWN0LmtleXMobm9uRW1wdHlSZXN1bHRzKSk7XG4gICAgaWYgKCFzZXJ2aWNlTmFtZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBzZXJ2aWNlID0gbm9uRW1wdHlSZXN1bHRzW3NlcnZpY2VOYW1lXTtcbiAgICB2YXIgZGlyZWN0b3J5TmFtZSA9IGFycmF5T3BlcmF0aW9uLmNhbGwoT2JqZWN0LmtleXMoc2VydmljZSkpO1xuICAgIHJldHVybiB7XG4gICAgICBzZXJ2aWNlTmFtZSxcbiAgICAgIGRpcmVjdG9yeU5hbWUsXG4gICAgICByZXN1bHRzOiBub25FbXB0eVJlc3VsdHNbc2VydmljZU5hbWVdW2RpcmVjdG9yeU5hbWVdLml0ZW1zLFxuICAgIH07XG4gIH1cblxuICBnZXRTZWxlY3RlZEl0ZW0oKTogP09iamVjdCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0SXRlbUF0SW5kZXgoXG4gICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkU2VydmljZSxcbiAgICAgIHRoaXMuc3RhdGUuc2VsZWN0ZWREaXJlY3RvcnksXG4gICAgICB0aGlzLnN0YXRlLnNlbGVjdGVkSXRlbUluZGV4XG4gICAgKTtcbiAgfVxuXG4gIGdldEl0ZW1BdEluZGV4KHNlcnZpY2VOYW1lOiBzdHJpbmcsIGRpcmVjdG9yeTogc3RyaW5nLCBpdGVtSW5kZXg6IG51bWJlcik6ID9PYmplY3Qge1xuICAgIGlmIChcbiAgICAgIGl0ZW1JbmRleCA9PT0gLTEgfHxcbiAgICAgICF0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2Vbc2VydmljZU5hbWVdIHx8XG4gICAgICAhdGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlW3NlcnZpY2VOYW1lXVtkaXJlY3RvcnldIHx8XG4gICAgICAhdGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlW3NlcnZpY2VOYW1lXVtkaXJlY3RvcnldLml0ZW1zW2l0ZW1JbmRleF1cbiAgICApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlW3NlcnZpY2VOYW1lXVtkaXJlY3RvcnldLml0ZW1zW2l0ZW1JbmRleF07XG4gIH1cblxuICBjb21wb25lbnRGb3JJdGVtKGl0ZW06IGFueSwgc2VydmljZU5hbWU6IHN0cmluZyk6IFJlYWN0RWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvdmlkZXIoKS5nZXRDb21wb25lbnRGb3JJdGVtKGl0ZW0sIHNlcnZpY2VOYW1lKTtcbiAgfVxuXG4gIGdldFNlbGVjdGVkSW5kZXgoKTogYW55IHtcbiAgICByZXR1cm4ge1xuICAgICAgc2VsZWN0ZWREaXJlY3Rvcnk6IHRoaXMuc3RhdGUuc2VsZWN0ZWREaXJlY3RvcnksXG4gICAgICBzZWxlY3RlZFNlcnZpY2U6IHRoaXMuc3RhdGUuc2VsZWN0ZWRTZXJ2aWNlLFxuICAgICAgc2VsZWN0ZWRJdGVtSW5kZXg6IHRoaXMuc3RhdGUuc2VsZWN0ZWRJdGVtSW5kZXgsXG4gICAgfTtcbiAgfVxuXG4gIHNldFNlbGVjdGVkSW5kZXgoc2VydmljZTogc3RyaW5nLCBkaXJlY3Rvcnk6IHN0cmluZywgaXRlbUluZGV4OiBudW1iZXIpIHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlbGVjdGVkU2VydmljZTogc2VydmljZSxcbiAgICAgIHNlbGVjdGVkRGlyZWN0b3J5OiBkaXJlY3RvcnksXG4gICAgICBzZWxlY3RlZEl0ZW1JbmRleDogaXRlbUluZGV4LFxuICAgIH0sICgpID0+IHRoaXMuX2VtaXR0ZXIuZW1pdCgnc2VsZWN0aW9uLWNoYW5nZWQnLCB0aGlzLmdldFNlbGVjdGVkSW5kZXgoKSkpO1xuICB9XG5cbiAgX3NldFJlc3VsdChzZXJ2aWNlTmFtZTogc3RyaW5nLCBkaXJOYW1lOiBzdHJpbmcsIHJlc3VsdHM6IEFycmF5PG1peGVkPikge1xuICAgIHZhciB1cGRhdGVkUmVzdWx0c0J5RGlyZWN0b3J5ID0gey4uLnRoaXMuc3RhdGUucmVzdWx0c0J5U2VydmljZVtzZXJ2aWNlTmFtZV19O1xuICAgIHVwZGF0ZWRSZXN1bHRzQnlEaXJlY3RvcnlbZGlyTmFtZV0gPSByZXN1bHRzO1xuXG4gICAgdmFyIHVwZGF0ZWRSZXN1bHRzQnlTZXJ2aWNlID0gey4uLnRoaXMuc3RhdGUucmVzdWx0c0J5U2VydmljZX07XG4gICAgdXBkYXRlZFJlc3VsdHNCeVNlcnZpY2Vbc2VydmljZU5hbWVdID0gdXBkYXRlZFJlc3VsdHNCeURpcmVjdG9yeTtcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgcmVzdWx0c0J5U2VydmljZTogdXBkYXRlZFJlc3VsdHNCeVNlcnZpY2UsXG4gICAgfSwgKCkgPT4ge1xuICAgICAgdGhpcy5fZW1pdHRlci5lbWl0KCdpdGVtcy1jaGFuZ2VkJywgdXBkYXRlZFJlc3VsdHNCeVNlcnZpY2UpO1xuICAgIH0pO1xuICB9XG5cbiAgX3N1YnNjcmliZVRvUmVzdWx0KHNlcnZpY2VOYW1lOiBzdHJpbmcsIGRpcmVjdG9yeTpzdHJpbmcsIHJlc3VsdFByb21pc2U6IFByb21pc2U8e3Jlc3VsdHM6IEFycmF5PEZpbGVSZXN1bHQ+fT4pIHtcbiAgICByZXN1bHRQcm9taXNlLnRoZW4oaXRlbXMgPT4ge1xuICAgICAgdmFyIHVwZGF0ZWRJdGVtcyA9IHtcbiAgICAgICAgd2FpdGluZzogZmFsc2UsXG4gICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICBpdGVtczogaXRlbXMucmVzdWx0cyxcbiAgICAgIH07XG4gICAgICB0aGlzLl9zZXRSZXN1bHQoc2VydmljZU5hbWUsIGRpcmVjdG9yeSwgdXBkYXRlZEl0ZW1zKTtcbiAgICB9KS5jYXRjaChlcnJvciA9PiB7XG4gICAgICB2YXIgdXBkYXRlZEl0ZW1zID0ge1xuICAgICAgICB3YWl0aW5nOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6ICdhbiBlcnJvciBvY2N1cnJlZDogJyArIGVycm9yLFxuICAgICAgICBpdGVtczogW10sXG4gICAgICB9O1xuICAgICAgdGhpcy5fc2V0UmVzdWx0KHNlcnZpY2VOYW1lLCBkaXJlY3RvcnksIHVwZGF0ZWRJdGVtcyk7XG4gICAgfSk7XG4gIH1cblxuICBzZXRRdWVyeShxdWVyeTogc3RyaW5nKSB7XG4gICAgdmFyIHByb3ZpZGVyID0gdGhpcy5nZXRQcm92aWRlcigpO1xuICAgIGlmICghcHJvdmlkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbmV3SXRlbXMgPSBwcm92aWRlci5leGVjdXRlUXVlcnkoc2FuaXRpemVRdWVyeShxdWVyeSkpO1xuICAgIG5ld0l0ZW1zLnRoZW4oKHJlcXVlc3RzQnlEaXJlY3Rvcnk6IEdyb3VwZWRSZXN1bHQpID0+IHtcbiAgICAgIHZhciBncm91cGVkQnlTZXJ2aWNlOiBSZXN1bHRzQnlTZXJ2aWNlID0ge307XG4gICAgICBmb3IgKHZhciBkaXJOYW1lIGluIHJlcXVlc3RzQnlEaXJlY3RvcnkpIHtcbiAgICAgICAgdmFyIHNlcnZpY2VzRm9yRGlyZWN0b3J5ID0gcmVxdWVzdHNCeURpcmVjdG9yeVtkaXJOYW1lXTtcbiAgICAgICAgZm9yICh2YXIgc2VydmljZU5hbWUgaW4gc2VydmljZXNGb3JEaXJlY3RvcnkpIHtcbiAgICAgICAgICB2YXIgcHJvbWlzZSA9IHNlcnZpY2VzRm9yRGlyZWN0b3J5W3NlcnZpY2VOYW1lXTtcbiAgICAgICAgICB0aGlzLl9zdWJzY3JpYmVUb1Jlc3VsdChzZXJ2aWNlTmFtZSwgZGlyTmFtZSwgcHJvbWlzZSk7XG4gICAgICAgICAgaWYgKGdyb3VwZWRCeVNlcnZpY2Vbc2VydmljZU5hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGdyb3VwZWRCeVNlcnZpY2Vbc2VydmljZU5hbWVdID0ge307XG4gICAgICAgICAgfVxuICAgICAgICAgIGdyb3VwZWRCeVNlcnZpY2Vbc2VydmljZU5hbWVdW2Rpck5hbWVdID0ge1xuICAgICAgICAgICAgaXRlbXM6IFtdLFxuICAgICAgICAgICAgd2FpdGluZzogdHJ1ZSxcbiAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0U3RhdGUoe3Jlc3VsdHNCeVNlcnZpY2U6IGdyb3VwZWRCeVNlcnZpY2V9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldFByb3ZpZGVyKCk6IFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIge1xuICAgIHJldHVybiB0aGlzLnByb3BzLnByb3ZpZGVyO1xuICB9XG5cbiAgLy8gVE9ETzogV2UgbmVlZCBhIHR5cGUgdGhhdCBjb3JyZXNwb25kcyB0byA8YXRvbS10ZXh0LWVkaXRvcj4gdGhhdCBpcyBtb3JlIHNwZWNpZmljIHRoYW5cbiAgLy8gSFRNTEVsZW1lbnQsIHdoaWNoIHdvdWxkIGVsaW1pbmF0ZSBhIG51bWJlciBvZiBGbG93IHR5cGUgZXJyb3JzIGluIHRoaXMgZmlsZS5cbiAgZ2V0SW5wdXRUZXh0RWRpdG9yKCk6IEhUTUxFbGVtZW50IHtcbiAgICByZXR1cm4gUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzWydxdWVyeUlucHV0J10pO1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5nZXRJbnB1dFRleHRFZGl0b3IoKS5tb2RlbC5zZXRUZXh0KCcnKTtcbiAgICB0aGlzLmNsZWFyU2VsZWN0aW9uKCk7XG4gIH1cblxuICBmb2N1cygpIHtcbiAgICB0aGlzLmdldElucHV0VGV4dEVkaXRvcigpLmZvY3VzKCk7XG4gIH1cblxuICBibHVyKCkge1xuICAgIHRoaXMuZ2V0SW5wdXRUZXh0RWRpdG9yKCkuYmx1cigpO1xuICB9XG5cbiAgc2V0SW5wdXRWYWx1ZSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fZ2V0VGV4dEVkaXRvcigpLnNldFRleHQodmFsdWUpO1xuICB9XG5cbiAgc2VsZWN0SW5wdXQoKSB7XG4gICAgdGhpcy5fZ2V0VGV4dEVkaXRvcigpLnNlbGVjdEFsbCgpO1xuICB9XG5cbiAgX2dldFRleHRFZGl0b3IoKTogVGV4dEVkaXRvciB7XG4gICAgcmV0dXJuIHRoaXMucmVmc1sncXVlcnlJbnB1dCddLmdldFRleHRFZGl0b3IoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0gbmV3VGFiIGlzIGFjdHVhbGx5IGEgVGFiSW5mbyBwbHVzIHRoZSBgbmFtZWAgYW5kIGB0YWJDb250ZW50YCBwcm9wZXJ0aWVzIGFkZGVkIGJ5XG4gICAqICAgICBfcmVuZGVyVGFicygpLCB3aGljaCBjcmVhdGVkIHRoZSB0YWIgb2JqZWN0IGluIHRoZSBmaXJzdCBwbGFjZS5cbiAgICovXG4gIF9oYW5kbGVUYWJDaGFuZ2UobmV3VGFiOiBUYWJJbmZvKSB7XG4gICAgY2xlYXJUaW1lb3V0KHRoaXMuX3NjaGVkdWxlZENhbmNlbCk7XG4gICAgdmFyIHByb3ZpZGVyTmFtZSA9IG5ld1RhYi5wcm92aWRlck5hbWU7XG4gICAgaWYgKHByb3ZpZGVyTmFtZSAhPT0gdGhpcy5zdGF0ZS5hY3RpdmVUYWIpIHtcbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBhY3RpdmVUYWI6IHByb3ZpZGVyTmFtZSxcbiAgICAgIH0sICgpID0+IHtcbiAgICAgICAgdGhpcy5fZW1pdHRlci5lbWl0KCdhY3RpdmUtcHJvdmlkZXItY2hhbmdlZCcsIG5ld1RhYi5wcm92aWRlck5hbWUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgX3JlbmRlclRhYnMoKTogUmVhY3RFbGVtZW50IHtcbiAgICB2YXIgdGFicyA9IHRoaXMucHJvcHMudGFicy5tYXAodGFiID0+IHtcbiAgICAgIHZhciBrZXlCaW5kaW5nID0gbnVsbDtcbiAgICAgIGlmICh0YWIuYWN0aW9uKSB7XG4gICAgICAgIGtleUJpbmRpbmcgPSAoXG4gICAgICAgICAgPGtiZCBjbGFzc05hbWU9XCJrZXktYmluZGluZ1wiPlxuICAgICAgICAgICAge19maW5kS2V5YmluZGluZ0ZvckFjdGlvbih0YWIuYWN0aW9uLCB0aGlzLl9tb2RhbE5vZGUpfVxuICAgICAgICAgIDwva2JkPlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4udGFiLFxuICAgICAgICBuYW1lOiB0YWIucHJvdmlkZXJOYW1lLFxuICAgICAgICB0YWJDb250ZW50OiA8c3Bhbj57dGFiLnRpdGxlfXtrZXlCaW5kaW5nfTwvc3Bhbj5cbiAgICAgIH07XG4gICAgfSk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwib21uaXNlYXJjaC10YWJzXCI+XG4gICAgICAgIDxOdWNsaWRlVGFic1xuICAgICAgICAgIHRhYnM9e3RhYnN9XG4gICAgICAgICAgYWN0aXZlVGFiTmFtZT17dGhpcy5zdGF0ZS5hY3RpdmVUYWJ9XG4gICAgICAgICAgb25BY3RpdmVUYWJDaGFuZ2U9e3RoaXMuX2JvdW5kSGFuZGxlVGFiQ2hhbmdlfVxuICAgICAgICAgIHRyaWdnZXJpbmdFdmVudD1cIm9uTW91c2VFbnRlclwiXG4gICAgICAgIC8+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgX3JlbmRlckVtcHR5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcpOiBSZWFjdEVsZW1lbnQge1xuICAgIHJldHVybiAoXG4gICAgICA8dWwgY2xhc3NOYW1lPVwiYmFja2dyb3VuZC1tZXNzYWdlIGNlbnRlcmVkXCI+XG4gICAgICAgIDxsaT57bWVzc2FnZX08L2xpPlxuICAgICAgPC91bD5cbiAgICApO1xuICB9XG5cbiAgX2hhc05vUmVzdWx0cygpOiBib29sZWFuIHtcbiAgICBmb3IgKHZhciBzZXJ2aWNlTmFtZSBpbiB0aGlzLnN0YXRlLnJlc3VsdHNCeVNlcnZpY2UpIHtcbiAgICAgIHZhciBzZXJ2aWNlID0gdGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlW3NlcnZpY2VOYW1lXTtcbiAgICAgIGZvciAodmFyIGRpck5hbWUgaW4gc2VydmljZSkge1xuICAgICAgICB2YXIgcmVzdWx0cyA9IHNlcnZpY2VbZGlyTmFtZV07XG4gICAgICAgIGlmICghcmVzdWx0cy53YWl0aW5nICYmIHJlc3VsdHMuaXRlbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJlbmRlcigpOiBSZWFjdEVsZW1lbnQge1xuICAgIHZhciBpdGVtc1JlbmRlcmVkID0gMDtcbiAgICB2YXIgc2VydmljZU5hbWVzID0gT2JqZWN0LmtleXModGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlKTtcbiAgICB2YXIgc2VydmljZXMgPSBzZXJ2aWNlTmFtZXMubWFwKHNlcnZpY2VOYW1lID0+IHtcbiAgICAgIHZhciBkaXJlY3RvcmllcyA9IHRoaXMuc3RhdGUucmVzdWx0c0J5U2VydmljZVtzZXJ2aWNlTmFtZV07XG4gICAgICB2YXIgZGlyZWN0b3J5TmFtZXMgPSBPYmplY3Qua2V5cyhkaXJlY3Rvcmllcyk7XG4gICAgICB2YXIgZGlyZWN0b3JpZXNGb3JTZXJ2aWNlID0gZGlyZWN0b3J5TmFtZXMubWFwKGRpck5hbWUgPT4ge1xuICAgICAgICB2YXIgcmVzdWx0c0ZvckRpcmVjdG9yeSA9IGRpcmVjdG9yaWVzW2Rpck5hbWVdO1xuICAgICAgICB2YXIgbWVzc2FnZSA9IG51bGw7XG4gICAgICAgIGlmIChyZXN1bHRzRm9yRGlyZWN0b3J5LndhaXRpbmcpIHtcbiAgICAgICAgICBpdGVtc1JlbmRlcmVkKys7XG4gICAgICAgICAgbWVzc2FnZSA9IChcbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJsb2FkaW5nIGxvYWRpbmctc3Bpbm5lci10aW55IGlubGluZS1ibG9ja1wiIC8+XG4gICAgICAgICAgICAgIExvYWRpbmcuLi5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdHNGb3JEaXJlY3RvcnkuZXJyb3IpIHtcbiAgICAgICAgICBtZXNzYWdlID0gKFxuICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImljb24gaWNvbi1jaXJjbGUtc2xhc2hcIiAvPlxuICAgICAgICAgICAgICBFcnJvcjogPHByZT57cmVzdWx0c0ZvckRpcmVjdG9yeS5lcnJvcn08L3ByZT5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdHNGb3JEaXJlY3RvcnkuaXRlbXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbWVzc2FnZSA9IChcbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uIGljb24teFwiIC8+XG4gICAgICAgICAgICAgIE5vIHJlc3VsdHNcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpdGVtQ29tcG9uZW50cyA9IHJlc3VsdHNGb3JEaXJlY3RvcnkuaXRlbXMubWFwKChpdGVtLCBpdGVtSW5kZXgpID0+IHtcbiAgICAgICAgICAgIHZhciBpc1NlbGVjdGVkID0gKFxuICAgICAgICAgICAgICBzZXJ2aWNlTmFtZSA9PT0gdGhpcy5zdGF0ZS5zZWxlY3RlZFNlcnZpY2UgJiZcbiAgICAgICAgICAgICAgZGlyTmFtZSA9PT0gdGhpcy5zdGF0ZS5zZWxlY3RlZERpcmVjdG9yeSAmJlxuICAgICAgICAgICAgICBpdGVtSW5kZXggPT09IHRoaXMuc3RhdGUuc2VsZWN0ZWRJdGVtSW5kZXhcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpdGVtc1JlbmRlcmVkKys7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8bGlcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2N4KHtcbiAgICAgICAgICAgICAgICAgICdxdWljay1vcGVuLXJlc3VsdC1pdGVtJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICdsaXN0LWl0ZW0nOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgc2VsZWN0ZWQ6IGlzU2VsZWN0ZWQsXG4gICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAga2V5PXtzZXJ2aWNlTmFtZSArIGRpck5hbWUgKyBpdGVtSW5kZXh9XG4gICAgICAgICAgICAgICAgb25Nb3VzZURvd249e3RoaXMuX2JvdW5kU2VsZWN0fVxuICAgICAgICAgICAgICAgIG9uTW91c2VFbnRlcj17dGhpcy5zZXRTZWxlY3RlZEluZGV4LmJpbmQodGhpcywgc2VydmljZU5hbWUsIGRpck5hbWUsIGl0ZW1JbmRleCl9PlxuICAgICAgICAgICAgICAgIHt0aGlzLmNvbXBvbmVudEZvckl0ZW0oaXRlbSwgc2VydmljZU5hbWUpfVxuICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vaGlkZSBmb2xkZXJzIGlmIG9ubHkgMSBsZXZlbCB3b3VsZCBiZSBzaG93blxuICAgICAgICB2YXIgc2hvd0RpcmVjdG9yaWVzID0gZGlyZWN0b3J5TmFtZXMubGVuZ3RoID4gMTtcbiAgICAgICAgdmFyIGRpcmVjdG9yeUxhYmVsID0gc2hvd0RpcmVjdG9yaWVzXG4gICAgICAgICAgPyAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtaXRlbVwiPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpY29uIGljb24tZmlsZS1kaXJlY3RvcnlcIj57ZGlyTmFtZX08L3NwYW4+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApXG4gICAgICAgICAgOiBudWxsO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxsaSBjbGFzc05hbWU9e2N4KHsnbGlzdC1uZXN0ZWQtaXRlbSc6IHNob3dEaXJlY3Rvcmllc30pfSBrZXk9e2Rpck5hbWV9PlxuICAgICAgICAgICAge2RpcmVjdG9yeUxhYmVsfVxuICAgICAgICAgICAge21lc3NhZ2V9XG4gICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibGlzdC10cmVlXCI+XG4gICAgICAgICAgICAgIHtpdGVtQ29tcG9uZW50c31cbiAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgPC9saT5cbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGxpIGNsYXNzTmFtZT1cImxpc3QtbmVzdGVkLWl0ZW1cIiBrZXk9e3NlcnZpY2VOYW1lfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImxpc3QtaXRlbVwiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaWNvbiBpY29uLWdlYXJcIj57c2VydmljZU5hbWV9PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJsaXN0LXRyZWVcIiByZWY9XCJzZWxlY3Rpb25MaXN0XCI+XG4gICAgICAgICAgICB7ZGlyZWN0b3JpZXNGb3JTZXJ2aWNlfVxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvbGk+XG4gICAgICApO1xuICAgIH0pO1xuICAgIHZhciBub1Jlc3VsdHNNZXNzYWdlID0gbnVsbDtcbiAgICBpZiAob2JqZWN0LmlzRW1wdHkodGhpcy5zdGF0ZS5yZXN1bHRzQnlTZXJ2aWNlKSkge1xuICAgICAgbm9SZXN1bHRzTWVzc2FnZSA9IHRoaXMuX3JlbmRlckVtcHR5TWVzc2FnZSgnU2VhcmNoIGF3YXkhJyk7XG4gICAgfSBlbHNlIGlmIChpdGVtc1JlbmRlcmVkID09PSAwKSB7XG4gICAgICBub1Jlc3VsdHNNZXNzYWdlID0gdGhpcy5fcmVuZGVyRW1wdHlNZXNzYWdlKDxzcGFuPsKvXFxfKOODhClfL8KvPGJyLz5ObyByZXN1bHRzPC9zcGFuPik7XG4gICAgfVxuICAgIHZhciBjdXJyZW50UHJvdmlkZXIgPSB0aGlzLmdldFByb3ZpZGVyKCk7XG4gICAgdmFyIHByb21wdFRleHQgPSAoY3VycmVudFByb3ZpZGVyICYmIGN1cnJlbnRQcm92aWRlci5nZXRQcm9tcHRUZXh0KCkpIHx8ICcnO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInNlbGVjdC1saXN0IG9tbmlzZWFyY2gtbW9kYWxcIiByZWY9XCJtb2RhbFwiPlxuICAgICAgICA8QXRvbUlucHV0IHJlZj1cInF1ZXJ5SW5wdXRcIiBwbGFjZWhvbGRlclRleHQ9e3Byb21wdFRleHR9IC8+XG4gICAgICAgIHt0aGlzLl9yZW5kZXJUYWJzKCl9XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib21uaXNlYXJjaC1yZXN1bHRzXCI+XG4gICAgICAgICAge25vUmVzdWx0c01lc3NhZ2V9XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJvbW5pc2VhcmNoLXBhbmVcIj5cbiAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJsaXN0LXRyZWVcIj5cbiAgICAgICAgICAgICAge3NlcnZpY2VzfVxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59XG5cbnZhciBUYWJJbmZvUHJvcFR5cGUgPSBQcm9wVHlwZXMuc2hhcGUoe1xuICBwcm92aWRlck5hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHBhdGg6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gIHNjb3JlOiBSZWFjdC5Qcm9wVHlwZXMubnVtYmVyLFxufSk7XG5cblF1aWNrU2VsZWN0aW9uQ29tcG9uZW50LnByb3BUeXBlcyA9IHtcbiAgcHJvdmlkZXI6IFByb3BUeXBlcy5pbnN0YW5jZU9mKFF1aWNrU2VsZWN0aW9uUHJvdmlkZXIpLmlzUmVxdWlyZWQsXG4gIHRhYnM6IFByb3BUeXBlcy5hcnJheU9mKFRhYkluZm9Qcm9wVHlwZSkuaXNSZXF1aXJlZCxcbiAgaW5pdGlhbEFjdGl2ZVRhYjogUHJvcFR5cGVzLnNoYXBlKFRhYkluZm9Qcm9wVHlwZSkuaXNSZXF1aXJlZCxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUXVpY2tTZWxlY3Rpb25Db21wb25lbnQ7XG4iXX0=
