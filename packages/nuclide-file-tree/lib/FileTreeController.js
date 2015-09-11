
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var fetchChildren = _asyncToGenerator(function* (node, controller) {
  if (!node.isContainer()) {
    return Immutable.List.of();
  }

  var directory = node.getItem();
  var directoryEntries = yield new Promise(function (resolve, reject) {
    directory.getEntries(function (error, entries) {
      // Resolve to an empty array if the directory deson't exist.
      if (error && error.code !== 'ENOENT') {
        reject(error);
      } else {
        resolve(entries || []);
      }
    });
  });

  var fileNodes = [];
  var directoryNodes = [];
  directoryEntries.forEach(function (entry) {
    var childNode = controller.getNodeAndSetState(entry, /* parent */node);
    if (entry.isDirectory()) {
      directoryNodes.push(childNode);
    } else if (entry.isFile()) {
      fileNodes.push(childNode);
    }
  });

  var newChildren = directoryNodes.concat(fileNodes);

  var cachedChildren = node.getCachedChildren();
  if (cachedChildren) {
    controller.destroyStateForOldNodes(cachedChildren, newChildren);
  }

  return new Immutable.List(newChildren);
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _require = require('nuclide-atom-helpers');

var fileTypeClass = _require.fileTypeClass;

var _require2 = require('atom');

var CompositeDisposable = _require2.CompositeDisposable;
var Disposable = _require2.Disposable;

var Immutable = require('immutable');
var LazyFileTreeNode = require('./LazyFileTreeNode');

var _require3 = require('nuclide-panel');

var PanelController = _require3.PanelController;

var fs = require('fs-plus');
var path = require('path');
var shell = require('shell');

var _require4 = require('nuclide-ui-tree');

var treeNodeTraversals = _require4.treeNodeTraversals;
var TreeRootComponent = _require4.TreeRootComponent;

var React = require('react-for-atom');

var addons = React.addons;

function labelClassNameForNode(node) {
  var classObj = {
    'icon': true,
    'name': true
  };

  var iconClassName;
  if (node.isContainer()) {
    iconClassName = node.isSymlink() ? 'icon-file-symlink-directory' : 'icon-file-directory';
  } else if (node.isSymlink()) {
    iconClassName = 'icon-file-symlink-file';
  } else {
    iconClassName = fileTypeClass(node.getLabel());
  }
  classObj[iconClassName] = true;

  return addons.classSet(classObj);
}

function rowClassNameForNode(node) {
  if (!node) {
    return '';
  }

  var vcsClassName = vcsClassNameForEntry(node.getItem());
  return addons.classSet(_defineProperty({}, vcsClassName, vcsClassName));
}

// TODO (t7337695) Make this function more efficient.
function vcsClassNameForEntry(entry) {
  var path = entry.getPath();

  var className = '';

  var _require5 = require('nuclide-hg-git-bridge');

  var repositoryContainsPath = _require5.repositoryContainsPath;

  atom.project.getRepositories().every(function (repository) {
    if (!repository) {
      return true;
    }

    if (!repositoryContainsPath(repository, path)) {
      return true;
    }

    if (repository.isPathIgnored(path)) {
      className = 'status-ignored';
      return false;
    }

    var status = null;
    if (entry.isFile()) {
      status = repository.getCachedPathStatus(path);
    } else if (entry.isDirectory()) {
      status = repository.getDirectoryStatus(path);
    }

    if (status) {
      if (repository.isStatusNew(status)) {
        className = 'status-added';
      } else if (repository.isStatusModified(status)) {
        className = 'status-modified';
      }
      return false;
    }

    return true;
  }, this);
  return className;
}

function isLocalFile(entry) {
  return entry.getLocalPath === undefined;
}

var FileTree = React.createClass({
  displayName: 'FileTree',

  render: function render() {
    return React.createElement(
      'div',
      { className: 'nuclide-file-tree', tabIndex: '-1' },
      React.createElement(TreeRootComponent, _extends({ ref: 'root' }, this.props))
    );
  },

  getTreeRoot: function getTreeRoot() {
    return this.refs.root;
  }
});

var FileTreeController = (function () {
  function FileTreeController(state) {
    var _this = this;

    _classCallCheck(this, FileTreeController);

    this._fetchChildrenWithController = function (node) {
      return fetchChildren(node, _this);
    };

    this._keyToState = new Map();

    this._subscriptions = new CompositeDisposable();
    this._repositorySubscriptions = null;

    this._subscriptions.add(new Disposable(function () {
      for (var nodeState of _this._keyToState.values()) {
        if (nodeState.subscription) {
          nodeState.subscription.dispose();
        }
      }
      _this._keyToState = null;
    }));

    var directories = atom.project.getDirectories();
    this._roots = directories.map(function (directory) {
      return _this.getNodeAndSetState(directory, /* parent */null);
    });

    var eventHandlerSelector = '.nuclide-file-tree';

    this._subscriptions.add(atom.commands.add(eventHandlerSelector, {
      'core:backspace': function coreBackspace() {
        return _this.deleteSelection();
      },
      'core:delete': function coreDelete() {
        return _this.deleteSelection();
      }
    }));

    var props = {
      initialRoots: this._roots,
      eventHandlerSelector: eventHandlerSelector,
      onConfirmSelection: this.onConfirmSelection.bind(this),
      onKeepSelection: this.onKeepSelection.bind(this),
      labelClassNameForNode: labelClassNameForNode,
      rowClassNameForNode: rowClassNameForNode,
      elementToRenderWhenEmpty: React.createElement(
        'div',
        null,
        'No project root'
      )
    };
    if (state && state.tree) {
      props.initialExpandedNodeKeys = state.tree.expandedNodeKeys;
      props.initialSelectedNodeKeys = state.tree.selectedNodeKeys;
    }
    this._panelController = new PanelController(React.createElement(FileTree, props), { dock: 'left' }, state && state.panel);

    this._subscriptions.add(atom.commands.add(eventHandlerSelector, {
      'nuclide-file-tree:add-file': function nuclideFileTreeAddFile() {
        return _this.openAddFileDialog();
      },
      'nuclide-file-tree:add-folder': function nuclideFileTreeAddFolder() {
        return _this.openAddFolderDialog();
      },
      'nuclide-file-tree:delete-selection': function nuclideFileTreeDeleteSelection() {
        return _this.deleteSelection();
      },
      'nuclide-file-tree:rename-selection': function nuclideFileTreeRenameSelection() {
        return _this.openRenameDialog();
      },
      'nuclide-file-tree:duplicate-selection': function nuclideFileTreeDuplicateSelection() {
        return _this.openDuplicateDialog();
      },
      'nuclide-file-tree:remove-project-folder-selection': function nuclideFileTreeRemoveProjectFolderSelection() {
        return _this.removeRootFolderSelection();
      },
      'nuclide-file-tree:copy-full-path': function nuclideFileTreeCopyFullPath() {
        return _this.copyFullPath();
      },
      'nuclide-file-tree:show-in-file-manager': function nuclideFileTreeShowInFileManager() {
        return _this.showInFileManager();
      },
      'nuclide-file-tree:reload': function nuclideFileTreeReload() {
        return _this.reload();
      },
      'nuclide-file-tree:search-in-directory': function nuclideFileTreeSearchInDirectory() {
        return _this.searchInDirectory();
      }
    }));

    this._subscriptions.add(atom.project.onDidChangePaths(function (paths) {
      var treeComponent = _this.getTreeComponent();
      if (treeComponent) {
        var newRoots = atom.project.getDirectories().map(function (directory) {
          return _this.getNodeAndSetState(directory, /* parent */null);
        });
        _this.destroyStateForOldNodes(_this._roots, newRoots);
        _this._roots = newRoots;
        treeComponent.setRoots(newRoots);

        if (_this._repositorySubscriptions) {
          _this._repositorySubscriptions.dispose();
        }
        _this._repositorySubscriptions = new CompositeDisposable();
        atom.project.getRepositories().forEach(function (repository) {
          var _this2 = this;

          if (repository) {
            this._repositorySubscriptions.add(repository.onDidChangeStatuses(function () {
              _this2.forceUpdate();
            }));
            if (repository.getStatuses) {
              // This method is available on HgRepositoryClient.
              // This will trigger a repository ::onDidChangeStatuses event if there
              // are modified files, and thus update the tree to reflect the
              // current version control "state" of the files.
              repository.getStatuses([repository.getProjectDirectory()]);
            }
          }
        }, _this);
      }
    }));

    this.addContextMenuItemGroup([{
      label: 'New',
      submenu: [{
        label: 'File',
        command: 'nuclide-file-tree:add-file'
      }, {
        label: 'Folder',
        command: 'nuclide-file-tree:add-folder'
      }],
      // Show 'New' menu only when a single directory is selected so the
      // target is obvious and can handle a "new" object.
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length === 1 && nodes.every(function (node) {
          return node.isContainer();
        });
      }
    }]);
    this.addContextMenuItemGroup([{
      label: 'Add Project Folder',
      command: 'application:add-project-folder',
      shouldDisplayIfTreeIsEmpty: true
    }, {
      label: 'Add Remote Project Folder',
      command: 'nuclide-remote-projects:connect',
      shouldDisplayIfTreeIsEmpty: true
    }, {
      label: 'Remove Project Folder',
      command: 'nuclide-file-tree:remove-project-folder-selection',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length > 0 && nodes.every(function (node) {
          return node.isRoot();
        });
      }
    }]);
    this.addContextMenuItemGroup([{
      label: 'Rename',
      command: 'nuclide-file-tree:rename-selection',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length === 1 && !nodes[0].isRoot();
      }
    }, {
      label: 'Duplicate',
      command: 'nuclide-file-tree:duplicate-selection',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length === 1 && !nodes[0].getItem().isDirectory();
      }
    }, {
      label: 'Delete',
      command: 'nuclide-file-tree:delete-selection',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length > 0 && !nodes.some(function (node) {
          return node.isRoot();
        });
      }
    }]);
    this.addContextMenuItemGroup([{
      label: 'Copy Full Path',
      command: 'nuclide-file-tree:copy-full-path',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        return nodes.length === 1;
      }
    }, {
      label: 'Show in Finder',
      command: 'nuclide-file-tree:show-in-file-manager',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        // For now, this only works for local files on OS X.
        return nodes.length === 1 && isLocalFile(nodes[0].getItem()) && process.platform === 'darwin';
      }
    }, {
      label: 'Search in Directory',
      command: 'nuclide-file-tree:search-in-directory',
      shouldDisplayForSelectedNodes: function shouldDisplayForSelectedNodes(nodes) {
        // There should be at least one directory in the selection.
        return nodes.some(function (node) {
          return node.getItem().isDirectory();
        });
      }
    }]);
    this.addContextMenuItemGroup([{
      label: 'Reload',
      command: 'nuclide-file-tree:reload'
    }]);
  }

  _createClass(FileTreeController, [{
    key: 'destroy',
    value: function destroy() {
      this._panelController.destroy();
      this._panelController = null;
      this._subscriptions.dispose();
      this._subscriptions = null;
      if (this._repositorySubscriptions) {
        this._repositorySubscriptions.dispose();
        this._repositorySubscriptions = null;
      }
      this._logger = null;
      if (this._hostElement) {
        this._hostElement.parentNode.removeChild(this._hostElement);
      }
      this._closeDialog();
    }
  }, {
    key: 'toggle',
    value: function toggle() {
      this._panelController.toggle();
    }
  }, {
    key: 'setVisible',
    value: function setVisible(shouldBeVisible) {
      this._panelController.setVisible(shouldBeVisible);
    }
  }, {
    key: 'serialize',
    value: function serialize() {
      var treeComponent = this.getTreeComponent();
      var tree = treeComponent ? treeComponent.serialize() : null;
      return {
        panel: this._panelController.serialize(),
        tree: tree
      };
    }
  }, {
    key: 'forceUpdate',
    value: function forceUpdate() {
      var treeComponent = this.getTreeComponent();
      if (treeComponent) {
        treeComponent.forceUpdate();
      }
    }
  }, {
    key: 'addContextMenuItemGroup',
    value: function addContextMenuItemGroup(menuItemDefinitions) {
      var treeComponent = this.getTreeComponent();
      if (treeComponent) {
        treeComponent.addContextMenuItemGroup(menuItemDefinitions);
      }
    }
  }, {
    key: 'getTreeComponent',
    value: function getTreeComponent() {
      var component = this._panelController.getChildComponent();
      if (component && component.hasOwnProperty('getTreeRoot')) {
        return component.getTreeRoot();
      }
      return null;
    }

    /**
     * Returns the cached node for `entry` or creates a new one. It sets the appropriate bookkeeping
     * state if it creates a new node.
     */
  }, {
    key: 'getNodeAndSetState',
    value: function getNodeAndSetState(entry, parent) {
      var _this3 = this;

      // We need to create a node to get the path, even if we don't end up returning it.
      var node = new LazyFileTreeNode(entry, parent, this._fetchChildrenWithController);
      var nodeKey = node.getKey();

      // Reuse existing node if possible. This preserves the cached children and prevents
      // us from creating multiple file watchers on the same file.
      var state = this.getStateForNodeKey(nodeKey);
      if (state) {
        return state.node;
      }

      var subscription = null;
      if (entry.isDirectory()) {
        try {
          // this call fails because it could try to watch a non-existing directory,
          // or with a use that has no permission to it.
          subscription = entry.onDidChange(function () {
            node.invalidateCache();
            _this3.forceUpdate();
          });
        } catch (err) {
          this._logError('nuclide-file-tree: Cannot subscribe to a directory.', entry.getPath(), err);
        }
      }

      this._setStateForNodeKey(nodeKey, { node: node, subscription: subscription });

      return node;
    }
  }, {
    key: '_setStateForNodeKey',
    value: function _setStateForNodeKey(nodeKey, state) {
      this._destroyStateForNodeKey(nodeKey);
      this._keyToState.set(nodeKey, state);
    }
  }, {
    key: 'getStateForNodeKey',
    value: function getStateForNodeKey(nodeKey) {
      return this._keyToState.get(nodeKey);
    }

    /**
     * Destroys states for nodes that are in `oldNodes` and not in `newNodes`.
     * This is useful when fetching new children -- some cached nodes can still
     * be reused and the rest must be destroyed.
     */
  }, {
    key: 'destroyStateForOldNodes',
    value: function destroyStateForOldNodes(oldNodes, newNodes) {
      var _this4 = this;

      var newNodesSet = new Set(newNodes);
      oldNodes.forEach(function (oldNode) {
        if (!newNodesSet.has(oldNode)) {
          _this4._destroyStateForNodeKey(oldNode.getKey());
        }
      });
    }
  }, {
    key: '_destroyStateForNodeKey',
    value: function _destroyStateForNodeKey(nodeKey) {
      var _this5 = this;

      var state = this.getStateForNodeKey(nodeKey);
      if (state) {
        var node = state.node;

        treeNodeTraversals.forEachCachedNode(node, function (cachedNode) {
          var cachedNodeKey = cachedNode.getKey();
          var cachedState = _this5.getStateForNodeKey(cachedNodeKey);
          if (cachedState) {
            if (cachedState.subscription) {
              cachedState.subscription.dispose();
            }
            _this5._keyToState['delete'](cachedNodeKey);
          }
        });

        var treeComponent = this.getTreeComponent();
        if (treeComponent) {
          treeComponent.removeStateForSubtree(node);
        }
      }
    }
  }, {
    key: 'onConfirmSelection',
    value: function onConfirmSelection(node) {
      var entry = node.getItem();
      atom.workspace.open(entry.getPath(), {
        activatePane: !atom.config.get('tabs.usePreviewTabs'),
        searchAllPanes: true
      });
    }
  }, {
    key: 'onKeepSelection',
    value: function onKeepSelection() {
      if (!atom.config.get('tabs.usePreviewTabs')) {
        return;
      }

      var activePaneItem = atom.workspace.getActivePaneItem();
      atom.commands.dispatch(atom.views.getView(activePaneItem), 'tabs:keep-preview-tab');

      // "Activate" the already-active pane to give it focus.
      atom.workspace.getActivePane().activate();
    }
  }, {
    key: 'removeRootFolderSelection',
    value: function removeRootFolderSelection() {
      var selectedItems = this._getSelectedItems();
      var selectedFilePaths = selectedItems.map(function (item) {
        return item.getPath();
      });
      var rootPathsSet = new Set(atom.project.getPaths());
      selectedFilePaths.forEach(function (selectedFilePath) {
        if (rootPathsSet.has(selectedFilePath)) {
          atom.project.removePath(selectedFilePath);
        }
      });
    }
  }, {
    key: 'copyFullPath',
    value: function copyFullPath() {
      var selectedItems = this._getSelectedItems();
      if (selectedItems.length !== 1) {
        this._logError('nuclide-file-tree: Exactly 1 item should be selected');
        return;
      }

      var selectedItem = selectedItems[0];
      // For remote files we want to copy the local path instead of full path.
      // i.e, "/home/dir/file" vs "nuclide:/host:port/home/dir/file"
      atom.clipboard.write(isLocalFile(selectedItem) ? selectedItem.getPath() : selectedItem.getLocalPath());
    }
  }, {
    key: 'showInFileManager',
    value: function showInFileManager() {
      var selectedItems = this._getSelectedItems();
      if (selectedItems.length !== 1) {
        return;
      }
      var filePath = selectedItems[0].getPath();

      if (process.platform === 'darwin') {
        var _require6 = require('nuclide-commons');

        var asyncExecute = _require6.asyncExecute;

        asyncExecute('open', ['-R', filePath], /* options */{});
      }
    }
  }, {
    key: 'searchInDirectory',
    value: function searchInDirectory() {
      var _this6 = this;

      // Dispatch a command to show the `ProjectFindView`. This opens the view and
      // focuses the search box.
      var workspaceElement = atom.views.getView(atom.workspace);
      atom.commands.dispatch(workspaceElement, 'project-find:show');

      // Since the ProjectFindView is not actually created until the first command is
      // dispatched, we delay the pre-filling to the start of the next event queue.
      setImmediate(function () {
        // Find panels that match the signature of a `ProjectFindView`.
        var findInProjectPanels = atom.workspace.getBottomPanels().filter(function (panel) {
          return panel.getItem().pathsEditor;
        });
        if (findInProjectPanels.length === 0) {
          return;
        }

        // Remove non-directory selections.
        var selectedDirs = _this6._getSelectedItems().filter(function (item) {
          return item.isDirectory();
        });

        // For each selected directory, get the path relative to the project root.
        var paths = [];
        selectedDirs.forEach(function (item) {
          for (var root of atom.project.getDirectories()) {
            // The selected directory is a subdirectory of this project.
            if (root.contains(item.getPath())) {
              return paths.push(root.relativize(item.getPath()));
            }
            // Edge case where the user clicks on the top-level directory.
            if (root.getPath() === item.getPath()) {
              return;
            }
          }

          // Unable to search in this path.
          var msg = 'The selected directory ' + item.getPath() + ' does not ' + ('appear to be under any of the project roots: ' + atom.project.getPaths() + '.');
          _this6._logError(msg, new Error(msg));
          atom.notifications.addError(msg, { dismissable: true });
        });

        // Update the text field in the `ProjectFindView`.
        findInProjectPanels[0].getItem().pathsEditor.setText(paths.join(', '));
      });
    }
  }, {
    key: 'revealActiveFile',
    value: _asyncToGenerator(function* () {
      var editor = atom.workspace.getActiveTextEditor();
      if (!editor) {
        return;
      }

      var treeComponent = this.getTreeComponent();
      if (treeComponent) {
        var _editor$getBuffer = editor.getBuffer();

        var file = _editor$getBuffer.file;

        if (file) {
          var find = require('nuclide-commons').array.find;

          var filePath = file.getPath();
          var rootDirectory = find(atom.project.getDirectories(), function (directory) {
            return directory.contains(filePath);
          });
          if (rootDirectory) {
            // Accumulate all the ancestor keys from the file up to the root.
            var directory = file.getParent();
            var ancestorKeys = [];
            while (rootDirectory.getPath() !== directory.getPath()) {
              ancestorKeys.push(new LazyFileTreeNode(directory).getKey());
              directory = directory.getParent();
            }
            ancestorKeys.push(new LazyFileTreeNode(rootDirectory).getKey());

            // Expand each node from the root down to the file.
            for (var nodeKey of ancestorKeys.reverse()) {
              try {
                // Select the node to ensure it's visible.
                yield treeComponent.selectNodeKey(nodeKey);
                yield treeComponent.expandNodeKey(nodeKey);
              } catch (error) {
                // If the node isn't in the tree, its descendants aren't either.
                return;
              }
            }

            try {
              yield treeComponent.selectNodeKey(new LazyFileTreeNode(file).getKey());
            } catch (error) {
              // It's ok if the node isn't in the tree, so we can ignore the error.
              return;
            }
          }
        }
      }
      this.setVisible(true);
    })
  }, {
    key: 'deleteSelection',
    value: function deleteSelection() {
      var _this7 = this;

      var treeComponent = this.getTreeComponent();
      if (!treeComponent) {
        return;
      }

      var selectedNodes = treeComponent.getSelectedNodes();
      if (selectedNodes.length === 0 || selectedNodes.some(function (node) {
        return node.isRoot();
      })) {
        return;
      }
      var selectedItems = selectedNodes.map(function (node) {
        return node.getItem();
      });

      var selectedPaths = selectedItems.map(function (entry) {
        return entry.getPath();
      });
      var message = 'Are you sure you want to delete the selected ' + (selectedItems.length > 1 ? 'items' : 'item');
      atom.confirm({
        message: message,
        detailedMessage: 'You are deleting:\n' + selectedPaths.join('\n'),
        buttons: {
          'Delete': _asyncToGenerator(function* () {
            var deletePromises = [];
            selectedItems.forEach(function (entry, i) {
              var entryPath = selectedPaths[i];
              if (entryPath.startsWith('nuclide:/')) {
                deletePromises.push(entry['delete']());
              } else {
                // TODO(jjiaa): This special-case can be eliminated once `delete()`
                // is added to `Directory` and `File`.
                shell.moveItemToTrash(entryPath);
              }
            });

            yield Promise.all(deletePromises);
            var parentDirectories = new Set(selectedItems.map(function (entry) {
              return entry.getParent();
            }));
            parentDirectories.forEach(function (directory) {
              return _this7._reloadDirectory(directory);
            });
          }),
          'Cancel': null
        }
      });
    }
  }, {
    key: 'reload',
    value: function reload() {
      var treeComponent = this.getTreeComponent();
      if (!treeComponent) {
        return;
      }
      treeComponent.invalidateCachedNodes();
      treeComponent.forceUpdate();
    }
  }, {
    key: '_getSelectedItems',
    value: function _getSelectedItems() {
      var treeComponent = this.getTreeComponent();
      if (!treeComponent) {
        return [];
      }

      var selectedNodes = treeComponent.getSelectedNodes();
      return selectedNodes.map(function (node) {
        return node.getItem();
      });
    }
  }, {
    key: 'openAddFileDialog',
    value: function openAddFileDialog() {
      var _this8 = this;

      this._openAddDialog('file', _asyncToGenerator(function* (rootDirectory, filePath) {
        // Note: this will throw if the resulting path matches that of an existing
        // local directory.
        var newFile = rootDirectory.getFile(filePath);
        yield newFile.create();
        atom.workspace.open(newFile.getPath());
        _this8._reloadDirectory(newFile.getParent());
      }));
    }
  }, {
    key: 'openAddFolderDialog',
    value: function openAddFolderDialog() {
      var _this9 = this;

      this._openAddDialog('folder', _asyncToGenerator(function* (rootDirectory, directoryPath) {
        var newDirectory = rootDirectory.getSubdirectory(directoryPath);
        yield newDirectory.create();
        _this9._reloadDirectory(newDirectory.getParent());
      }));
    }
  }, {
    key: '_reloadDirectory',
    value: function _reloadDirectory(directory) {
      var directoryNode = this.getTreeComponent().getNodeForKey(new LazyFileTreeNode(directory).getKey());
      directoryNode.invalidateCache();
      this.forceUpdate();
    }
  }, {
    key: '_openAddDialog',
    value: function _openAddDialog(entryType, onConfirm) {
      var selection = this._getSelectedEntryAndDirectoryAndRoot();
      if (!selection) {
        return;
      }
      var message = React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          null,
          'Enter the path for the new ',
          entryType,
          ' in the root:'
        ),
        React.createElement(
          'div',
          null,
          path.normalize(selection.root.getPath() + '/')
        )
      );

      var props = {
        rootDirectory: selection.root,
        initialEntry: selection.directory,
        initialDirectoryPath: selection.entry.getPath(),
        message: message,
        onConfirm: onConfirm,
        onClose: this._closeDialog.bind(this)
      };
      this._openDialog(props);
    }
  }, {
    key: 'openRenameDialog',
    value: function openRenameDialog() {
      var _this10 = this;

      var selection = this._getSelectedEntryAndDirectoryAndRoot();
      if (!selection) {
        return;
      }

      var entryType = selection.entry.isFile() ? 'file' : 'folder';
      var message = React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          null,
          'Enter the new path for the ',
          entryType,
          ' in the root:'
        ),
        React.createElement(
          'div',
          null,
          path.normalize(selection.root.getPath() + '/')
        )
      );

      var entry = selection.entry;
      var root = selection.root;

      var props = {
        rootDirectory: root,
        initialEntry: entry,
        message: message,
        onConfirm: _asyncToGenerator(function* (rootDirectory, relativeFilePath) {
          if (isLocalFile(entry)) {
            // TODO(jjiaa): This special-case can be eliminated once `delete()`
            // is added to `Directory` and `File`.
            yield new Promise(function (resolve, reject) {
              fs.move(entry.getPath(),
              // Use `resolve` to strip trailing slashes because renaming a
              // file to a name with a trailing slash is an error.
              path.resolve(path.join(rootDirectory.getPath(), relativeFilePath)), function (error) {
                return error ? reject(error) : resolve();
              });
            });
          } else {
            yield entry.rename(path.join(rootDirectory.getLocalPath(), relativeFilePath));
          }
          _this10._reloadDirectory(entry.getParent());
        }),
        onClose: function onClose() {
          return _this10._closeDialog();
        },
        shouldSelectBasename: true
      };
      this._openDialog(props);
    }
  }, {
    key: 'openDuplicateDialog',
    value: function openDuplicateDialog() {
      var _this11 = this;

      var selection = this._getSelectedEntryAndDirectoryAndRoot();
      var selectedItems = this._getSelectedItems();
      if (!selection || selectedItems.length > 1 || selection.entry.isDirectory()) {
        return;
      }

      var message = React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          null,
          'Enter the new name for the file in the root:'
        ),
        React.createElement(
          'div',
          null,
          path.normalize(selection.root.getPath() + '/')
        )
      );

      var entry = selection.entry;
      var root = selection.root;

      var pathObject = path.parse(root.relativize(entry.getPath()));

      // entry.getBaseName() + _copy e.g FileTreeController_copy.js
      var newEntryPath = path.format(_extends({}, pathObject, { base: pathObject.name + '_copy' + pathObject.ext }));
      var props = {
        rootDirectory: root,
        initialEntry: root.getFile(newEntryPath),
        message: message,
        onConfirm: _asyncToGenerator(function* (rootDirectory, relativeFilePath) {
          var treeComponent = _this11.getTreeComponent();
          var file = rootDirectory.getFile(relativeFilePath);
          var createdSuccessfully = yield file.create();
          if (createdSuccessfully) {
            yield entry.read().then(function (text) {
              return file.write(text);
            });
            _this11._reloadDirectory(entry.getParent());
            yield atom.workspace.open(file.getPath());
            if (treeComponent) {
              // TODO: This cannot reliably know when the file tree has re-rendered with this new
              // child given the file tree's implementation, and so this can result in a promise
              // rejection because it tries to select a node that does not yet exist.
              treeComponent.selectNodeKey(new LazyFileTreeNode(file).getKey());
            }
          } else {
            atom.notifications.addWarning('Failed to duplicate file', {
              dismissable: true,
              detail: 'There was a problem duplicating the file. Please check if the file "' + file.getBaseName() + '" already exists.'
            });
          }
        }),
        onClose: function onClose() {
          return _this11._closeDialog();
        },
        shouldSelectBasename: true
      };
      this._openDialog(props);
    }
  }, {
    key: '_openDialog',
    value: function _openDialog(props) {
      var FileDialogComponent = require('./FileDialogComponent');
      this._closeDialog();

      this._hostElement = document.createElement('div');
      var workspaceEl = atom.views.getView(atom.workspace);
      workspaceEl.appendChild(this._hostElement);
      this._dialogComponent = React.render(React.createElement(FileDialogComponent, props), this._hostElement);
    }
  }, {
    key: '_closeDialog',
    value: function _closeDialog() {
      if (this._dialogComponent && this._dialogComponent.isMounted()) {
        React.unmountComponentAtNode(this._hostElement);
        this._dialogComponent = null;
        atom.views.getView(atom.workspace).removeChild(this._hostElement);
        this._hostElement = null;
      }
    }

    /**
     * Returns an object with the following properties:
     * - entry: The selected file or directory.
     * - directory: The selected directory or its parent if the selection is a file.
     * - root: The root directory containing the selected entry.
     *
     * The entry defaults to the first root directory if nothing is selected.
     * Returns null if some of the returned properties can't be populated.
     *
     * This is useful for populating the file dialogs.
     */
  }, {
    key: '_getSelectedEntryAndDirectoryAndRoot',
    value: function _getSelectedEntryAndDirectoryAndRoot() {
      var treeComponent = this.getTreeComponent();
      if (!treeComponent) {
        this._logError('nuclide-file-tree: Cannot get the directory for the selection because no file tree exists.');
        return null;
      }

      var entry = null;
      var selectedNodes = treeComponent.getSelectedNodes();
      if (selectedNodes.length > 0) {
        entry = selectedNodes[0].getItem();
      } else {
        var rootDirectories = atom.project.getDirectories();
        if (rootDirectories.length > 0) {
          entry = rootDirectories[0];
        } else {
          // We shouldn't be able to reach this error because it should only be
          // accessible from a context menu. If there's a context menu, there must
          // be at least one root folder with a descendant that's right-clicked.
          this._logError('nuclide-file-tree: Could not find a directory to add to.');
          return null;
        }
      }

      return {
        entry: entry,
        directory: entry && entry.isFile() ? entry.getParent() : entry,
        root: this._getRootDirectory(entry)
      };
    }

    /**
     * Returns the workspace root directory for the entry, or the entry's parent.
     */
  }, {
    key: '_getRootDirectory',
    value: function _getRootDirectory(entry) {
      if (!entry) {
        return null;
      }
      var rootDirectoryOfEntry = null;
      var entryPath = entry.getPath();
      atom.project.getDirectories().some(function (directory) {
        // someDirectory.contains(someDirectory.getPath()) returns false, so
        // we also have to check for the equivalence of the path.
        if (directory.contains(entryPath) || directory.getPath() === entryPath) {
          rootDirectoryOfEntry = directory;
          return true;
        }
        return false;
      });

      if (!rootDirectoryOfEntry) {
        rootDirectoryOfEntry = entry.getParent();
      }

      return rootDirectoryOfEntry;
    }
  }, {
    key: '_logError',
    value: function _logError(errorMessage) {
      if (!this._logger) {
        this._logger = require('nuclide-logging').getLogger();
      }
      this._logger.error(errorMessage);
    }
  }]);

  return FileTreeController;
})();

