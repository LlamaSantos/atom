
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;

var SyncScroll = (function () {
  function SyncScroll(editor1, editor2) {
    var _this = this;

    _classCallCheck(this, SyncScroll);

    this._subscriptions = new CompositeDisposable();
    this._syncInfo = [{
      editor: editor1,
      scrolling: false
    }, {
      editor: editor2,
      scrolling: false
    }];

    this._syncInfo.forEach(function (editorInfo, i) {
      // Note that `onDidChangeScrollTop` isn't technically in the public API.
      _this._subscriptions.add(editorInfo.editor.onDidChangeScrollTop(function () {
        return _this._scrollPositionChanged(i);
      }));
    });
  }

  _createClass(SyncScroll, [{
    key: '_scrollPositionChanged',
    value: function _scrollPositionChanged(changeScrollIndex) {
      var thisInfo = this._syncInfo[changeScrollIndex];
      var otherInfo = this._syncInfo[1 - changeScrollIndex];
      if (thisInfo.scrolling) {
        return;
      }
      var thisEditor = thisInfo.editor;
      var otherEditor = otherInfo.editor;

      otherInfo.scrolling = true;
      otherEditor.setScrollTop(thisEditor.getScrollTop());
      otherInfo.scrolling = false;
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      if (this._subscriptions) {
        this._subscriptions.dispose();
        this._subscriptions = null;
      }
    }
  }]);

  return SyncScroll;
})();

module.exports = SyncScroll;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpZmYtdmlldy9saWIvU3luY1Njcm9sbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O2VBV2dCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXRDLG1CQUFtQixZQUFuQixtQkFBbUI7O0lBRWxCLFVBQVU7QUFFSCxXQUZQLFVBQVUsQ0FFRixPQUFtQixFQUFFLE9BQW1CLEVBQUU7OzswQkFGbEQsVUFBVTs7QUFHWixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQztBQUNoRCxRQUFJLENBQUMsU0FBUyxHQUFHLENBQUM7QUFDaEIsWUFBTSxFQUFFLE9BQU87QUFDZixlQUFTLEVBQUUsS0FBSztLQUNqQixFQUFFO0FBQ0QsWUFBTSxFQUFFLE9BQU87QUFDZixlQUFTLEVBQUUsS0FBSztLQUNqQixDQUFDLENBQUM7O0FBRUgsUUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQyxVQUFVLEVBQUUsQ0FBQyxFQUFLOztBQUV4QyxZQUFLLGNBQWMsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQztlQUFNLE1BQUssc0JBQXNCLENBQUMsQ0FBQyxDQUFDO09BQUEsQ0FBQyxDQUFDLENBQUM7S0FDdkcsQ0FBQyxDQUFDO0dBQ0o7O2VBaEJHLFVBQVU7O1dBa0JRLGdDQUFDLGlCQUF5QixFQUFRO0FBQ3RELFVBQUksUUFBUSxHQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUNsRCxVQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3RELFVBQUksUUFBUSxDQUFDLFNBQVMsRUFBRTtBQUN0QixlQUFPO09BQ1I7VUFDWSxVQUFVLEdBQUksUUFBUSxDQUE5QixNQUFNO1VBQ0UsV0FBVyxHQUFJLFNBQVMsQ0FBaEMsTUFBTTs7QUFDWCxlQUFTLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUMzQixpQkFBVyxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUNwRCxlQUFTLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztLQUM3Qjs7O1dBRU0sbUJBQVM7QUFDZCxVQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7QUFDdkIsWUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUM5QixZQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztPQUM1QjtLQUNGOzs7U0FwQ0csVUFBVTs7O0FBdUNoQixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1kaWZmLXZpZXcvbGliL1N5bmNTY3JvbGwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xuXG5jbGFzcyBTeW5jU2Nyb2xsIHtcblxuICBjb25zdHJ1Y3RvcihlZGl0b3IxOiBUZXh0RWRpdG9yLCBlZGl0b3IyOiBUZXh0RWRpdG9yKSB7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgdGhpcy5fc3luY0luZm8gPSBbe1xuICAgICAgZWRpdG9yOiBlZGl0b3IxLFxuICAgICAgc2Nyb2xsaW5nOiBmYWxzZSxcbiAgICB9LCB7XG4gICAgICBlZGl0b3I6IGVkaXRvcjIsXG4gICAgICBzY3JvbGxpbmc6IGZhbHNlLFxuICAgIH1dO1xuXG4gICAgdGhpcy5fc3luY0luZm8uZm9yRWFjaCgoZWRpdG9ySW5mbywgaSkgPT4ge1xuICAgICAgLy8gTm90ZSB0aGF0IGBvbkRpZENoYW5nZVNjcm9sbFRvcGAgaXNuJ3QgdGVjaG5pY2FsbHkgaW4gdGhlIHB1YmxpYyBBUEkuXG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChlZGl0b3JJbmZvLmVkaXRvci5vbkRpZENoYW5nZVNjcm9sbFRvcCgoKSA9PiB0aGlzLl9zY3JvbGxQb3NpdGlvbkNoYW5nZWQoaSkpKTtcbiAgICB9KTtcbiAgfVxuXG4gIF9zY3JvbGxQb3NpdGlvbkNoYW5nZWQoY2hhbmdlU2Nyb2xsSW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIHZhciB0aGlzSW5mbyAgPSB0aGlzLl9zeW5jSW5mb1tjaGFuZ2VTY3JvbGxJbmRleF07XG4gICAgdmFyIG90aGVySW5mbyA9IHRoaXMuX3N5bmNJbmZvWzEgLSBjaGFuZ2VTY3JvbGxJbmRleF07XG4gICAgaWYgKHRoaXNJbmZvLnNjcm9sbGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIge2VkaXRvcjogdGhpc0VkaXRvcn0gPSB0aGlzSW5mbztcbiAgICB2YXIge2VkaXRvcjogb3RoZXJFZGl0b3J9ID0gb3RoZXJJbmZvO1xuICAgIG90aGVySW5mby5zY3JvbGxpbmcgPSB0cnVlO1xuICAgIG90aGVyRWRpdG9yLnNldFNjcm9sbFRvcCh0aGlzRWRpdG9yLmdldFNjcm9sbFRvcCgpKTtcbiAgICBvdGhlckluZm8uc2Nyb2xsaW5nID0gZmFsc2U7XG4gIH1cblxuICBkaXNwb3NlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9zdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBudWxsO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN5bmNTY3JvbGw7XG4iXX0=
