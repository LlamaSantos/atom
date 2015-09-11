
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

var Range = _require.Range;

var _require2 = require('./editor-utils');

var buildLineRangesWithOffsets = _require2.buildLineRangesWithOffsets;

var React = require('react-for-atom');

/**
 * The DiffViewEditor manages the lifecycle of the two editors used in the diff view,
 * and controls its rendering of highlights and offsets.
 */
module.exports = (function () {
  function DiffViewEditor(editorElement) {
    var _this = this;

    _classCallCheck(this, DiffViewEditor);

    this._editorElement = editorElement;
    this._editor = editorElement.getModel();

    this._markers = [];
    this._lineOffsets = {};

    // Ugly Hack to the display buffer to allow fake soft wrapped lines,
    // to create the non-numbered empty space needed between real text buffer lines.
    this._originalBuildScreenLines = this._editor.displayBuffer.buildScreenLines;
    this._editor.displayBuffer.buildScreenLines = function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _this._buildScreenLinesWithOffsets.apply(_this, args);
    };

    // There is no editor API to cancel foldability, but deep inside the line state creation,
    // it uses those functions to determine if a line is foldable or not.
    // For Diff View, folding breaks offsets, hence we need to make it unfoldable.
    this._editor.isFoldableAtScreenRow = this._editor.isFoldableAtBufferRow = function () {
      return false;
    };
  }

  _createClass(DiffViewEditor, [{
    key: 'renderComponentsInline',
    value: function renderComponentsInline(elements) {
      var _this2 = this;

      var _require3 = require('nuclide-commons');

      var object = _require3.object;

      var components = [];
      var scrollToRow = this._scrollToRow.bind(this);
      elements.forEach(function (element) {
        var node = element.node;
        var bufferRow = element.bufferRow;

        if (!node.props.helpers) {
          node.props.helpers = {};
        }
        var helpers = {
          scrollToRow: scrollToRow
        };
        object.assign(node.props.helpers, helpers);
        var container = document.createElement('div');
        var component = React.render(node, container);
        // an overlay marker at a buffer range with row x renders under row x + 1
        // so, use range at bufferRow - 1 to actually display at bufferRow
        var range = [[bufferRow - 1, 0], [bufferRow - 1, 0]];
        var marker = _this2._editor.markBufferRange(range, { invalidate: 'never' });
        _this2._editor.decorateMarker(marker, { type: 'overlay', item: container });
        components.push({
          bufferRow: bufferRow,
          component: component
        });
      });
      return components;
    }
  }, {
    key: 'getLineHeightInPixels',
    value: function getLineHeightInPixels() {
      return this._editor.getLineHeightInPixels();
    }
  }, {
    key: 'setFileContents',
    value: function setFileContents(filePath, contents) {
      this._editor.setText(contents);
      var grammar = atom.grammars.selectGrammar(filePath, contents);
      this._editor.setGrammar(grammar);
    }
  }, {
    key: 'getText',
    value: function getText() {
      return this._editor.getText();
    }

    /**
     * @param addedLines An array of buffer line numbers that should be highlighted as added.
     * @param removedLines An array of buffer line numbers that should be highlighted as removed.
     */
  }, {
    key: 'setHighlightedLines',
    value: function setHighlightedLines() {
      var _this3 = this;

      var addedLines = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
      var removedLines = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

      for (var marker of this._markers) {
        marker.destroy();
      }
      this._markers = addedLines.map(function (lineNumber) {
        return _this3._createLineMarker(lineNumber, 'insert');
      }).concat(removedLines.map(function (lineNumber) {
        return _this3._createLineMarker(lineNumber, 'delete');
      }));
    }

    /**
     * @param lineNumber A buffer line number to be highlighted.
     * @param type The type of highlight to be applied to the line.
    *    Could be a value of: ['insert', 'delete'].
     */
  }, {
    key: '_createLineMarker',
    value: function _createLineMarker(lineNumber, type) {
      var screenPosition = this._editor.screenPositionForBufferPosition({ row: lineNumber, column: 0 });
      var range = new Range(screenPosition, { row: screenPosition.row, column: this._editor.lineTextForScreenRow(screenPosition.row).length }
      // TODO: highlight the full line when the mapping between buffer lines to screen line is implemented.
      // {row: screenPosition.row + 1, column: 0}
      );
      var marker = this._editor.markScreenRange(range, { invalidate: 'never' });
      var klass = 'diff-view-' + type;
      this._editor.decorateMarker(marker, { type: 'line-number', 'class': klass });
      this._editor.decorateMarker(marker, { type: 'highlight', 'class': klass });
      return marker;
    }
  }, {
    key: 'setOffsets',
    value: function setOffsets(lineOffsets) {
      this._lineOffsets = lineOffsets;
      // When the diff view is editable: upon edits in the new editor, the old editor needs to update its
      // rendering state to show the offset wrapped lines.
      // This isn't a public API, but came from a discussion on the Atom public channel.
      // Needed Atom API: Request a full re-render from an editor.
      this._editor.displayBuffer.updateAllScreenLines();
      this._editorElement.component.presenter.updateState();
    }
  }, {
    key: '_buildScreenLinesWithOffsets',
    value: function _buildScreenLinesWithOffsets(startBufferRow, endBufferRow) {
      var _originalBuildScreenLines$apply = this._originalBuildScreenLines.apply(this._editor.displayBuffer, arguments);

      var regions = _originalBuildScreenLines$apply.regions;
      var screenLines = _originalBuildScreenLines$apply.screenLines;

      if (!Object.keys(this._lineOffsets).length) {
        return { regions: regions, screenLines: screenLines };
      }

      return buildLineRangesWithOffsets(screenLines, this._lineOffsets, startBufferRow, endBufferRow, function () {
        var copy = screenLines[0].copy();
        copy.token = [];
        copy.text = '';
        copy.tags = [];
        return copy;
      });
    }
  }, {
    key: 'setReadOnly',
    value: function setReadOnly() {
      // Unfotunately, there is no other clean way to make an editor read only.
      // Got this from Atom's code to make an editor read-only.
      // Filed an issue: https://github.com/atom/atom/issues/6880
      this._editorElement.removeAttribute('tabindex');
      this._editor.getDecorations({ 'class': 'cursor-line', type: 'line' })[0].destroy();
    }
  }, {
    key: '_scrollToRow',
    value: function _scrollToRow(row) {
      this._editor.scrollToBufferPosition([row, 0]);
    }
  }]);

  return DiffViewEditor;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdFZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztlQVdHLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXpCLEtBQUssWUFBTCxLQUFLOztnQkFDeUIsT0FBTyxDQUFDLGdCQUFnQixDQUFDOztJQUF2RCwwQkFBMEIsYUFBMUIsMEJBQTBCOztBQUMvQixJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7Ozs7O0FBV3RDLE1BQU0sQ0FBQyxPQUFPO0FBRUQsV0FGVSxjQUFjLENBRXZCLGFBQWdDLEVBQUU7OzswQkFGekIsY0FBYzs7QUFHakMsUUFBSSxDQUFDLGNBQWMsR0FBRyxhQUFhLENBQUM7QUFDcEMsUUFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRXhDLFFBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ25CLFFBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDOzs7O0FBSXZCLFFBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQztBQUM3RSxRQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsR0FBRzt3Q0FBSSxJQUFJO0FBQUosWUFBSTs7O2FBQUssTUFBSyw0QkFBNEIsQ0FBQyxLQUFLLFFBQU8sSUFBSSxDQUFDO0tBQUEsQ0FBQzs7Ozs7QUFLL0csUUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixHQUFHO2FBQU0sS0FBSztLQUFBLENBQUM7R0FDdkY7O2VBbEJvQixjQUFjOztXQW9CYixn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LENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxTQUFTLENBQUM7O1VBQW5HLE9BQU8sbUNBQVAsT0FBTztVQUFFLFdBQVcsbUNBQVgsV0FBVzs7QUFDekIsVUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUMxQyxlQUFPLEVBQUMsT0FBTyxFQUFQLE9BQU8sRUFBRSxXQUFXLEVBQVgsV0FBVyxFQUFDLENBQUM7T0FDL0I7O0FBRUQsYUFBTywwQkFBMEIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUM1RixZQUFNO0FBQ0osWUFBSSxJQUFJLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLFlBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2YsWUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7QUFDZixlQUFPLElBQUksQ0FBQztPQUNiLENBQ0YsQ0FBQztLQUNIOzs7V0FFVSx1QkFBUzs7OztBQUlsQixVQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNoRCxVQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFDLFNBQU8sYUFBYSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQ2hGOzs7V0FFVyxzQkFBQyxHQUFHLEVBQVE7QUFDdEIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9DOzs7U0FuSW9CLGNBQWM7SUFvSXBDLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtZGlmZi12aWV3L2xpYi9EaWZmVmlld0VkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7UmFuZ2V9ICA9IHJlcXVpcmUoJ2F0b20nKTtcbnZhciB7YnVpbGRMaW5lUmFuZ2VzV2l0aE9mZnNldHN9ID0gcmVxdWlyZSgnLi9lZGl0b3ItdXRpbHMnKTtcbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG5cbnR5cGUgSW5saW5lQ29tcG9uZW50ID0ge1xuICBub2RlOiBSZWFjdEVsZW1lbnQ7XG4gIGJ1ZmZlclJvdzogbnVtYmVyO1xufVxuXG4vKipcbiAqIFRoZSBEaWZmVmlld0VkaXRvciBtYW5hZ2VzIHRoZSBsaWZlY3ljbGUgb2YgdGhlIHR3byBlZGl0b3JzIHVzZWQgaW4gdGhlIGRpZmYgdmlldyxcbiAqIGFuZCBjb250cm9scyBpdHMgcmVuZGVyaW5nIG9mIGhpZ2hsaWdodHMgYW5kIG9mZnNldHMuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gY2xhc3MgRGlmZlZpZXdFZGl0b3Ige1xuXG4gIGNvbnN0cnVjdG9yKGVkaXRvckVsZW1lbnQ6IFRleHRFZGl0b3JFbGVtZW50KSB7XG4gICAgdGhpcy5fZWRpdG9yRWxlbWVudCA9IGVkaXRvckVsZW1lbnQ7XG4gICAgdGhpcy5fZWRpdG9yID0gZWRpdG9yRWxlbWVudC5nZXRNb2RlbCgpO1xuXG4gICAgdGhpcy5fbWFya2VycyA9IFtdO1xuICAgIHRoaXMuX2xpbmVPZmZzZXRzID0ge307XG5cbiAgICAvLyBVZ2x5IEhhY2sgdG8gdGhlIGRpc3BsYXkgYnVmZmVyIHRvIGFsbG93IGZha2Ugc29mdCB3cmFwcGVkIGxpbmVzLFxuICAgIC8vIHRvIGNyZWF0ZSB0aGUgbm9uLW51bWJlcmVkIGVtcHR5IHNwYWNlIG5lZWRlZCBiZXR3ZWVuIHJlYWwgdGV4dCBidWZmZXIgbGluZXMuXG4gICAgdGhpcy5fb3JpZ2luYWxCdWlsZFNjcmVlbkxpbmVzID0gdGhpcy5fZWRpdG9yLmRpc3BsYXlCdWZmZXIuYnVpbGRTY3JlZW5MaW5lcztcbiAgICB0aGlzLl9lZGl0b3IuZGlzcGxheUJ1ZmZlci5idWlsZFNjcmVlbkxpbmVzID0gKC4uLmFyZ3MpID0+IHRoaXMuX2J1aWxkU2NyZWVuTGluZXNXaXRoT2Zmc2V0cy5hcHBseSh0aGlzLCBhcmdzKTtcblxuICAgIC8vIFRoZXJlIGlzIG5vIGVkaXRvciBBUEkgdG8gY2FuY2VsIGZvbGRhYmlsaXR5LCBidXQgZGVlcCBpbnNpZGUgdGhlIGxpbmUgc3RhdGUgY3JlYXRpb24sXG4gICAgLy8gaXQgdXNlcyB0aG9zZSBmdW5jdGlvbnMgdG8gZGV0ZXJtaW5lIGlmIGEgbGluZSBpcyBmb2xkYWJsZSBvciBub3QuXG4gICAgLy8gRm9yIERpZmYgVmlldywgZm9sZGluZyBicmVha3Mgb2Zmc2V0cywgaGVuY2Ugd2UgbmVlZCB0byBtYWtlIGl0IHVuZm9sZGFibGUuXG4gICAgdGhpcy5fZWRpdG9yLmlzRm9sZGFibGVBdFNjcmVlblJvdyA9IHRoaXMuX2VkaXRvci5pc0ZvbGRhYmxlQXRCdWZmZXJSb3cgPSAoKSA9PiBmYWxzZTtcbiAgfVxuXG4gIHJlbmRlckNvbXBvbmVudHNJbmxpbmUoZWxlbWVudHMpOiBBcnJheTxJbmxpbmVDb21wb25lbnQ+IHtcbiAgICB2YXIge29iamVjdH0gPSByZXF1aXJlKCdudWNsaWRlLWNvbW1vbnMnKTtcbiAgICB2YXIgY29tcG9uZW50cyA9IFtdO1xuICAgIHZhciBzY3JvbGxUb1JvdyA9IHRoaXMuX3Njcm9sbFRvUm93LmJpbmQodGhpcyk7XG4gICAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIHZhciB7bm9kZSwgYnVmZmVyUm93fSA9IGVsZW1lbnQ7XG4gICAgICBpZiAoIW5vZGUucHJvcHMuaGVscGVycykge1xuICAgICAgICBub2RlLnByb3BzLmhlbHBlcnMgPSB7fTtcbiAgICAgIH1cbiAgICAgIHZhciBoZWxwZXJzID0ge1xuICAgICAgICBzY3JvbGxUb1JvdyxcbiAgICAgIH07XG4gICAgICBvYmplY3QuYXNzaWduKG5vZGUucHJvcHMuaGVscGVycywgaGVscGVycyk7XG4gICAgICB2YXIgY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICB2YXIgY29tcG9uZW50ID0gUmVhY3QucmVuZGVyKG5vZGUsIGNvbnRhaW5lcik7XG4gICAgICAvLyBhbiBvdmVybGF5IG1hcmtlciBhdCBhIGJ1ZmZlciByYW5nZSB3aXRoIHJvdyB4IHJlbmRlcnMgdW5kZXIgcm93IHggKyAxXG4gICAgICAvLyBzbywgdXNlIHJhbmdlIGF0IGJ1ZmZlclJvdyAtIDEgdG8gYWN0dWFsbHkgZGlzcGxheSBhdCBidWZmZXJSb3dcbiAgICAgIHZhciByYW5nZSA9IFtbYnVmZmVyUm93IC0gMSwgMF0sIFtidWZmZXJSb3cgLSAxLCAwXV07XG4gICAgICB2YXIgbWFya2VyID0gdGhpcy5fZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSwge2ludmFsaWRhdGU6ICduZXZlcid9KTtcbiAgICAgIHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHt0eXBlOiAnb3ZlcmxheScsIGl0ZW06IGNvbnRhaW5lcn0pO1xuICAgICAgY29tcG9uZW50cy5wdXNoKHtcbiAgICAgICAgYnVmZmVyUm93LFxuICAgICAgICBjb21wb25lbnQsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICByZXR1cm4gY29tcG9uZW50cztcbiAgfVxuXG4gIGdldExpbmVIZWlnaHRJblBpeGVscygpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG4gIH1cblxuICBzZXRGaWxlQ29udGVudHMoZmlsZVBhdGg6IHN0cmluZywgY29udGVudHM6IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX2VkaXRvci5zZXRUZXh0KGNvbnRlbnRzKTtcbiAgICB2YXIgZ3JhbW1hciA9IGF0b20uZ3JhbW1hcnMuc2VsZWN0R3JhbW1hcihmaWxlUGF0aCwgY29udGVudHMpO1xuICAgIHRoaXMuX2VkaXRvci5zZXRHcmFtbWFyKGdyYW1tYXIpO1xuICB9XG5cbiAgZ2V0VGV4dCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLl9lZGl0b3IuZ2V0VGV4dCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBhZGRlZExpbmVzIEFuIGFycmF5IG9mIGJ1ZmZlciBsaW5lIG51bWJlcnMgdGhhdCBzaG91bGQgYmUgaGlnaGxpZ2h0ZWQgYXMgYWRkZWQuXG4gICAqIEBwYXJhbSByZW1vdmVkTGluZXMgQW4gYXJyYXkgb2YgYnVmZmVyIGxpbmUgbnVtYmVycyB0aGF0IHNob3VsZCBiZSBoaWdobGlnaHRlZCBhcyByZW1vdmVkLlxuICAgKi9cbiAgc2V0SGlnaGxpZ2h0ZWRMaW5lcyhhZGRlZExpbmVzOiA/QXJyYXk8bnVtYmVyPiA9IFtdLCByZW1vdmVkTGluZXM6ID9BcnJheTxudW1iZXI+ID0gW10pIHtcbiAgICBmb3IgKHZhciBtYXJrZXIgb2YgdGhpcy5fbWFya2Vycykge1xuICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICB9XG4gICAgdGhpcy5fbWFya2VycyA9IGFkZGVkTGluZXMubWFwKGxpbmVOdW1iZXIgPT4gdGhpcy5fY3JlYXRlTGluZU1hcmtlcihsaW5lTnVtYmVyLCAnaW5zZXJ0JykpXG4gICAgICAgIC5jb25jYXQocmVtb3ZlZExpbmVzLm1hcChsaW5lTnVtYmVyID0+IHRoaXMuX2NyZWF0ZUxpbmVNYXJrZXIobGluZU51bWJlciwgJ2RlbGV0ZScpKSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGxpbmVOdW1iZXIgQSBidWZmZXIgbGluZSBudW1iZXIgdG8gYmUgaGlnaGxpZ2h0ZWQuXG4gICAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIGhpZ2hsaWdodCB0byBiZSBhcHBsaWVkIHRvIHRoZSBsaW5lLlxuICAqICAgIENvdWxkIGJlIGEgdmFsdWUgb2Y6IFsnaW5zZXJ0JywgJ2RlbGV0ZSddLlxuICAgKi9cbiAgX2NyZWF0ZUxpbmVNYXJrZXIobGluZU51bWJlcjogbnVtYmVyLCB0eXBlOiBzdHJpbmcpOiBNYXJrZXIge1xuICAgIHZhciBzY3JlZW5Qb3NpdGlvbiA9IHRoaXMuX2VkaXRvci5zY3JlZW5Qb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKHtyb3c6IGxpbmVOdW1iZXIsIGNvbHVtbjogMH0pO1xuICAgIHZhciByYW5nZSA9IG5ldyBSYW5nZShcbiAgICAgICAgc2NyZWVuUG9zaXRpb24sXG4gICAgICAgIHtyb3c6IHNjcmVlblBvc2l0aW9uLnJvdywgY29sdW1uOiB0aGlzLl9lZGl0b3IubGluZVRleHRGb3JTY3JlZW5Sb3coc2NyZWVuUG9zaXRpb24ucm93KS5sZW5ndGh9XG4gICAgICAgIC8vIFRPRE86IGhpZ2hsaWdodCB0aGUgZnVsbCBsaW5lIHdoZW4gdGhlIG1hcHBpbmcgYmV0d2VlbiBidWZmZXIgbGluZXMgdG8gc2NyZWVuIGxpbmUgaXMgaW1wbGVtZW50ZWQuXG4gICAgICAgIC8vIHtyb3c6IHNjcmVlblBvc2l0aW9uLnJvdyArIDEsIGNvbHVtbjogMH1cbiAgICApO1xuICAgIHZhciBtYXJrZXIgPSB0aGlzLl9lZGl0b3IubWFya1NjcmVlblJhbmdlKHJhbmdlLCB7aW52YWxpZGF0ZTogJ25ldmVyJ30pO1xuICAgIHZhciBrbGFzcyA9ICdkaWZmLXZpZXctJyArIHR5cGU7XG4gICAgdGhpcy5fZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwge3R5cGU6ICdsaW5lLW51bWJlcicsIGNsYXNzOiBrbGFzc30pO1xuICAgIHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHt0eXBlOiAnaGlnaGxpZ2h0JywgY2xhc3M6IGtsYXNzfSk7XG4gICAgcmV0dXJuIG1hcmtlcjtcbiAgfVxuXG4gIHNldE9mZnNldHMobGluZU9mZnNldHM6IGFueSk6IHZvaWQge1xuICAgIHRoaXMuX2xpbmVPZmZzZXRzID0gbGluZU9mZnNldHM7XG4gICAgLy8gV2hlbiB0aGUgZGlmZiB2aWV3IGlzIGVkaXRhYmxlOiB1cG9uIGVkaXRzIGluIHRoZSBuZXcgZWRpdG9yLCB0aGUgb2xkIGVkaXRvciBuZWVkcyB0byB1cGRhdGUgaXRzXG4gICAgLy8gcmVuZGVyaW5nIHN0YXRlIHRvIHNob3cgdGhlIG9mZnNldCB3cmFwcGVkIGxpbmVzLlxuICAgIC8vIFRoaXMgaXNuJ3QgYSBwdWJsaWMgQVBJLCBidXQgY2FtZSBmcm9tIGEgZGlzY3Vzc2lvbiBvbiB0aGUgQXRvbSBwdWJsaWMgY2hhbm5lbC5cbiAgICAvLyBOZWVkZWQgQXRvbSBBUEk6IFJlcXVlc3QgYSBmdWxsIHJlLXJlbmRlciBmcm9tIGFuIGVkaXRvci5cbiAgICB0aGlzLl9lZGl0b3IuZGlzcGxheUJ1ZmZlci51cGRhdGVBbGxTY3JlZW5MaW5lcygpO1xuICAgIHRoaXMuX2VkaXRvckVsZW1lbnQuY29tcG9uZW50LnByZXNlbnRlci51cGRhdGVTdGF0ZSgpO1xuICB9XG5cbiAgX2J1aWxkU2NyZWVuTGluZXNXaXRoT2Zmc2V0cyhzdGFydEJ1ZmZlclJvdzogbnVtYmVyLCBlbmRCdWZmZXJSb3c6IG51bWJlcik6IExpbmVSYW5nZXNXaXRoT2Zmc2V0cyB7XG4gICAgdmFyIHtyZWdpb25zLCBzY3JlZW5MaW5lc30gPSB0aGlzLl9vcmlnaW5hbEJ1aWxkU2NyZWVuTGluZXMuYXBwbHkodGhpcy5fZWRpdG9yLmRpc3BsYXlCdWZmZXIsIGFyZ3VtZW50cyk7XG4gICAgaWYgKCFPYmplY3Qua2V5cyh0aGlzLl9saW5lT2Zmc2V0cykubGVuZ3RoKSB7XG4gICAgICByZXR1cm4ge3JlZ2lvbnMsIHNjcmVlbkxpbmVzfTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVpbGRMaW5lUmFuZ2VzV2l0aE9mZnNldHMoc2NyZWVuTGluZXMsIHRoaXMuX2xpbmVPZmZzZXRzLCBzdGFydEJ1ZmZlclJvdywgZW5kQnVmZmVyUm93LFxuICAgICAgKCkgPT4ge1xuICAgICAgICB2YXIgY29weSA9IHNjcmVlbkxpbmVzWzBdLmNvcHkoKTtcbiAgICAgICAgY29weS50b2tlbiA9IFtdO1xuICAgICAgICBjb3B5LnRleHQgPSAnJztcbiAgICAgICAgY29weS50YWdzID0gW107XG4gICAgICAgIHJldHVybiBjb3B5O1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBzZXRSZWFkT25seSgpOiB2b2lkIHtcbiAgICAvLyBVbmZvdHVuYXRlbHksIHRoZXJlIGlzIG5vIG90aGVyIGNsZWFuIHdheSB0byBtYWtlIGFuIGVkaXRvciByZWFkIG9ubHkuXG4gICAgLy8gR290IHRoaXMgZnJvbSBBdG9tJ3MgY29kZSB0byBtYWtlIGFuIGVkaXRvciByZWFkLW9ubHkuXG4gICAgLy8gRmlsZWQgYW4gaXNzdWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vaXNzdWVzLzY4ODBcbiAgICB0aGlzLl9lZGl0b3JFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgndGFiaW5kZXgnKTtcbiAgICB0aGlzLl9lZGl0b3IuZ2V0RGVjb3JhdGlvbnMoe2NsYXNzOiAnY3Vyc29yLWxpbmUnLCB0eXBlOiAnbGluZSd9KVswXS5kZXN0cm95KCk7XG4gIH1cblxuICBfc2Nyb2xsVG9Sb3cocm93KTogdm9pZCB7XG4gICAgdGhpcy5fZWRpdG9yLnNjcm9sbFRvQnVmZmVyUG9zaXRpb24oW3JvdywgMF0pO1xuICB9XG59O1xuIl19
