function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

'use babel';

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;

var loadController;
var fileTreeController = null;
var subscriptions = null;

// Unload 'tree-view' so we can control whether it is activated or not.
//
// Running the code in the global scope here ensures that it's called before
// 'tree-view' is activated. This allows us to unload it before it's activated,
// ensuring it has minimal impact on startup time.
var loadSubscription = atom.packages.onDidLoadInitialPackages(function () {
  if (atom.packages.isPackageLoaded('tree-view')) {
    atom.packages.unloadPackage('tree-view');
  }

  if (loadSubscription) {
    loadSubscription.dispose();
    loadSubscription = null;
  }
});

module.exports = {
  activate: function activate(state) {
    // We need to check if the package is already disabled, otherwise Atom will
    // add it to the 'core.disabledPackages' config multiple times.
    if (!atom.packages.isPackageDisabled('tree-view')) {
      atom.packages.disablePackage('tree-view');
    }

    // Show the file tree by default.
    state = state || {};
    state.panel = state.panel || { isVisible: true };

    /**
     * Lazily load the FileTreeController, to minimize startup time.
     */
    loadController = _asyncToGenerator(function* () {
      if (!fileTreeController) {
        var FileTreeController = require('./FileTreeController');
        fileTreeController = new FileTreeController(state);
      }
      return fileTreeController;
    });

    subscriptions = new CompositeDisposable();
    subscriptions.add(atom.commands.add('atom-workspace', {
      'nuclide-file-tree:toggle': _asyncToGenerator(function* () {
        return (yield loadController()).toggle();
      }),
      'nuclide-file-tree:show': _asyncToGenerator(function* () {
        return (yield loadController()).setVisible(true);
      }),
      'nuclide-file-tree:reveal-active-file': _asyncToGenerator(function* () {
        return (yield loadController()).revealActiveFile();
      })
    }));

    if (state.panel.isVisible) {
      loadController();
    }
  },

  getController: function getController() {
    return loadController;
  },

  deactivate: function deactivate() {
    if (subscriptions) {
      subscriptions.dispose();
      subscriptions = null;
    }
    if (fileTreeController) {
      fileTreeController.destroy();
      fileTreeController = null;
    }

    // The user most likely wants either `nuclide-file-tree` or `tree-view` at
    // any given point. If `nuclide-file-tree` is disabled, we should re-enable
    // `tree-view` so they can still browse files.
    //
    // If the user only ever wants to use `nuclide-file-tree`, we still need to
    // enable `tree-view` on shutdown. Otherwise, disabling `nuclide-file-tree`
    // and reloading Atom would keep `tree-view` disabled.
    atom.packages.enablePackage('tree-view');
  },

  serialize: function serialize() {
    if (fileTreeController) {
      return fileTreeController.serialize();
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZpbGUtdHJlZS9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsV0FBVyxDQUFDOztlQWFnQixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUF0QyxtQkFBbUIsWUFBbkIsbUJBQW1COztBQUV4QixJQUFJLGNBQWtELENBQUM7QUFDdkQsSUFBSSxrQkFBdUMsR0FBRyxJQUFJLENBQUM7QUFDbkQsSUFBSSxhQUFtQyxHQUFHLElBQUksQ0FBQzs7Ozs7OztBQU8vQyxJQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsd0JBQXdCLENBQUMsWUFBTTtBQUNsRSxNQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxFQUFFO0FBQzlDLFFBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0dBQzFDOztBQUVELE1BQUksZ0JBQWdCLEVBQUU7QUFDcEIsb0JBQWdCLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDM0Isb0JBQWdCLEdBQUcsSUFBSSxDQUFDO0dBQ3pCO0NBQ0YsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixVQUFRLEVBQUEsa0JBQUMsS0FBK0IsRUFBUTs7O0FBRzlDLFFBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxFQUFFO0FBQ2pELFVBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQzNDOzs7QUFHRCxTQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUUsQ0FBQztBQUNwQixTQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBQyxTQUFTLEVBQUUsSUFBSSxFQUFDLENBQUM7Ozs7O0FBSy9DLGtCQUFjLHFCQUFHLGFBQVk7QUFDM0IsVUFBSSxDQUFDLGtCQUFrQixFQUFFO0FBQ3ZCLFlBQUksa0JBQWtCLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7QUFDekQsMEJBQWtCLEdBQUcsSUFBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUNwRDtBQUNELGFBQU8sa0JBQWtCLENBQUM7S0FDM0IsQ0FBQSxDQUFDOztBQUVGLGlCQUFhLEdBQUcsSUFBSSxtQkFBbUIsRUFBRSxDQUFDO0FBQzFDLGlCQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUMvQixnQkFBZ0IsRUFDaEI7QUFDRSxnQ0FBMEIsb0JBQUU7ZUFBWSxDQUFDLE1BQU0sY0FBYyxFQUFFLENBQUEsQ0FBRSxNQUFNLEVBQUU7T0FBQSxDQUFBO0FBQ3pFLDhCQUF3QixvQkFBRTtlQUFZLENBQUMsTUFBTSxjQUFjLEVBQUUsQ0FBQSxDQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUM7T0FBQSxDQUFBO0FBQy9FLDRDQUFzQyxvQkFBRTtlQUFZLENBQUMsTUFBTSxjQUFjLEVBQUUsQ0FBQSxDQUFFLGdCQUFnQixFQUFFO09BQUEsQ0FBQTtLQUNoRyxDQUFDLENBQUMsQ0FBQzs7QUFFUixRQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFO0FBQ3pCLG9CQUFjLEVBQUUsQ0FBQztLQUNsQjtHQUNGOztBQUVELGVBQWEsRUFBQSx5QkFBc0M7QUFDakQsV0FBTyxjQUFjLENBQUM7R0FDdkI7O0FBRUQsWUFBVSxFQUFBLHNCQUFTO0FBQ2pCLFFBQUksYUFBYSxFQUFFO0FBQ2pCLG1CQUFhLENBQUMsT0FBTyxFQUFFLENBQUM7QUFDeEIsbUJBQWEsR0FBRyxJQUFJLENBQUM7S0FDdEI7QUFDRCxRQUFJLGtCQUFrQixFQUFFO0FBQ3RCLHdCQUFrQixDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzdCLHdCQUFrQixHQUFHLElBQUksQ0FBQztLQUMzQjs7Ozs7Ozs7O0FBU0QsUUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLENBQUM7R0FDMUM7O0FBRUQsV0FBUyxFQUFBLHFCQUE2QjtBQUNwQyxRQUFJLGtCQUFrQixFQUFFO0FBQ3RCLGFBQU8sa0JBQWtCLENBQUMsU0FBUyxFQUFFLENBQUM7S0FDdkM7R0FDRjtDQUNGLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtZmlsZS10cmVlL2xpYi9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuaW1wb3J0IHR5cGUgRmlsZVRyZWVDb250cm9sbGVyIGZyb20gJy4vRmlsZVRyZWVDb250cm9sbGVyJztcblxudmFyIHtDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUoJ2F0b20nKTtcblxudmFyIGxvYWRDb250cm9sbGVyOiA/KCkgPT4gUHJvbWlzZTxGaWxlVHJlZUNvbnRyb2xsZXI+O1xudmFyIGZpbGVUcmVlQ29udHJvbGxlcjogP0ZpbGVUcmVlQ29udHJvbGxlciA9IG51bGw7XG52YXIgc3Vic2NyaXB0aW9uczogP0NvbXBvc2l0ZURpc3Bvc2FibGUgPSBudWxsO1xuXG4vLyBVbmxvYWQgJ3RyZWUtdmlldycgc28gd2UgY2FuIGNvbnRyb2wgd2hldGhlciBpdCBpcyBhY3RpdmF0ZWQgb3Igbm90LlxuLy9cbi8vIFJ1bm5pbmcgdGhlIGNvZGUgaW4gdGhlIGdsb2JhbCBzY29wZSBoZXJlIGVuc3VyZXMgdGhhdCBpdCdzIGNhbGxlZCBiZWZvcmVcbi8vICd0cmVlLXZpZXcnIGlzIGFjdGl2YXRlZC4gVGhpcyBhbGxvd3MgdXMgdG8gdW5sb2FkIGl0IGJlZm9yZSBpdCdzIGFjdGl2YXRlZCxcbi8vIGVuc3VyaW5nIGl0IGhhcyBtaW5pbWFsIGltcGFjdCBvbiBzdGFydHVwIHRpbWUuXG52YXIgbG9hZFN1YnNjcmlwdGlvbiA9IGF0b20ucGFja2FnZXMub25EaWRMb2FkSW5pdGlhbFBhY2thZ2VzKCgpID0+IHtcbiAgaWYgKGF0b20ucGFja2FnZXMuaXNQYWNrYWdlTG9hZGVkKCd0cmVlLXZpZXcnKSkge1xuICAgIGF0b20ucGFja2FnZXMudW5sb2FkUGFja2FnZSgndHJlZS12aWV3Jyk7XG4gIH1cblxuICBpZiAobG9hZFN1YnNjcmlwdGlvbikge1xuICAgIGxvYWRTdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgIGxvYWRTdWJzY3JpcHRpb24gPSBudWxsO1xuICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFjdGl2YXRlKHN0YXRlOiA/RmlsZVRyZWVDb250cm9sbGVyU3RhdGUpOiB2b2lkIHtcbiAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIGlmIHRoZSBwYWNrYWdlIGlzIGFscmVhZHkgZGlzYWJsZWQsIG90aGVyd2lzZSBBdG9tIHdpbGxcbiAgICAvLyBhZGQgaXQgdG8gdGhlICdjb3JlLmRpc2FibGVkUGFja2FnZXMnIGNvbmZpZyBtdWx0aXBsZSB0aW1lcy5cbiAgICBpZiAoIWF0b20ucGFja2FnZXMuaXNQYWNrYWdlRGlzYWJsZWQoJ3RyZWUtdmlldycpKSB7XG4gICAgICBhdG9tLnBhY2thZ2VzLmRpc2FibGVQYWNrYWdlKCd0cmVlLXZpZXcnKTtcbiAgICB9XG5cbiAgICAvLyBTaG93IHRoZSBmaWxlIHRyZWUgYnkgZGVmYXVsdC5cbiAgICBzdGF0ZSA9IHN0YXRlIHx8IHt9O1xuICAgIHN0YXRlLnBhbmVsID0gc3RhdGUucGFuZWwgfHwge2lzVmlzaWJsZTogdHJ1ZX07XG5cbiAgICAvKipcbiAgICAgKiBMYXppbHkgbG9hZCB0aGUgRmlsZVRyZWVDb250cm9sbGVyLCB0byBtaW5pbWl6ZSBzdGFydHVwIHRpbWUuXG4gICAgICovXG4gICAgbG9hZENvbnRyb2xsZXIgPSBhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoIWZpbGVUcmVlQ29udHJvbGxlcikge1xuICAgICAgICB2YXIgRmlsZVRyZWVDb250cm9sbGVyID0gcmVxdWlyZSgnLi9GaWxlVHJlZUNvbnRyb2xsZXInKTtcbiAgICAgICAgZmlsZVRyZWVDb250cm9sbGVyID0gbmV3IEZpbGVUcmVlQ29udHJvbGxlcihzdGF0ZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsZVRyZWVDb250cm9sbGVyO1xuICAgIH07XG5cbiAgICBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICBzdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICAgJ2F0b20td29ya3NwYWNlJyxcbiAgICAgICAge1xuICAgICAgICAgICdudWNsaWRlLWZpbGUtdHJlZTp0b2dnbGUnOiBhc3luYyAoKSA9PiAoYXdhaXQgbG9hZENvbnRyb2xsZXIoKSkudG9nZ2xlKCksXG4gICAgICAgICAgJ251Y2xpZGUtZmlsZS10cmVlOnNob3cnOiBhc3luYyAoKSA9PiAoYXdhaXQgbG9hZENvbnRyb2xsZXIoKSkuc2V0VmlzaWJsZSh0cnVlKSxcbiAgICAgICAgICAnbnVjbGlkZS1maWxlLXRyZWU6cmV2ZWFsLWFjdGl2ZS1maWxlJzogYXN5bmMgKCkgPT4gKGF3YWl0IGxvYWRDb250cm9sbGVyKCkpLnJldmVhbEFjdGl2ZUZpbGUoKSxcbiAgICAgICAgfSkpO1xuXG4gICAgaWYgKHN0YXRlLnBhbmVsLmlzVmlzaWJsZSkge1xuICAgICAgbG9hZENvbnRyb2xsZXIoKTtcbiAgICB9XG4gIH0sXG5cbiAgZ2V0Q29udHJvbGxlcigpOiAoKSA9PiBQcm9taXNlPEZpbGVUcmVlQ29udHJvbGxlcj4ge1xuICAgIHJldHVybiBsb2FkQ29udHJvbGxlcjtcbiAgfSxcblxuICBkZWFjdGl2YXRlKCk6IHZvaWQge1xuICAgIGlmIChzdWJzY3JpcHRpb25zKSB7XG4gICAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICAgIHN1YnNjcmlwdGlvbnMgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoZmlsZVRyZWVDb250cm9sbGVyKSB7XG4gICAgICBmaWxlVHJlZUNvbnRyb2xsZXIuZGVzdHJveSgpO1xuICAgICAgZmlsZVRyZWVDb250cm9sbGVyID0gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBUaGUgdXNlciBtb3N0IGxpa2VseSB3YW50cyBlaXRoZXIgYG51Y2xpZGUtZmlsZS10cmVlYCBvciBgdHJlZS12aWV3YCBhdFxuICAgIC8vIGFueSBnaXZlbiBwb2ludC4gSWYgYG51Y2xpZGUtZmlsZS10cmVlYCBpcyBkaXNhYmxlZCwgd2Ugc2hvdWxkIHJlLWVuYWJsZVxuICAgIC8vIGB0cmVlLXZpZXdgIHNvIHRoZXkgY2FuIHN0aWxsIGJyb3dzZSBmaWxlcy5cbiAgICAvL1xuICAgIC8vIElmIHRoZSB1c2VyIG9ubHkgZXZlciB3YW50cyB0byB1c2UgYG51Y2xpZGUtZmlsZS10cmVlYCwgd2Ugc3RpbGwgbmVlZCB0b1xuICAgIC8vIGVuYWJsZSBgdHJlZS12aWV3YCBvbiBzaHV0ZG93bi4gT3RoZXJ3aXNlLCBkaXNhYmxpbmcgYG51Y2xpZGUtZmlsZS10cmVlYFxuICAgIC8vIGFuZCByZWxvYWRpbmcgQXRvbSB3b3VsZCBrZWVwIGB0cmVlLXZpZXdgIGRpc2FibGVkLlxuICAgIGF0b20ucGFja2FnZXMuZW5hYmxlUGFja2FnZSgndHJlZS12aWV3Jyk7XG4gIH0sXG5cbiAgc2VyaWFsaXplKCk6ID9GaWxlVHJlZUNvbnRyb2xsZXJTdGF0ZSB7XG4gICAgaWYgKGZpbGVUcmVlQ29udHJvbGxlcikge1xuICAgICAgcmV0dXJuIGZpbGVUcmVlQ29udHJvbGxlci5zZXJpYWxpemUoKTtcbiAgICB9XG4gIH1cbn07XG4iXX0=