module.exports = FileTreeController;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZpbGUtdHJlZS9saWIvRmlsZVRyZWVDb250cm9sbGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7SUF3QkcsYUFBYSxxQkFBNUIsV0FBNkIsSUFBc0IsRUFBRSxVQUE4QixFQUE2QztBQUM5SCxNQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxFQUFFO0FBQ3ZCLFdBQU8sU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztHQUM1Qjs7QUFFRCxNQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDL0IsTUFBSSxnQkFBZ0IsR0FBRyxNQUFNLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztBQUM1RCxhQUFTLENBQUMsVUFBVSxDQUFDLFVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBSzs7QUFFdkMsVUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDcEMsY0FBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQ2YsTUFBTTtBQUNMLGVBQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUM7T0FDeEI7S0FDRixDQUFDLENBQUM7R0FDSixDQUFDLENBQUM7O0FBRUgsTUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO0FBQ25CLE1BQUksY0FBYyxHQUFHLEVBQUUsQ0FBQztBQUN4QixrQkFBZ0IsQ0FBQyxPQUFPLENBQUMsVUFBQyxLQUFLLEVBQUs7QUFDbEMsUUFBSSxTQUFTLEdBQUcsVUFBVSxDQUFDLGtCQUFrQixDQUFDLEtBQUssY0FBZSxJQUFJLENBQUMsQ0FBQztBQUN4RSxRQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUUsRUFBRTtBQUN2QixvQkFBYyxDQUFD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Q0FBQztLQUNIOzs7Ozs7O1dBS2dCLDJCQUFDLEtBQWlDLEVBQW1CO0FBQ3BFLFVBQUksQ0FBQyxLQUFLLEVBQUU7QUFDVixlQUFPLElBQUksQ0FBQztPQUNiO0FBQ0QsVUFBSSxvQkFBb0IsR0FBRyxJQUFJLENBQUM7QUFDaEMsVUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFVBQUksQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUMsU0FBUyxFQUFLOzs7QUFHaEQsWUFBSSxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxPQUFPLEVBQUUsS0FBSyxTQUFTLEVBQUU7QUFDdEUsOEJBQW9CLEdBQUcsU0FBUyxDQUFDO0FBQ2pDLGlCQUFPLElBQUksQ0FBQztTQUNiO0FBQ0QsZUFBTyxLQUFLLENBQUM7T0FDZCxDQUFDLENBQUM7O0FBRUgsVUFBSSxDQUFDLG9CQUFvQixFQUFFO0FBQ3pCLDRCQUFvQixHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztPQUMxQzs7QUFFRCxhQUFPLG9CQUFvQixDQUFDO0tBQzdCOzs7V0FFUSxtQkFBQyxZQUFvQixFQUFRO0FBQ3BDLFVBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQ2pCLFlBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7T0FDdkQ7QUFDRCxVQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztLQUNsQzs7O1NBN3hCRyxrQkFBa0I7OztBQWd5QnhCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsa0JBQWtCLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtZmlsZS10cmVlL2xpYi9GaWxlVHJlZUNvbnRyb2xsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge2ZpbGVUeXBlQ2xhc3N9ID0gcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKTtcbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgSW1tdXRhYmxlID0gcmVxdWlyZSgnaW1tdXRhYmxlJyk7XG52YXIgTGF6eUZpbGVUcmVlTm9kZSA9IHJlcXVpcmUoJy4vTGF6eUZpbGVUcmVlTm9kZScpO1xudmFyIHtQYW5lbENvbnRyb2xsZXJ9ID0gcmVxdWlyZSgnbnVjbGlkZS1wYW5lbCcpO1xudmFyIGZzID0gcmVxdWlyZSgnZnMtcGx1cycpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgc2hlbGwgPSByZXF1aXJlKCdzaGVsbCcpO1xudmFyIHt0cmVlTm9kZVRyYXZlcnNhbHMsIFRyZWVSb290Q29tcG9uZW50fSA9IHJlcXVpcmUoJ251Y2xpZGUtdWktdHJlZScpO1xudmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QtZm9yLWF0b20nKTtcblxudmFyIHthZGRvbnN9ID0gUmVhY3Q7XG5cbmFzeW5jIGZ1bmN0aW9uIGZldGNoQ2hpbGRyZW4obm9kZTogTGF6eUZpbGVUcmVlTm9kZSwgY29udHJvbGxlcjogRmlsZVRyZWVDb250cm9sbGVyKTogUHJvbWlzZTxJbW11dGFibGUuTGlzdDxMYXp5RmlsZVRyZWVOb2RlPj4ge1xuICBpZiAoIW5vZGUuaXNDb250YWluZXIoKSkge1xuICAgIHJldHVybiBJbW11dGFibGUuTGlzdC5vZigpO1xuICB9XG5cbiAgdmFyIGRpcmVjdG9yeSA9IG5vZGUuZ2V0SXRlbSgpO1xuICB2YXIgZGlyZWN0b3J5RW50cmllcyA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBkaXJlY3RvcnkuZ2V0RW50cmllcygoZXJyb3IsIGVudHJpZXMpID0+IHtcbiAgICAgIC8vIFJlc29sdmUgdG8gYW4gZW1wdHkgYXJyYXkgaWYgdGhlIGRpcmVjdG9yeSBkZXNvbid0IGV4aXN0LlxuICAgICAgaWYgKGVycm9yICYmIGVycm9yLmNvZGUgIT09ICdFTk9FTlQnKSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKGVudHJpZXMgfHwgW10pO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICB2YXIgZmlsZU5vZGVzID0gW107XG4gIHZhciBkaXJlY3RvcnlOb2RlcyA9IFtdO1xuICBkaXJlY3RvcnlFbnRyaWVzLmZvckVhY2goKGVudHJ5KSA9PiB7XG4gICAgdmFyIGNoaWxkTm9kZSA9IGNvbnRyb2xsZXIuZ2V0Tm9kZUFuZFNldFN0YXRlKGVudHJ5LCAvKiBwYXJlbnQgKi8gbm9kZSk7XG4gICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgIGRpcmVjdG9yeU5vZGVzLnB1c2goY2hpbGROb2RlKTtcbiAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRmlsZSgpKSB7XG4gICAgICBmaWxlTm9kZXMucHVzaChjaGlsZE5vZGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgdmFyIG5ld0NoaWxkcmVuID0gZGlyZWN0b3J5Tm9kZXMuY29uY2F0KGZpbGVOb2Rlcyk7XG5cbiAgdmFyIGNhY2hlZENoaWxkcmVuID0gbm9kZS5nZXRDYWNoZWRDaGlsZHJlbigpO1xuICBpZiAoY2FjaGVkQ2hpbGRyZW4pIHtcbiAgICBjb250cm9sbGVyLmRlc3Ryb3lTdGF0ZUZvck9sZE5vZGVzKGNhY2hlZENoaWxkcmVuLCBuZXdDaGlsZHJlbik7XG4gIH1cblxuICByZXR1cm4gbmV3IEltbXV0YWJsZS5MaXN0KG5ld0NoaWxkcmVuKTtcbn1cblxuZnVuY3Rpb24gbGFiZWxDbGFzc05hbWVGb3JOb2RlKG5vZGU6IExhenlGaWxlVHJlZU5vZGUpIHtcbiAgdmFyIGNsYXNzT2JqOiB7W2NsYXNzTmFtZTogc3RyaW5nXTogYm9vbGVhbn0gPSB7XG4gICAgJ2ljb24nOiB0cnVlLFxuICAgICduYW1lJzogdHJ1ZSxcbiAgfTtcblxuICB2YXIgaWNvbkNsYXNzTmFtZTtcbiAgaWYgKG5vZGUuaXNDb250YWluZXIoKSkge1xuICAgIGljb25DbGFzc05hbWUgPSBub2RlLmlzU3ltbGluaygpXG4gICAgICA/ICdpY29uLWZpbGUtc3ltbGluay1kaXJlY3RvcnknXG4gICAgICA6ICdpY29uLWZpbGUtZGlyZWN0b3J5JztcbiAgfSBlbHNlIGlmIChub2RlLmlzU3ltbGluaygpKSB7XG4gICAgaWNvbkNsYXNzTmFtZSA9ICdpY29uLWZpbGUtc3ltbGluay1maWxlJztcbiAgfSBlbHNlIHtcbiAgICBpY29uQ2xhc3NOYW1lID0gZmlsZVR5cGVDbGFzcyhub2RlLmdldExhYmVsKCkpO1xuICB9XG4gIGNsYXNzT2JqW2ljb25DbGFzc05hbWVdID0gdHJ1ZTtcblxuICByZXR1cm4gYWRkb25zLmNsYXNzU2V0KGNsYXNzT2JqKTtcbn1cblxuZnVuY3Rpb24gcm93Q2xhc3NOYW1lRm9yTm9kZShub2RlOiA/TGF6eUZpbGVUcmVlTm9kZSkge1xuICBpZiAoIW5vZGUpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICB2YXIgdmNzQ2xhc3NOYW1lID0gdmNzQ2xhc3NOYW1lRm9yRW50cnkobm9kZS5nZXRJdGVtKCkpO1xuICByZXR1cm4gYWRkb25zLmNsYXNzU2V0KHtcbiAgICBbdmNzQ2xhc3NOYW1lXTogdmNzQ2xhc3NOYW1lLFxuICB9KTtcbn1cblxuLy8gVE9ETyAodDczMzc2OTUpIE1ha2UgdGhpcyBmdW5jdGlvbiBtb3JlIGVmZmljaWVudC5cbmZ1bmN0aW9uIHZjc0NsYXNzTmFtZUZvckVudHJ5KGVudHJ5OiBhdG9tJEZpbGUgfCBhdG9tJERpcmVjdG9yeSk6IHN0cmluZyB7XG4gIHZhciBwYXRoID0gZW50cnkuZ2V0UGF0aCgpO1xuXG4gIHZhciBjbGFzc05hbWUgPSAnJztcbiAgdmFyIHtyZXBvc2l0b3J5Q29udGFpbnNQYXRofSA9IHJlcXVpcmUoJ251Y2xpZGUtaGctZ2l0LWJyaWRnZScpO1xuICBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKCkuZXZlcnkoZnVuY3Rpb24ocmVwb3NpdG9yeTogP1JlcG9zaXRvcnkpIHtcbiAgICBpZiAoIXJlcG9zaXRvcnkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICghcmVwb3NpdG9yeUNvbnRhaW5zUGF0aChyZXBvc2l0b3J5LCBwYXRoKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHJlcG9zaXRvcnkuaXNQYXRoSWdub3JlZChwYXRoKSkge1xuICAgICAgY2xhc3NOYW1lID0gJ3N0YXR1cy1pZ25vcmVkJztcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc3RhdHVzID0gbnVsbDtcbiAgICBpZiAoZW50cnkuaXNGaWxlKCkpIHtcbiAgICAgIHN0YXR1cyA9IHJlcG9zaXRvcnkuZ2V0Q2FjaGVkUGF0aFN0YXR1cyhwYXRoKTtcbiAgICB9IGVsc2UgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgIHN0YXR1cyA9IHJlcG9zaXRvcnkuZ2V0RGlyZWN0b3J5U3RhdHVzKHBhdGgpO1xuICAgIH1cblxuICAgIGlmIChzdGF0dXMpIHtcbiAgICAgIGlmIChyZXBvc2l0b3J5LmlzU3RhdHVzTmV3KHN0YXR1cykpIHtcbiAgICAgICAgY2xhc3NOYW1lID0gJ3N0YXR1cy1hZGRlZCc7XG4gICAgICB9IGVsc2UgaWYgKHJlcG9zaXRvcnkuaXNTdGF0dXNNb2RpZmllZChzdGF0dXMpKSB7XG4gICAgICAgIGNsYXNzTmFtZSA9ICdzdGF0dXMtbW9kaWZpZWQnO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9LCB0aGlzKTtcbiAgcmV0dXJuIGNsYXNzTmFtZTtcbn1cblxuZnVuY3Rpb24gaXNMb2NhbEZpbGUoZW50cnk6IGF0b20kRmlsZSB8IGF0b20kRGlyZWN0b3J5KTogYm9vbGVhbiB7XG4gIHJldHVybiBlbnRyeS5nZXRMb2NhbFBhdGggPT09IHVuZGVmaW5lZDtcbn1cblxudHlwZSBGaWxlVHJlZUNvbnRyb2xsZXJTdGF0ZSA9IHtcbiAgcGFuZWw6IFBhbmVsQ29udHJvbGxlclN0YXRlO1xuICB0cmVlOiA/VHJlZUNvbXBvbmVudFN0YXRlO1xufTtcblxudHlwZSBOb2RlU3RhdGUgPSB7bm9kZTogTGF6eUZpbGVUcmVlTm9kZTsgc3Vic2NyaXB0aW9uOiA/RGlzcG9zYWJsZX07XG5cbnZhciBGaWxlVHJlZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm51Y2xpZGUtZmlsZS10cmVlXCIgdGFiSW5kZXg9XCItMVwiPlxuICAgICAgICA8VHJlZVJvb3RDb21wb25lbnQgcmVmPVwicm9vdFwiIHsuLi50aGlzLnByb3BzfSAvPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfSxcblxuICBnZXRUcmVlUm9vdCgpOiA/UmVhY3RDb21wb25lbnQge1xuICAgIHJldHVybiB0aGlzLnJlZnMucm9vdDtcbiAgfSxcbn0pO1xuXG5jbGFzcyBGaWxlVHJlZUNvbnRyb2xsZXIge1xuICBfaG9zdEVsZW1lbnQ6ID9FbGVtZW50O1xuICBfa2V5VG9TdGF0ZTogP01hcDxzdHJpbmcsIE5vZGVTdGF0ZT47XG4gIF9wYW5lbENvbnRyb2xsZXI6IFBhbmVsQ29udHJvbGxlcjtcbiAgX3N1YnNjcmlwdGlvbnM6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgY29uc3RydWN0b3Ioc3RhdGU6ID9GaWxlVHJlZUNvbnRyb2xsZXJTdGF0ZSkge1xuICAgIHRoaXMuX2ZldGNoQ2hpbGRyZW5XaXRoQ29udHJvbGxlciA9IChub2RlKSA9PiBmZXRjaENoaWxkcmVuKG5vZGUsIHRoaXMpO1xuXG4gICAgdGhpcy5fa2V5VG9TdGF0ZSA9IG5ldyBNYXAoKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIHRoaXMuX3JlcG9zaXRvcnlTdWJzY3JpcHRpb25zID0gbnVsbDtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKCgpID0+IHtcbiAgICAgIGZvciAodmFyIG5vZGVTdGF0ZSBvZiB0aGlzLl9rZXlUb1N0YXRlLnZhbHVlcygpKSB7XG4gICAgICAgIGlmIChub2RlU3RhdGUuc3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgbm9kZVN0YXRlLnN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuX2tleVRvU3RhdGUgPSBudWxsO1xuICAgIH0pKTtcblxuICAgIHZhciBkaXJlY3RvcmllcyA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpO1xuICAgIHRoaXMuX3Jvb3RzID0gZGlyZWN0b3JpZXMubWFwKFxuICAgICAgICAoZGlyZWN0b3J5KSA9PiB0aGlzLmdldE5vZGVBbmRTZXRTdGF0ZShkaXJlY3RvcnksIC8qIHBhcmVudCAqLyBudWxsKSk7XG5cbiAgICB2YXIgZXZlbnRIYW5kbGVyU2VsZWN0b3IgPSAnLm51Y2xpZGUtZmlsZS10cmVlJztcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29tbWFuZHMuYWRkKFxuICAgICAgICBldmVudEhhbmRsZXJTZWxlY3RvcixcbiAgICAgICAge1xuICAgICAgICAgICdjb3JlOmJhY2tzcGFjZSc6ICgpID0+IHRoaXMuZGVsZXRlU2VsZWN0aW9uKCksXG4gICAgICAgICAgJ2NvcmU6ZGVsZXRlJzogKCkgPT4gdGhpcy5kZWxldGVTZWxlY3Rpb24oKSxcbiAgICAgICAgfSkpO1xuXG4gICAgdmFyIHByb3BzOiB7W2tleTogc3RyaW5nXTogbWl4ZWR9ID0ge1xuICAgICAgaW5pdGlhbFJvb3RzOiB0aGlzLl9yb290cyxcbiAgICAgIGV2ZW50SGFuZGxlclNlbGVjdG9yLFxuICAgICAgb25Db25maXJtU2VsZWN0aW9uOiB0aGlzLm9uQ29uZmlybVNlbGVjdGlvbi5iaW5kKHRoaXMpLFxuICAgICAgb25LZWVwU2VsZWN0aW9uOiB0aGlzLm9uS2VlcFNlbGVjdGlvbi5iaW5kKHRoaXMpLFxuICAgICAgbGFiZWxDbGFzc05hbWVGb3JOb2RlLFxuICAgICAgcm93Q2xhc3NOYW1lRm9yTm9kZSxcbiAgICAgIGVsZW1lbnRUb1JlbmRlcldoZW5FbXB0eTogPGRpdj5ObyBwcm9qZWN0IHJvb3Q8L2Rpdj4sXG4gICAgfTtcbiAgICBpZiAoc3RhdGUgJiYgc3RhdGUudHJlZSkge1xuICAgICAgcHJvcHMuaW5pdGlhbEV4cGFuZGVkTm9kZUtleXMgPSBzdGF0ZS50cmVlLmV4cGFuZGVkTm9kZUtleXM7XG4gICAgICBwcm9wcy5pbml0aWFsU2VsZWN0ZWROb2RlS2V5cyA9IHN0YXRlLnRyZWUuc2VsZWN0ZWROb2RlS2V5cztcbiAgICB9XG4gICAgdGhpcy5fcGFuZWxDb250cm9sbGVyID0gbmV3IFBhbmVsQ29udHJvbGxlcihcbiAgICAgICAgPEZpbGVUcmVlIHsuLi5wcm9wc30gLz4sXG4gICAgICAgIHtkb2NrOiAnbGVmdCd9LFxuICAgICAgICBzdGF0ZSAmJiBzdGF0ZS5wYW5lbCk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICAgZXZlbnRIYW5kbGVyU2VsZWN0b3IsXG4gICAgICAgIHtcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6YWRkLWZpbGUnOiAoKSA9PiB0aGlzLm9wZW5BZGRGaWxlRGlhbG9nKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOmFkZC1mb2xkZXInOiAoKSA9PiB0aGlzLm9wZW5BZGRGb2xkZXJEaWFsb2coKSxcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6ZGVsZXRlLXNlbGVjdGlvbic6ICgpID0+IHRoaXMuZGVsZXRlU2VsZWN0aW9uKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOnJlbmFtZS1zZWxlY3Rpb24nOiAoKSA9PiB0aGlzLm9wZW5SZW5hbWVEaWFsb2coKSxcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6ZHVwbGljYXRlLXNlbGVjdGlvbic6ICgpID0+IHRoaXMub3BlbkR1cGxpY2F0ZURpYWxvZygpLFxuICAgICAgICAgICdudWNsaWRlLWZpbGUtdHJlZTpyZW1vdmUtcHJvamVjdC1mb2xkZXItc2VsZWN0aW9uJzogKCkgPT4gdGhpcy5yZW1vdmVSb290Rm9sZGVyU2VsZWN0aW9uKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOmNvcHktZnVsbC1wYXRoJzogKCkgPT4gdGhpcy5jb3B5RnVsbFBhdGgoKSxcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6c2hvdy1pbi1maWxlLW1hbmFnZXInOiAoKSA9PiB0aGlzLnNob3dJbkZpbGVNYW5hZ2VyKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOnJlbG9hZCc6ICgpID0+IHRoaXMucmVsb2FkKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOnNlYXJjaC1pbi1kaXJlY3RvcnknOiAoKSA9PiB0aGlzLnNlYXJjaEluRGlyZWN0b3J5KCksXG4gICAgICAgIH0pKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMuYWRkKGF0b20ucHJvamVjdC5vbkRpZENoYW5nZVBhdGhzKChwYXRocykgPT4ge1xuICAgICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICAgIGlmICh0cmVlQ29tcG9uZW50KSB7XG4gICAgICAgIHZhciBuZXdSb290cyA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLm1hcChcbiAgICAgICAgICAgIChkaXJlY3RvcnkpID0+IHRoaXMuZ2V0Tm9kZUFuZFNldFN0YXRlKGRpcmVjdG9yeSwgLyogcGFyZW50ICovIG51bGwpKTtcbiAgICAgICAgdGhpcy5kZXN0cm95U3RhdGVGb3JPbGROb2Rlcyh0aGlzLl9yb290cywgbmV3Um9vdHMpO1xuICAgICAgICB0aGlzLl9yb290cyA9IG5ld1Jvb3RzO1xuICAgICAgICB0cmVlQ29tcG9uZW50LnNldFJvb3RzKG5ld1Jvb3RzKTtcblxuICAgICAgICBpZiAodGhpcy5fcmVwb3NpdG9yeVN1YnNjcmlwdGlvbnMpIHtcbiAgICAgICAgICB0aGlzLl9yZXBvc2l0b3J5U3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVwb3NpdG9yeVN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKCkuZm9yRWFjaChmdW5jdGlvbihyZXBvc2l0b3J5OiA/UmVwb3NpdG9yeSkge1xuICAgICAgICAgIGlmIChyZXBvc2l0b3J5KSB7XG4gICAgICAgICAgICB0aGlzLl9yZXBvc2l0b3J5U3Vic2NyaXB0aW9ucy5hZGQocmVwb3NpdG9yeS5vbkRpZENoYW5nZVN0YXR1c2VzKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5mb3JjZVVwZGF0ZSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgaWYgKHJlcG9zaXRvcnkuZ2V0U3RhdHVzZXMpIHtcbiAgICAgICAgICAgICAgLy8gVGhpcyBtZXRob2QgaXMgYXZhaWxhYmxlIG9uIEhnUmVwb3NpdG9yeUNsaWVudC5cbiAgICAgICAgICAgICAgLy8gVGhpcyB3aWxsIHRyaWdnZXIgYSByZXBvc2l0b3J5IDo6b25EaWRDaGFuZ2VTdGF0dXNlcyBldmVudCBpZiB0aGVyZVxuICAgICAgICAgICAgICAvLyBhcmUgbW9kaWZpZWQgZmlsZXMsIGFuZCB0aHVzIHVwZGF0ZSB0aGUgdHJlZSB0byByZWZsZWN0IHRoZVxuICAgICAgICAgICAgICAvLyBjdXJyZW50IHZlcnNpb24gY29udHJvbCBcInN0YXRlXCIgb2YgdGhlIGZpbGVzLlxuICAgICAgICAgICAgICByZXBvc2l0b3J5LmdldFN0YXR1c2VzKFtyZXBvc2l0b3J5LmdldFByb2plY3REaXJlY3RvcnkoKV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5hZGRDb250ZXh0TWVudUl0ZW1Hcm91cChbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnTmV3JyxcbiAgICAgICAgc3VibWVudTogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxhYmVsOiAnRmlsZScsXG4gICAgICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6YWRkLWZpbGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6ICdGb2xkZXInLFxuICAgICAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOmFkZC1mb2xkZXInLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIC8vIFNob3cgJ05ldycgbWVudSBvbmx5IHdoZW4gYSBzaW5nbGUgZGlyZWN0b3J5IGlzIHNlbGVjdGVkIHNvIHRoZVxuICAgICAgICAvLyB0YXJnZXQgaXMgb2J2aW91cyBhbmQgY2FuIGhhbmRsZSBhIFwibmV3XCIgb2JqZWN0LlxuICAgICAgICBzaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcyhub2Rlcykge1xuICAgICAgICAgIHJldHVybiBub2Rlcy5sZW5ndGggPT09IDEgJiZcbiAgICAgICAgICAgIG5vZGVzLmV2ZXJ5KG5vZGUgPT4gbm9kZS5pc0NvbnRhaW5lcigpKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSk7XG4gICAgdGhpcy5hZGRDb250ZXh0TWVudUl0ZW1Hcm91cChbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnQWRkIFByb2plY3QgRm9sZGVyJyxcbiAgICAgICAgY29tbWFuZDogJ2FwcGxpY2F0aW9uOmFkZC1wcm9qZWN0LWZvbGRlcicsXG4gICAgICAgIHNob3VsZERpc3BsYXlJZlRyZWVJc0VtcHR5OiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdBZGQgUmVtb3RlIFByb2plY3QgRm9sZGVyJyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtcmVtb3RlLXByb2plY3RzOmNvbm5lY3QnLFxuICAgICAgICBzaG91bGREaXNwbGF5SWZUcmVlSXNFbXB0eTogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnUmVtb3ZlIFByb2plY3QgRm9sZGVyJyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOnJlbW92ZS1wcm9qZWN0LWZvbGRlci1zZWxlY3Rpb24nLFxuICAgICAgICBzaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcyhub2Rlcykge1xuICAgICAgICAgIHJldHVybiBub2Rlcy5sZW5ndGggPiAwICYmIG5vZGVzLmV2ZXJ5KG5vZGUgPT4gbm9kZS5pc1Jvb3QoKSk7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0pO1xuICAgIHRoaXMuYWRkQ29udGV4dE1lbnVJdGVtR3JvdXAoW1xuICAgICAge1xuICAgICAgICBsYWJlbDogJ1JlbmFtZScsXG4gICAgICAgIGNvbW1hbmQ6ICdudWNsaWRlLWZpbGUtdHJlZTpyZW5hbWUtc2VsZWN0aW9uJyxcbiAgICAgICAgc2hvdWxkRGlzcGxheUZvclNlbGVjdGVkTm9kZXMobm9kZXMpIHtcbiAgICAgICAgICByZXR1cm4gbm9kZXMubGVuZ3RoID09PSAxICYmICFub2Rlc1swXS5pc1Jvb3QoKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnRHVwbGljYXRlJyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOmR1cGxpY2F0ZS1zZWxlY3Rpb24nLFxuICAgICAgICBzaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcyhub2Rlcykge1xuICAgICAgICAgIHJldHVybiBub2Rlcy5sZW5ndGggPT09IDEgJiYgIW5vZGVzWzBdLmdldEl0ZW0oKS5pc0RpcmVjdG9yeSgpO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdEZWxldGUnLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6ZGVsZXRlLXNlbGVjdGlvbicsXG4gICAgICAgIHNob3VsZERpc3BsYXlGb3JTZWxlY3RlZE5vZGVzKG5vZGVzKSB7XG4gICAgICAgICAgcmV0dXJuIG5vZGVzLmxlbmd0aCA+IDAgJiYgIW5vZGVzLnNvbWUobm9kZSA9PiBub2RlLmlzUm9vdCgpKTtcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSk7XG4gICAgdGhpcy5hZGRDb250ZXh0TWVudUl0ZW1Hcm91cChbXG4gICAgICB7XG4gICAgICAgIGxhYmVsOiAnQ29weSBGdWxsIFBhdGgnLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6Y29weS1mdWxsLXBhdGgnLFxuICAgICAgICBzaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcyhub2Rlcykge1xuICAgICAgICAgIHJldHVybiBub2Rlcy5sZW5ndGggPT09IDE7XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBsYWJlbDogJ1Nob3cgaW4gRmluZGVyJyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOnNob3ctaW4tZmlsZS1tYW5hZ2VyJyxcbiAgICAgICAgc2hvdWxkRGlzcGxheUZvclNlbGVjdGVkTm9kZXMobm9kZXMpIHtcbiAgICAgICAgICAvLyBGb3Igbm93LCB0aGlzIG9ubHkgd29ya3MgZm9yIGxvY2FsIGZpbGVzIG9uIE9TIFguXG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIG5vZGVzLmxlbmd0aCA9PT0gMSAmJlxuICAgICAgICAgICAgaXNMb2NhbEZpbGUobm9kZXNbMF0uZ2V0SXRlbSgpKSAmJlxuICAgICAgICAgICAgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbidcbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdTZWFyY2ggaW4gRGlyZWN0b3J5JyxcbiAgICAgICAgY29tbWFuZDogJ251Y2xpZGUtZmlsZS10cmVlOnNlYXJjaC1pbi1kaXJlY3RvcnknLFxuICAgICAgICBzaG91bGREaXNwbGF5Rm9yU2VsZWN0ZWROb2Rlcyhub2Rlcykge1xuICAgICAgICAgIC8vIFRoZXJlIHNob3VsZCBiZSBhdCBsZWFzdCBvbmUgZGlyZWN0b3J5IGluIHRoZSBzZWxlY3Rpb24uXG4gICAgICAgICAgcmV0dXJuIG5vZGVzLnNvbWUobm9kZSA9PiBub2RlLmdldEl0ZW0oKS5pc0RpcmVjdG9yeSgpKTtcbiAgICAgICAgfSxcbiAgICAgIH1cbiAgICBdKTtcbiAgICB0aGlzLmFkZENvbnRleHRNZW51SXRlbUdyb3VwKFtcbiAgICAgIHtcbiAgICAgICAgbGFiZWw6ICdSZWxvYWQnLFxuICAgICAgICBjb21tYW5kOiAnbnVjbGlkZS1maWxlLXRyZWU6cmVsb2FkJyxcbiAgICAgIH0sXG4gICAgXSk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuX3BhbmVsQ29udHJvbGxlci5kZXN0cm95KCk7XG4gICAgdGhpcy5fcGFuZWxDb250cm9sbGVyID0gbnVsbDtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbnVsbDtcbiAgICBpZiAodGhpcy5fcmVwb3NpdG9yeVN1YnNjcmlwdGlvbnMpIHtcbiAgICAgIHRoaXMuX3JlcG9zaXRvcnlTdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX3JlcG9zaXRvcnlTdWJzY3JpcHRpb25zID0gbnVsbDtcbiAgICB9XG4gICAgdGhpcy5fbG9nZ2VyID0gbnVsbDtcbiAgICBpZiAodGhpcy5faG9zdEVsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2hvc3RFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5faG9zdEVsZW1lbnQpO1xuICAgIH1cbiAgICB0aGlzLl9jbG9zZURpYWxvZygpO1xuICB9XG5cbiAgdG9nZ2xlKCk6IHZvaWQge1xuICAgIHRoaXMuX3BhbmVsQ29udHJvbGxlci50b2dnbGUoKTtcbiAgfVxuXG4gIHNldFZpc2libGUoc2hvdWxkQmVWaXNpYmxlOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5fcGFuZWxDb250cm9sbGVyLnNldFZpc2libGUoc2hvdWxkQmVWaXNpYmxlKTtcbiAgfVxuXG4gIHNlcmlhbGl6ZSgpOiBGaWxlVHJlZUNvbnRyb2xsZXJTdGF0ZSB7XG4gICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICB2YXIgdHJlZSA9IHRyZWVDb21wb25lbnQgPyB0cmVlQ29tcG9uZW50LnNlcmlhbGl6ZSgpIDogbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgcGFuZWw6IHRoaXMuX3BhbmVsQ29udHJvbGxlci5zZXJpYWxpemUoKSxcbiAgICAgIHRyZWUsXG4gICAgfTtcbiAgfVxuXG4gIGZvcmNlVXBkYXRlKCk6IHZvaWQge1xuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgaWYgKHRyZWVDb21wb25lbnQpIHtcbiAgICAgIHRyZWVDb21wb25lbnQuZm9yY2VVcGRhdGUoKTtcbiAgICB9XG4gIH1cblxuICBhZGRDb250ZXh0TWVudUl0ZW1Hcm91cChcbiAgICBtZW51SXRlbURlZmluaXRpb25zOiBBcnJheTxUcmVlTWVudUl0ZW1EZWZpbml0aW9uPlxuICApOiB2b2lkIHtcbiAgICB2YXIgdHJlZUNvbXBvbmVudCA9IHRoaXMuZ2V0VHJlZUNvbXBvbmVudCgpO1xuICAgIGlmICh0cmVlQ29tcG9uZW50KSB7XG4gICAgICB0cmVlQ29tcG9uZW50LmFkZENvbnRleHRNZW51SXRlbUdyb3VwKG1lbnVJdGVtRGVmaW5pdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIGdldFRyZWVDb21wb25lbnQoKTogP1RyZWVSb290Q29tcG9uZW50IHtcbiAgICB2YXIgY29tcG9uZW50ID0gdGhpcy5fcGFuZWxDb250cm9sbGVyLmdldENoaWxkQ29tcG9uZW50KCk7XG4gICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQuaGFzT3duUHJvcGVydHkoJ2dldFRyZWVSb290JykpIHtcbiAgICAgIHJldHVybiBjb21wb25lbnQuZ2V0VHJlZVJvb3QoKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY2FjaGVkIG5vZGUgZm9yIGBlbnRyeWAgb3IgY3JlYXRlcyBhIG5ldyBvbmUuIEl0IHNldHMgdGhlIGFwcHJvcHJpYXRlIGJvb2trZWVwaW5nXG4gICAqIHN0YXRlIGlmIGl0IGNyZWF0ZXMgYSBuZXcgbm9kZS5cbiAgICovXG4gIGdldE5vZGVBbmRTZXRTdGF0ZShcbiAgICBlbnRyeTogYXRvbSRGaWxlIHwgYXRvbSREaXJlY3RvcnksXG4gICAgcGFyZW50OiA/TGF6eUZpbGVUcmVlTm9kZVxuICApOiBMYXp5RmlsZVRyZWVOb2RlIHtcbiAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBhIG5vZGUgdG8gZ2V0IHRoZSBwYXRoLCBldmVuIGlmIHdlIGRvbid0IGVuZCB1cCByZXR1cm5pbmcgaXQuXG4gICAgdmFyIG5vZGUgPSBuZXcgTGF6eUZpbGVUcmVlTm9kZShlbnRyeSwgcGFyZW50LCB0aGlzLl9mZXRjaENoaWxkcmVuV2l0aENvbnRyb2xsZXIpO1xuICAgIHZhciBub2RlS2V5ID0gbm9kZS5nZXRLZXkoKTtcblxuICAgIC8vIFJldXNlIGV4aXN0aW5nIG5vZGUgaWYgcG9zc2libGUuIFRoaXMgcHJlc2VydmVzIHRoZSBjYWNoZWQgY2hpbGRyZW4gYW5kIHByZXZlbnRzXG4gICAgLy8gdXMgZnJvbSBjcmVhdGluZyBtdWx0aXBsZSBmaWxlIHdhdGNoZXJzIG9uIHRoZSBzYW1lIGZpbGUuXG4gICAgdmFyIHN0YXRlID0gdGhpcy5nZXRTdGF0ZUZvck5vZGVLZXkobm9kZUtleSk7XG4gICAgaWYgKHN0YXRlKSB7XG4gICAgICByZXR1cm4gc3RhdGUubm9kZTtcbiAgICB9XG5cbiAgICB2YXIgc3Vic2NyaXB0aW9uID0gbnVsbDtcbiAgICBpZiAoZW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gdGhpcyBjYWxsIGZhaWxzIGJlY2F1c2UgaXQgY291bGQgdHJ5IHRvIHdhdGNoIGEgbm9uLWV4aXN0aW5nIGRpcmVjdG9yeSxcbiAgICAgICAgLy8gb3Igd2l0aCBhIHVzZSB0aGF0IGhhcyBubyBwZXJtaXNzaW9uIHRvIGl0LlxuICAgICAgICBzdWJzY3JpcHRpb24gPSBlbnRyeS5vbkRpZENoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgbm9kZS5pbnZhbGlkYXRlQ2FjaGUoKTtcbiAgICAgICAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRoaXMuX2xvZ0Vycm9yKCdudWNsaWRlLWZpbGUtdHJlZTogQ2Fubm90IHN1YnNjcmliZSB0byBhIGRpcmVjdG9yeS4nLCBlbnRyeS5nZXRQYXRoKCksIGVycik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5fc2V0U3RhdGVGb3JOb2RlS2V5KG5vZGVLZXksIHtub2RlLCBzdWJzY3JpcHRpb259KTtcblxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgX3NldFN0YXRlRm9yTm9kZUtleShub2RlS2V5OiBzdHJpbmcsIHN0YXRlOiBOb2RlU3RhdGUpOiB2b2lkIHtcbiAgICB0aGlzLl9kZXN0cm95U3RhdGVGb3JOb2RlS2V5KG5vZGVLZXkpO1xuICAgIHRoaXMuX2tleVRvU3RhdGUuc2V0KG5vZGVLZXksIHN0YXRlKTtcbiAgfVxuXG4gIGdldFN0YXRlRm9yTm9kZUtleShub2RlS2V5OiBzdHJpbmcpOiA/Tm9kZVN0YXRlIHtcbiAgICByZXR1cm4gdGhpcy5fa2V5VG9TdGF0ZS5nZXQobm9kZUtleSk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgc3RhdGVzIGZvciBub2RlcyB0aGF0IGFyZSBpbiBgb2xkTm9kZXNgIGFuZCBub3QgaW4gYG5ld05vZGVzYC5cbiAgICogVGhpcyBpcyB1c2VmdWwgd2hlbiBmZXRjaGluZyBuZXcgY2hpbGRyZW4gLS0gc29tZSBjYWNoZWQgbm9kZXMgY2FuIHN0aWxsXG4gICAqIGJlIHJldXNlZCBhbmQgdGhlIHJlc3QgbXVzdCBiZSBkZXN0cm95ZWQuXG4gICAqL1xuICBkZXN0cm95U3RhdGVGb3JPbGROb2RlcyhvbGROb2RlczogQXJyYXk8TGF6eUZpbGVUcmVlTm9kZT4sIG5ld05vZGVzOiBBcnJheTxMYXp5RmlsZVRyZWVOb2RlPik6IHZvaWQge1xuICAgIHZhciBuZXdOb2Rlc1NldCA9IG5ldyBTZXQobmV3Tm9kZXMpO1xuICAgIG9sZE5vZGVzLmZvckVhY2goKG9sZE5vZGUpID0+IHtcbiAgICAgIGlmICghbmV3Tm9kZXNTZXQuaGFzKG9sZE5vZGUpKSB7XG4gICAgICAgIHRoaXMuX2Rlc3Ryb3lTdGF0ZUZvck5vZGVLZXkob2xkTm9kZS5nZXRLZXkoKSk7XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIF9kZXN0cm95U3RhdGVGb3JOb2RlS2V5KG5vZGVLZXk6IHN0cmluZyk6IHZvaWQge1xuICAgIHZhciBzdGF0ZSA9IHRoaXMuZ2V0U3RhdGVGb3JOb2RlS2V5KG5vZGVLZXkpO1xuICAgIGlmIChzdGF0ZSkge1xuICAgICAgdmFyIHtub2RlfSA9IHN0YXRlO1xuICAgICAgdHJlZU5vZGVUcmF2ZXJzYWxzLmZvckVhY2hDYWNoZWROb2RlKG5vZGUsIChjYWNoZWROb2RlKSA9PiB7XG4gICAgICAgIHZhciBjYWNoZWROb2RlS2V5ID0gY2FjaGVkTm9kZS5nZXRLZXkoKTtcbiAgICAgICAgdmFyIGNhY2hlZFN0YXRlID0gdGhpcy5nZXRTdGF0ZUZvck5vZGVLZXkoY2FjaGVkTm9kZUtleSk7XG4gICAgICAgIGlmIChjYWNoZWRTdGF0ZSkge1xuICAgICAgICAgIGlmIChjYWNoZWRTdGF0ZS5zdWJzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIGNhY2hlZFN0YXRlLnN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuX2tleVRvU3RhdGUuZGVsZXRlKGNhY2hlZE5vZGVLZXkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICAgIGlmICh0cmVlQ29tcG9uZW50KSB7XG4gICAgICAgIHRyZWVDb21wb25lbnQucmVtb3ZlU3RhdGVGb3JTdWJ0cmVlKG5vZGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIG9uQ29uZmlybVNlbGVjdGlvbihub2RlOiBMYXp5RmlsZVRyZWVOb2RlKTogdm9pZCB7XG4gICAgdmFyIGVudHJ5ID0gbm9kZS5nZXRJdGVtKCk7XG4gICAgYXRvbS53b3Jrc3BhY2Uub3BlbihlbnRyeS5nZXRQYXRoKCksIHtcbiAgICAgIGFjdGl2YXRlUGFuZTogIWF0b20uY29uZmlnLmdldCgndGFicy51c2VQcmV2aWV3VGFicycpLFxuICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWUsXG4gICAgfSk7XG4gIH1cblxuICBvbktlZXBTZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgaWYgKCFhdG9tLmNvbmZpZy5nZXQoJ3RhYnMudXNlUHJldmlld1RhYnMnKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhY3RpdmVQYW5lSXRlbSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmVJdGVtKCk7XG4gICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYWN0aXZlUGFuZUl0ZW0pLCAndGFiczprZWVwLXByZXZpZXctdGFiJyk7XG5cbiAgICAvLyBcIkFjdGl2YXRlXCIgdGhlIGFscmVhZHktYWN0aXZlIHBhbmUgdG8gZ2l2ZSBpdCBmb2N1cy5cbiAgICBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKCkuYWN0aXZhdGUoKTtcbiAgfVxuXG4gIHJlbW92ZVJvb3RGb2xkZXJTZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgdmFyIHNlbGVjdGVkSXRlbXMgPSB0aGlzLl9nZXRTZWxlY3RlZEl0ZW1zKCk7XG4gICAgdmFyIHNlbGVjdGVkRmlsZVBhdGhzID0gc2VsZWN0ZWRJdGVtcy5tYXAoKGl0ZW0pID0+IGl0ZW0uZ2V0UGF0aCgpKTtcbiAgICB2YXIgcm9vdFBhdGhzU2V0ID0gbmV3IFNldChhdG9tLnByb2plY3QuZ2V0UGF0aHMoKSk7XG4gICAgc2VsZWN0ZWRGaWxlUGF0aHMuZm9yRWFjaCgoc2VsZWN0ZWRGaWxlUGF0aCkgPT4ge1xuICAgICAgaWYgKHJvb3RQYXRoc1NldC5oYXMoc2VsZWN0ZWRGaWxlUGF0aCkpIHtcbiAgICAgICAgYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgoc2VsZWN0ZWRGaWxlUGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBjb3B5RnVsbFBhdGgoKTogdm9pZCB7XG4gICAgdmFyIHNlbGVjdGVkSXRlbXMgPSB0aGlzLl9nZXRTZWxlY3RlZEl0ZW1zKCk7XG4gICAgaWYgKHNlbGVjdGVkSXRlbXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aGlzLl9sb2dFcnJvcignbnVjbGlkZS1maWxlLXRyZWU6IEV4YWN0bHkgMSBpdGVtIHNob3VsZCBiZSBzZWxlY3RlZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzZWxlY3RlZEl0ZW0gPSBzZWxlY3RlZEl0ZW1zWzBdO1xuICAgIC8vIEZvciByZW1vdGUgZmlsZXMgd2Ugd2FudCB0byBjb3B5IHRoZSBsb2NhbCBwYXRoIGluc3RlYWQgb2YgZnVsbCBwYXRoLlxuICAgIC8vIGkuZSwgXCIvaG9tZS9kaXIvZmlsZVwiIHZzIFwibnVjbGlkZTovaG9zdDpwb3J0L2hvbWUvZGlyL2ZpbGVcIlxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKFxuICAgICAgaXNMb2NhbEZpbGUoc2VsZWN0ZWRJdGVtKVxuICAgICAgICA/IHNlbGVjdGVkSXRlbS5nZXRQYXRoKClcbiAgICAgICAgOiBzZWxlY3RlZEl0ZW0uZ2V0TG9jYWxQYXRoKClcbiAgICApO1xuICB9XG5cbiAgc2hvd0luRmlsZU1hbmFnZXIoKTogdm9pZCB7XG4gICAgdmFyIHNlbGVjdGVkSXRlbXMgPSB0aGlzLl9nZXRTZWxlY3RlZEl0ZW1zKCk7XG4gICAgaWYgKHNlbGVjdGVkSXRlbXMubGVuZ3RoICE9PSAxKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBmaWxlUGF0aCA9IHNlbGVjdGVkSXRlbXNbMF0uZ2V0UGF0aCgpO1xuXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgICB2YXIge2FzeW5jRXhlY3V0ZX0gPSByZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKTtcbiAgICAgIGFzeW5jRXhlY3V0ZSgnb3BlbicsIFsnLVInLCBmaWxlUGF0aF0sIC8qIG9wdGlvbnMgKi8ge30pO1xuICAgIH1cbiAgfVxuXG4gIHNlYXJjaEluRGlyZWN0b3J5KCk6IHZvaWQge1xuICAgIC8vIERpc3BhdGNoIGEgY29tbWFuZCB0byBzaG93IHRoZSBgUHJvamVjdEZpbmRWaWV3YC4gVGhpcyBvcGVucyB0aGUgdmlldyBhbmRcbiAgICAvLyBmb2N1c2VzIHRoZSBzZWFyY2ggYm94LlxuICAgIHZhciB3b3Jrc3BhY2VFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKTtcbiAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKHdvcmtzcGFjZUVsZW1lbnQsICdwcm9qZWN0LWZpbmQ6c2hvdycpO1xuXG4gICAgLy8gU2luY2UgdGhlIFByb2plY3RGaW5kVmlldyBpcyBub3QgYWN0dWFsbHkgY3JlYXRlZCB1bnRpbCB0aGUgZmlyc3QgY29tbWFuZCBpc1xuICAgIC8vIGRpc3BhdGNoZWQsIHdlIGRlbGF5IHRoZSBwcmUtZmlsbGluZyB0byB0aGUgc3RhcnQgb2YgdGhlIG5leHQgZXZlbnQgcXVldWUuXG4gICAgc2V0SW1tZWRpYXRlKCgpID0+IHtcbiAgICAgIC8vIEZpbmQgcGFuZWxzIHRoYXQgbWF0Y2ggdGhlIHNpZ25hdHVyZSBvZiBhIGBQcm9qZWN0RmluZFZpZXdgLlxuICAgICAgdmFyIGZpbmRJblByb2plY3RQYW5lbHMgPSBhdG9tLndvcmtzcGFjZS5nZXRCb3R0b21QYW5lbHMoKS5maWx0ZXIoXG4gICAgICAgIHBhbmVsID0+IHBhbmVsLmdldEl0ZW0oKS5wYXRoc0VkaXRvcik7XG4gICAgICBpZiAoZmluZEluUHJvamVjdFBhbmVscy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgbm9uLWRpcmVjdG9yeSBzZWxlY3Rpb25zLlxuICAgICAgdmFyIHNlbGVjdGVkRGlycyA9IHRoaXMuX2dldFNlbGVjdGVkSXRlbXMoKS5maWx0ZXIoaXRlbSA9PiBpdGVtLmlzRGlyZWN0b3J5KCkpO1xuXG4gICAgICAvLyBGb3IgZWFjaCBzZWxlY3RlZCBkaXJlY3RvcnksIGdldCB0aGUgcGF0aCByZWxhdGl2ZSB0byB0aGUgcHJvamVjdCByb290LlxuICAgICAgdmFyIHBhdGhzID0gW107XG4gICAgICBzZWxlY3RlZERpcnMuZm9yRWFjaChpdGVtID0+IHtcbiAgICAgICAgZm9yICh2YXIgcm9vdCBvZiBhdG9tLnByb2plY3QuZ2V0RGlyZWN0b3JpZXMoKSkge1xuICAgICAgICAgIC8vIFRoZSBzZWxlY3RlZCBkaXJlY3RvcnkgaXMgYSBzdWJkaXJlY3Rvcnkgb2YgdGhpcyBwcm9qZWN0LlxuICAgICAgICAgIGlmIChyb290LmNvbnRhaW5zKGl0ZW0uZ2V0UGF0aCgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGhzLnB1c2gocm9vdC5yZWxhdGl2aXplKGl0ZW0uZ2V0UGF0aCgpKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEVkZ2UgY2FzZSB3aGVyZSB0aGUgdXNlciBjbGlja3Mgb24gdGhlIHRvcC1sZXZlbCBkaXJlY3RvcnkuXG4gICAgICAgICAgaWYgKHJvb3QuZ2V0UGF0aCgpID09PSBpdGVtLmdldFBhdGgoKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVuYWJsZSB0byBzZWFyY2ggaW4gdGhpcyBwYXRoLlxuICAgICAgICB2YXIgbXNnID0gYFRoZSBzZWxlY3RlZCBkaXJlY3RvcnkgJHtpdGVtLmdldFBhdGgoKX0gZG9lcyBub3QgYCArXG4gICAgICAgICAgYGFwcGVhciB0byBiZSB1bmRlciBhbnkgb2YgdGhlIHByb2plY3Qgcm9vdHM6ICR7YXRvbS5wcm9qZWN0LmdldFBhdGhzKCl9LmA7XG4gICAgICAgIHRoaXMuX2xvZ0Vycm9yKG1zZywgbmV3IEVycm9yKG1zZykpO1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkRXJyb3IobXNnLCB7ZGlzbWlzc2FibGU6IHRydWV9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBVcGRhdGUgdGhlIHRleHQgZmllbGQgaW4gdGhlIGBQcm9qZWN0RmluZFZpZXdgLlxuICAgICAgZmluZEluUHJvamVjdFBhbmVsc1swXS5nZXRJdGVtKCkucGF0aHNFZGl0b3Iuc2V0VGV4dChwYXRocy5qb2luKCcsICcpKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHJldmVhbEFjdGl2ZUZpbGUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdmFyIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICBpZiAoIWVkaXRvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgaWYgKHRyZWVDb21wb25lbnQpIHtcbiAgICAgIHZhciB7ZmlsZX0gPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICBpZiAoZmlsZSkge1xuICAgICAgICB2YXIge2ZpbmR9ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJykuYXJyYXk7XG4gICAgICAgIHZhciBmaWxlUGF0aCA9IGZpbGUuZ2V0UGF0aCgpO1xuICAgICAgICB2YXIgcm9vdERpcmVjdG9yeSA9IGZpbmQoYXRvbS5wcm9qZWN0LmdldERpcmVjdG9yaWVzKCksIGRpcmVjdG9yeSA9PiBkaXJlY3RvcnkuY29udGFpbnMoZmlsZVBhdGgpKTtcbiAgICAgICAgaWYgKHJvb3REaXJlY3RvcnkpIHtcbiAgICAgICAgICAvLyBBY2N1bXVsYXRlIGFsbCB0aGUgYW5jZXN0b3Iga2V5cyBmcm9tIHRoZSBmaWxlIHVwIHRvIHRoZSByb290LlxuICAgICAgICAgIHZhciBkaXJlY3RvcnkgPSBmaWxlLmdldFBhcmVudCgpO1xuICAgICAgICAgIHZhciBhbmNlc3RvcktleXMgPSBbXTtcbiAgICAgICAgICB3aGlsZSAocm9vdERpcmVjdG9yeS5nZXRQYXRoKCkgIT09IGRpcmVjdG9yeS5nZXRQYXRoKCkpIHtcbiAgICAgICAgICAgIGFuY2VzdG9yS2V5cy5wdXNoKG5ldyBMYXp5RmlsZVRyZWVOb2RlKGRpcmVjdG9yeSkuZ2V0S2V5KCkpO1xuICAgICAgICAgICAgZGlyZWN0b3J5ID0gZGlyZWN0b3J5LmdldFBhcmVudCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhbmNlc3RvcktleXMucHVzaChuZXcgTGF6eUZpbGVUcmVlTm9kZShyb290RGlyZWN0b3J5KS5nZXRLZXkoKSk7XG5cbiAgICAgICAgICAvLyBFeHBhbmQgZWFjaCBub2RlIGZyb20gdGhlIHJvb3QgZG93biB0byB0aGUgZmlsZS5cbiAgICAgICAgICBmb3IgKHZhciBub2RlS2V5IG9mIGFuY2VzdG9yS2V5cy5yZXZlcnNlKCkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIC8vIFNlbGVjdCB0aGUgbm9kZSB0byBlbnN1cmUgaXQncyB2aXNpYmxlLlxuICAgICAgICAgICAgICBhd2FpdCB0cmVlQ29tcG9uZW50LnNlbGVjdE5vZGVLZXkobm9kZUtleSk7XG4gICAgICAgICAgICAgIGF3YWl0IHRyZWVDb21wb25lbnQuZXhwYW5kTm9kZUtleShub2RlS2V5KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIC8vIElmIHRoZSBub2RlIGlzbid0IGluIHRoZSB0cmVlLCBpdHMgZGVzY2VuZGFudHMgYXJlbid0IGVpdGhlci5cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCB0cmVlQ29tcG9uZW50LnNlbGVjdE5vZGVLZXkobmV3IExhenlGaWxlVHJlZU5vZGUoZmlsZSkuZ2V0S2V5KCkpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBJdCdzIG9rIGlmIHRoZSBub2RlIGlzbid0IGluIHRoZSB0cmVlLCBzbyB3ZSBjYW4gaWdub3JlIHRoZSBlcnJvci5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zZXRWaXNpYmxlKHRydWUpO1xuICB9XG5cbiAgZGVsZXRlU2VsZWN0aW9uKCkge1xuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgaWYgKCF0cmVlQ29tcG9uZW50KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIHNlbGVjdGVkTm9kZXMgPSB0cmVlQ29tcG9uZW50LmdldFNlbGVjdGVkTm9kZXMoKTtcbiAgICBpZiAoc2VsZWN0ZWROb2Rlcy5sZW5ndGggPT09IDAgfHwgc2VsZWN0ZWROb2Rlcy5zb21lKG5vZGUgPT4gbm9kZS5pc1Jvb3QoKSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHNlbGVjdGVkSXRlbXMgPSBzZWxlY3RlZE5vZGVzLm1hcChub2RlID0+IG5vZGUuZ2V0SXRlbSgpKTtcblxuICAgIHZhciBzZWxlY3RlZFBhdGhzID0gc2VsZWN0ZWRJdGVtcy5tYXAoZW50cnkgPT4gZW50cnkuZ2V0UGF0aCgpKTtcbiAgICB2YXIgbWVzc2FnZSA9ICdBcmUgeW91IHN1cmUgeW91IHdhbnQgdG8gZGVsZXRlIHRoZSBzZWxlY3RlZCAnICtcbiAgICAgICAgKHNlbGVjdGVkSXRlbXMubGVuZ3RoID4gMSA/ICdpdGVtcycgOiAnaXRlbScpO1xuICAgIGF0b20uY29uZmlybSh7XG4gICAgICBtZXNzYWdlLFxuICAgICAgZGV0YWlsZWRNZXNzYWdlOiAnWW91IGFyZSBkZWxldGluZzpcXG4nICsgc2VsZWN0ZWRQYXRocy5qb2luKCdcXG4nKSxcbiAgICAgIGJ1dHRvbnM6IHtcbiAgICAgICAgJ0RlbGV0ZSc6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICB2YXIgZGVsZXRlUHJvbWlzZXMgPSBbXTtcbiAgICAgICAgICBzZWxlY3RlZEl0ZW1zLmZvckVhY2goKGVudHJ5LCBpKSA9PiB7XG4gICAgICAgICAgICB2YXIgZW50cnlQYXRoID0gc2VsZWN0ZWRQYXRoc1tpXTtcbiAgICAgICAgICAgIGlmIChlbnRyeVBhdGguc3RhcnRzV2l0aCgnbnVjbGlkZTovJykpIHtcbiAgICAgICAgICAgICAgZGVsZXRlUHJvbWlzZXMucHVzaChlbnRyeS5kZWxldGUoKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBUT0RPKGpqaWFhKTogVGhpcyBzcGVjaWFsLWNhc2UgY2FuIGJlIGVsaW1pbmF0ZWQgb25jZSBgZGVsZXRlKClgXG4gICAgICAgICAgICAgIC8vIGlzIGFkZGVkIHRvIGBEaXJlY3RvcnlgIGFuZCBgRmlsZWAuXG4gICAgICAgICAgICAgIHNoZWxsLm1vdmVJdGVtVG9UcmFzaChlbnRyeVBhdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoZGVsZXRlUHJvbWlzZXMpO1xuICAgICAgICAgIHZhciBwYXJlbnREaXJlY3RvcmllcyA9IG5ldyBTZXQoc2VsZWN0ZWRJdGVtcy5tYXAoKGVudHJ5KSA9PiBlbnRyeS5nZXRQYXJlbnQoKSkpO1xuICAgICAgICAgIHBhcmVudERpcmVjdG9yaWVzLmZvckVhY2goKGRpcmVjdG9yeSkgPT4gdGhpcy5fcmVsb2FkRGlyZWN0b3J5KGRpcmVjdG9yeSkpO1xuICAgICAgICB9LFxuICAgICAgICAnQ2FuY2VsJzogbnVsbCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICByZWxvYWQoKSB7XG4gICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICBpZiAoIXRyZWVDb21wb25lbnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJlZUNvbXBvbmVudC5pbnZhbGlkYXRlQ2FjaGVkTm9kZXMoKTtcbiAgICB0cmVlQ29tcG9uZW50LmZvcmNlVXBkYXRlKCk7XG4gIH1cblxuICBfZ2V0U2VsZWN0ZWRJdGVtcygpOiBBcnJheTxMYXp5RmlsZVRyZWVOb2RlPiB7XG4gICAgdmFyIHRyZWVDb21wb25lbnQgPSB0aGlzLmdldFRyZWVDb21wb25lbnQoKTtcbiAgICBpZiAoIXRyZWVDb21wb25lbnQpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICB2YXIgc2VsZWN0ZWROb2RlcyA9IHRyZWVDb21wb25lbnQuZ2V0U2VsZWN0ZWROb2RlcygpO1xuICAgIHJldHVybiBzZWxlY3RlZE5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5nZXRJdGVtKCkpO1xuICB9XG5cbiAgb3BlbkFkZEZpbGVEaWFsb2coKTogdm9pZCB7XG4gICAgdGhpcy5fb3BlbkFkZERpYWxvZygnZmlsZScsIGFzeW5jIChyb290RGlyZWN0b3J5OiBEaXJlY3RvcnksIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICAgIC8vIE5vdGU6IHRoaXMgd2lsbCB0aHJvdyBpZiB0aGUgcmVzdWx0aW5nIHBhdGggbWF0Y2hlcyB0aGF0IG9mIGFuIGV4aXN0aW5nXG4gICAgICAvLyBsb2NhbCBkaXJlY3RvcnkuXG4gICAgICB2YXIgbmV3RmlsZSA9IHJvb3REaXJlY3RvcnkuZ2V0RmlsZShmaWxlUGF0aCk7XG4gICAgICBhd2FpdCBuZXdGaWxlLmNyZWF0ZSgpO1xuICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihuZXdGaWxlLmdldFBhdGgoKSk7XG4gICAgICB0aGlzLl9yZWxvYWREaXJlY3RvcnkobmV3RmlsZS5nZXRQYXJlbnQoKSk7XG4gICAgfSk7XG4gIH1cblxuICBvcGVuQWRkRm9sZGVyRGlhbG9nKCk6IHZvaWQge1xuICAgIHRoaXMuX29wZW5BZGREaWFsb2coJ2ZvbGRlcicsIGFzeW5jIChyb290RGlyZWN0b3J5OiBEaXJlY3RvcnksIGRpcmVjdG9yeVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgdmFyIG5ld0RpcmVjdG9yeSA9IHJvb3REaXJlY3RvcnkuZ2V0U3ViZGlyZWN0b3J5KGRpcmVjdG9yeVBhdGgpO1xuICAgICAgYXdhaXQgbmV3RGlyZWN0b3J5LmNyZWF0ZSgpO1xuICAgICAgdGhpcy5fcmVsb2FkRGlyZWN0b3J5KG5ld0RpcmVjdG9yeS5nZXRQYXJlbnQoKSk7XG4gICAgfSk7XG4gIH1cblxuICBfcmVsb2FkRGlyZWN0b3J5KGRpcmVjdG9yeTogYXRvbSREaXJlY3RvcnkpOiB2b2lkIHtcbiAgICB2YXIgZGlyZWN0b3J5Tm9kZSA9IHRoaXMuZ2V0VHJlZUNvbXBvbmVudCgpLmdldE5vZGVGb3JLZXkobmV3IExhenlGaWxlVHJlZU5vZGUoZGlyZWN0b3J5KS5nZXRLZXkoKSk7XG4gICAgZGlyZWN0b3J5Tm9kZS5pbnZhbGlkYXRlQ2FjaGUoKTtcbiAgICB0aGlzLmZvcmNlVXBkYXRlKCk7XG4gIH1cblxuICBfb3BlbkFkZERpYWxvZyhcbiAgICAgIGVudHJ5VHlwZTogc3RyaW5nLFxuICAgICAgb25Db25maXJtOiAocm9vdERpcmVjdG9yeTogYXRvbSREaXJlY3RvcnksIGZpbGVQYXRoOiBzdHJpbmcpID0+IFByb21pc2U8dm9pZD4pIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gdGhpcy5fZ2V0U2VsZWN0ZWRFbnRyeUFuZERpcmVjdG9yeUFuZFJvb3QoKTtcbiAgICBpZiAoIXNlbGVjdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbWVzc2FnZSA9IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXY+RW50ZXIgdGhlIHBhdGggZm9yIHRoZSBuZXcge2VudHJ5VHlwZX0gaW4gdGhlIHJvb3Q6PC9kaXY+XG4gICAgICAgIDxkaXY+e3BhdGgubm9ybWFsaXplKHNlbGVjdGlvbi5yb290LmdldFBhdGgoKSArICcvJyl9PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuXG4gICAgdmFyIHByb3BzID0ge1xuICAgICAgcm9vdERpcmVjdG9yeTogc2VsZWN0aW9uLnJvb3QsXG4gICAgICBpbml0aWFsRW50cnk6IHNlbGVjdGlvbi5kaXJlY3RvcnksXG4gICAgICBpbml0aWFsRGlyZWN0b3J5UGF0aDogc2VsZWN0aW9uLmVudHJ5LmdldFBhdGgoKSxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBvbkNvbmZpcm0sXG4gICAgICBvbkNsb3NlOiB0aGlzLl9jbG9zZURpYWxvZy5iaW5kKHRoaXMpLFxuICAgIH07XG4gICAgdGhpcy5fb3BlbkRpYWxvZyhwcm9wcyk7XG4gIH1cblxuICBvcGVuUmVuYW1lRGlhbG9nKCk6IHZvaWQge1xuICAgIHZhciBzZWxlY3Rpb24gPSB0aGlzLl9nZXRTZWxlY3RlZEVudHJ5QW5kRGlyZWN0b3J5QW5kUm9vdCgpO1xuICAgIGlmICghc2VsZWN0aW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGVudHJ5VHlwZSA9IHNlbGVjdGlvbi5lbnRyeS5pc0ZpbGUoKSA/ICdmaWxlJyA6ICdmb2xkZXInO1xuICAgIHZhciBtZXNzYWdlID0gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdj5FbnRlciB0aGUgbmV3IHBhdGggZm9yIHRoZSB7ZW50cnlUeXBlfSBpbiB0aGUgcm9vdDo8L2Rpdj5cbiAgICAgICAgPGRpdj57cGF0aC5ub3JtYWxpemUoc2VsZWN0aW9uLnJvb3QuZ2V0UGF0aCgpICsgJy8nKX08L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG5cbiAgICB2YXIge2VudHJ5LCByb290fSA9IHNlbGVjdGlvbjtcblxuICAgIHZhciBwcm9wcyA9IHtcbiAgICAgIHJvb3REaXJlY3Rvcnk6IHJvb3QsXG4gICAgICBpbml0aWFsRW50cnk6IGVudHJ5LFxuICAgICAgbWVzc2FnZSxcbiAgICAgIG9uQ29uZmlybTogYXN5bmMgKHJvb3REaXJlY3RvcnksIHJlbGF0aXZlRmlsZVBhdGgpID0+IHtcbiAgICAgICAgaWYgKGlzTG9jYWxGaWxlKGVudHJ5KSkge1xuICAgICAgICAgIC8vIFRPRE8oamppYWEpOiBUaGlzIHNwZWNpYWwtY2FzZSBjYW4gYmUgZWxpbWluYXRlZCBvbmNlIGBkZWxldGUoKWBcbiAgICAgICAgICAvLyBpcyBhZGRlZCB0byBgRGlyZWN0b3J5YCBhbmQgYEZpbGVgLlxuICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGZzLm1vdmUoXG4gICAgICAgICAgICAgICAgZW50cnkuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICAgIC8vIFVzZSBgcmVzb2x2ZWAgdG8gc3RyaXAgdHJhaWxpbmcgc2xhc2hlcyBiZWNhdXNlIHJlbmFtaW5nIGFcbiAgICAgICAgICAgICAgICAvLyBmaWxlIHRvIGEgbmFtZSB3aXRoIGEgdHJhaWxpbmcgc2xhc2ggaXMgYW4gZXJyb3IuXG4gICAgICAgICAgICAgICAgcGF0aC5yZXNvbHZlKFxuICAgICAgICAgICAgICAgICAgcGF0aC5qb2luKHJvb3REaXJlY3RvcnkuZ2V0UGF0aCgpLCByZWxhdGl2ZUZpbGVQYXRoKVxuICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgZXJyb3IgPT4gZXJyb3IgPyByZWplY3QoZXJyb3IpIDogcmVzb2x2ZSgpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhd2FpdCBlbnRyeS5yZW5hbWUocGF0aC5qb2luKHJvb3REaXJlY3RvcnkuZ2V0TG9jYWxQYXRoKCksIHJlbGF0aXZlRmlsZVBhdGgpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZWxvYWREaXJlY3RvcnkoZW50cnkuZ2V0UGFyZW50KCkpO1xuICAgICAgfSxcbiAgICAgIG9uQ2xvc2U6ICgpID0+IHRoaXMuX2Nsb3NlRGlhbG9nKCksXG4gICAgICBzaG91bGRTZWxlY3RCYXNlbmFtZTogdHJ1ZSxcbiAgICB9O1xuICAgIHRoaXMuX29wZW5EaWFsb2cocHJvcHMpO1xuICB9XG5cbiAgb3BlbkR1cGxpY2F0ZURpYWxvZygpOiB2b2lkIHtcbiAgICB2YXIgc2VsZWN0aW9uID0gdGhpcy5fZ2V0U2VsZWN0ZWRFbnRyeUFuZERpcmVjdG9yeUFuZFJvb3QoKTtcbiAgICB2YXIgc2VsZWN0ZWRJdGVtcyA9IHRoaXMuX2dldFNlbGVjdGVkSXRlbXMoKTtcbiAgICBpZiAoIXNlbGVjdGlvbiB8fCBzZWxlY3RlZEl0ZW1zLmxlbmd0aCA+IDEgfHwgc2VsZWN0aW9uLmVudHJ5LmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgbWVzc2FnZSA9IChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXY+RW50ZXIgdGhlIG5ldyBuYW1lIGZvciB0aGUgZmlsZSBpbiB0aGUgcm9vdDo8L2Rpdj5cbiAgICAgICAgPGRpdj57cGF0aC5ub3JtYWxpemUoc2VsZWN0aW9uLnJvb3QuZ2V0UGF0aCgpICsgJy8nKX08L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG5cbiAgICB2YXIge2VudHJ5LCByb290fSA9IHNlbGVjdGlvbjtcbiAgICB2YXIgcGF0aE9iamVjdCA9IHBhdGgucGFyc2Uocm9vdC5yZWxhdGl2aXplKGVudHJ5LmdldFBhdGgoKSkpO1xuXG4gICAgLy8gZW50cnkuZ2V0QmFzZU5hbWUoKSArIF9jb3B5IGUuZyBGaWxlVHJlZUNvbnRyb2xsZXJfY29weS5qc1xuICAgIHZhciBuZXdFbnRyeVBhdGggPSBwYXRoLmZvcm1hdCh7Li4ucGF0aE9iamVjdCwgYmFzZTogYCR7cGF0aE9iamVjdC5uYW1lfV9jb3B5JHtwYXRoT2JqZWN0LmV4dH1gfSk7XG4gICAgdmFyIHByb3BzID0ge1xuICAgICAgcm9vdERpcmVjdG9yeTogcm9vdCxcbiAgICAgIGluaXRpYWxFbnRyeTogcm9vdC5nZXRGaWxlKG5ld0VudHJ5UGF0aCksXG4gICAgICBtZXNzYWdlLFxuICAgICAgb25Db25maXJtOiBhc3luYyAocm9vdERpcmVjdG9yeSwgcmVsYXRpdmVGaWxlUGF0aCkgPT4ge1xuICAgICAgICB2YXIgdHJlZUNvbXBvbmVudCA9IHRoaXMuZ2V0VHJlZUNvbXBvbmVudCgpO1xuICAgICAgICB2YXIgZmlsZSA9IHJvb3REaXJlY3RvcnkuZ2V0RmlsZShyZWxhdGl2ZUZpbGVQYXRoKTtcbiAgICAgICAgdmFyIGNyZWF0ZWRTdWNjZXNzZnVsbHkgPSBhd2FpdCBmaWxlLmNyZWF0ZSgpO1xuICAgICAgICBpZiAoY3JlYXRlZFN1Y2Nlc3NmdWxseSkge1xuICAgICAgICAgIGF3YWl0IGVudHJ5LnJlYWQoKS50aGVuKHRleHQgPT4gZmlsZS53cml0ZSh0ZXh0KSk7XG4gICAgICAgICAgdGhpcy5fcmVsb2FkRGlyZWN0b3J5KGVudHJ5LmdldFBhcmVudCgpKTtcbiAgICAgICAgICBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKGZpbGUuZ2V0UGF0aCgpKTtcbiAgICAgICAgICBpZiAodHJlZUNvbXBvbmVudCkge1xuICAgICAgICAgICAgLy8gVE9ETzogVGhpcyBjYW5ub3QgcmVsaWFibHkga25vdyB3aGVuIHRoZSBmaWxlIHRyZWUgaGFzIHJlLXJlbmRlcmVkIHdpdGggdGhpcyBuZXdcbiAgICAgICAgICAgIC8vIGNoaWxkIGdpdmVuIHRoZSBmaWxlIHRyZWUncyBpbXBsZW1lbnRhdGlvbiwgYW5kIHNvIHRoaXMgY2FuIHJlc3VsdCBpbiBhIHByb21pc2VcbiAgICAgICAgICAgIC8vIHJlamVjdGlvbiBiZWNhdXNlIGl0IHRyaWVzIHRvIHNlbGVjdCBhIG5vZGUgdGhhdCBkb2VzIG5vdCB5ZXQgZXhpc3QuXG4gICAgICAgICAgICB0cmVlQ29tcG9uZW50LnNlbGVjdE5vZGVLZXkobmV3IExhenlGaWxlVHJlZU5vZGUoZmlsZSkuZ2V0S2V5KCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcbiAgICAgICAgICAgICdGYWlsZWQgdG8gZHVwbGljYXRlIGZpbGUnLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgZGV0YWlsOiBgVGhlcmUgd2FzIGEgcHJvYmxlbSBkdXBsaWNhdGluZyB0aGUgZmlsZS4gUGxlYXNlIGNoZWNrIGlmIHRoZSBmaWxlIFwiJHtmaWxlLmdldEJhc2VOYW1lKCl9XCIgYWxyZWFkeSBleGlzdHMuYFxuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBvbkNsb3NlOiAoKSA9PiB0aGlzLl9jbG9zZURpYWxvZygpLFxuICAgICAgc2hvdWxkU2VsZWN0QmFzZW5hbWU6IHRydWUsXG4gICAgfTtcbiAgICB0aGlzLl9vcGVuRGlhbG9nKHByb3BzKTtcbiAgfVxuXG4gIF9vcGVuRGlhbG9nKHByb3BzOiBPYmplY3QpOiB2b2lkIHtcbiAgICB2YXIgRmlsZURpYWxvZ0NvbXBvbmVudCA9IHJlcXVpcmUoJy4vRmlsZURpYWxvZ0NvbXBvbmVudCcpO1xuICAgIHRoaXMuX2Nsb3NlRGlhbG9nKCk7XG5cbiAgICB0aGlzLl9ob3N0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHZhciB3b3Jrc3BhY2VFbCA9IGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSk7XG4gICAgd29ya3NwYWNlRWwuYXBwZW5kQ2hpbGQodGhpcy5faG9zdEVsZW1lbnQpO1xuICAgIHRoaXMuX2RpYWxvZ0NvbXBvbmVudCA9IFJlYWN0LnJlbmRlcig8RmlsZURpYWxvZ0NvbXBvbmVudCB7Li4ucHJvcHN9IC8+LCB0aGlzLl9ob3N0RWxlbWVudCk7XG4gIH1cblxuICBfY2xvc2VEaWFsb2coKSB7XG4gICAgaWYgKHRoaXMuX2RpYWxvZ0NvbXBvbmVudCAmJiB0aGlzLl9kaWFsb2dDb21wb25lbnQuaXNNb3VudGVkKCkpIHtcbiAgICAgIFJlYWN0LnVubW91bnRDb21wb25lbnRBdE5vZGUodGhpcy5faG9zdEVsZW1lbnQpO1xuICAgICAgdGhpcy5fZGlhbG9nQ29tcG9uZW50ID0gbnVsbDtcbiAgICAgIGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkucmVtb3ZlQ2hpbGQodGhpcy5faG9zdEVsZW1lbnQpO1xuICAgICAgdGhpcy5faG9zdEVsZW1lbnQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcbiAgICogLSBlbnRyeTogVGhlIHNlbGVjdGVkIGZpbGUgb3IgZGlyZWN0b3J5LlxuICAgKiAtIGRpcmVjdG9yeTogVGhlIHNlbGVjdGVkIGRpcmVjdG9yeSBvciBpdHMgcGFyZW50IGlmIHRoZSBzZWxlY3Rpb24gaXMgYSBmaWxlLlxuICAgKiAtIHJvb3Q6IFRoZSByb290IGRpcmVjdG9yeSBjb250YWluaW5nIHRoZSBzZWxlY3RlZCBlbnRyeS5cbiAgICpcbiAgICogVGhlIGVudHJ5IGRlZmF1bHRzIHRvIHRoZSBmaXJzdCByb290IGRpcmVjdG9yeSBpZiBub3RoaW5nIGlzIHNlbGVjdGVkLlxuICAgKiBSZXR1cm5zIG51bGwgaWYgc29tZSBvZiB0aGUgcmV0dXJuZWQgcHJvcGVydGllcyBjYW4ndCBiZSBwb3B1bGF0ZWQuXG4gICAqXG4gICAqIFRoaXMgaXMgdXNlZnVsIGZvciBwb3B1bGF0aW5nIHRoZSBmaWxlIGRpYWxvZ3MuXG4gICAqL1xuICBfZ2V0U2VsZWN0ZWRFbnRyeUFuZERpcmVjdG9yeUFuZFJvb3QoXG4gICk6ID97XG4gICAgZW50cnk6IGF0b20kRmlsZSB8IGF0b20kRGlyZWN0b3J5O1xuICAgIGRpcmVjdG9yeTogYXRvbSREaXJlY3Rvcnk7XG4gICAgcm9vdDogP2F0b20kRGlyZWN0b3J5XG4gIH0ge1xuICAgIHZhciB0cmVlQ29tcG9uZW50ID0gdGhpcy5nZXRUcmVlQ29tcG9uZW50KCk7XG4gICAgaWYgKCF0cmVlQ29tcG9uZW50KSB7XG4gICAgICB0aGlzLl9sb2dFcnJvcignbnVjbGlkZS1maWxlLXRyZWU6IENhbm5vdCBnZXQgdGhlIGRpcmVjdG9yeSBmb3IgdGhlIHNlbGVjdGlvbiBiZWNhdXNlIG5vIGZpbGUgdHJlZSBleGlzdHMuJyk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZW50cnkgPSBudWxsO1xuICAgIHZhciBzZWxlY3RlZE5vZGVzID0gdHJlZUNvbXBvbmVudC5nZXRTZWxlY3RlZE5vZGVzKCk7XG4gICAgaWYgKHNlbGVjdGVkTm9kZXMubGVuZ3RoID4gMCkge1xuICAgICAgZW50cnkgPSBzZWxlY3RlZE5vZGVzWzBdLmdldEl0ZW0oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHJvb3REaXJlY3RvcmllcyA9IGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpO1xuICAgICAgaWYgKHJvb3REaXJlY3Rvcmllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGVudHJ5ID0gcm9vdERpcmVjdG9yaWVzWzBdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2Ugc2hvdWxkbid0IGJlIGFibGUgdG8gcmVhY2ggdGhpcyBlcnJvciBiZWNhdXNlIGl0IHNob3VsZCBvbmx5IGJlXG4gICAgICAgIC8vIGFjY2Vzc2libGUgZnJvbSBhIGNvbnRleHQgbWVudS4gSWYgdGhlcmUncyBhIGNvbnRleHQgbWVudSwgdGhlcmUgbXVzdFxuICAgICAgICAvLyBiZSBhdCBsZWFzdCBvbmUgcm9vdCBmb2xkZXIgd2l0aCBhIGRlc2NlbmRhbnQgdGhhdCdzIHJpZ2h0LWNsaWNrZWQuXG4gICAgICAgIHRoaXMuX2xvZ0Vycm9yKCdudWNsaWRlLWZpbGUtdHJlZTogQ291bGQgbm90IGZpbmQgYSBkaXJlY3RvcnkgdG8gYWRkIHRvLicpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZW50cnksXG4gICAgICBkaXJlY3Rvcnk6IChlbnRyeSAmJiBlbnRyeS5pc0ZpbGUoKSkgPyBlbnRyeS5nZXRQYXJlbnQoKSA6IGVudHJ5LFxuICAgICAgcm9vdDogdGhpcy5fZ2V0Um9vdERpcmVjdG9yeShlbnRyeSksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB3b3Jrc3BhY2Ugcm9vdCBkaXJlY3RvcnkgZm9yIHRoZSBlbnRyeSwgb3IgdGhlIGVudHJ5J3MgcGFyZW50LlxuICAgKi9cbiAgX2dldFJvb3REaXJlY3RvcnkoZW50cnk6IGF0b20kRmlsZSB8IGF0b20kRGlyZWN0b3J5KTogP2F0b20kRGlyZWN0b3J5IHtcbiAgICBpZiAoIWVudHJ5KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIHJvb3REaXJlY3RvcnlPZkVudHJ5ID0gbnVsbDtcbiAgICB2YXIgZW50cnlQYXRoID0gZW50cnkuZ2V0UGF0aCgpO1xuICAgIGF0b20ucHJvamVjdC5nZXREaXJlY3RvcmllcygpLnNvbWUoKGRpcmVjdG9yeSkgPT4ge1xuICAgICAgLy8gc29tZURpcmVjdG9yeS5jb250YWlucyhzb21lRGlyZWN0b3J5LmdldFBhdGgoKSkgcmV0dXJucyBmYWxzZSwgc29cbiAgICAgIC8vIHdlIGFsc28gaGF2ZSB0byBjaGVjayBmb3IgdGhlIGVxdWl2YWxlbmNlIG9mIHRoZSBwYXRoLlxuICAgICAgaWYgKGRpcmVjdG9yeS5jb250YWlucyhlbnRyeVBhdGgpIHx8IGRpcmVjdG9yeS5nZXRQYXRoKCkgPT09IGVudHJ5UGF0aCkge1xuICAgICAgICByb290RGlyZWN0b3J5T2ZFbnRyeSA9IGRpcmVjdG9yeTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG5cbiAgICBpZiAoIXJvb3REaXJlY3RvcnlPZkVudHJ5KSB7XG4gICAgICByb290RGlyZWN0b3J5T2ZFbnRyeSA9IGVudHJ5LmdldFBhcmVudCgpO1xuICAgIH1cblxuICAgIHJldHVybiByb290RGlyZWN0b3J5T2ZFbnRyeTtcbiAgfVxuXG4gIF9sb2dFcnJvcihlcnJvck1lc3NhZ2U6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5fbG9nZ2VyKSB7XG4gICAgICB0aGlzLl9sb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcbiAgICB9XG4gICAgdGhpcy5fbG9nZ2VyLmVycm9yKGVycm9yTWVzc2FnZSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlVHJlZUNvbnRyb2xsZXI7XG4iXX0=
