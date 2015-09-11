
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;

var React = require('react-for-atom');
var PropTypes = React.PropTypes;

var DiffViewComponent = React.createClass({
  displayName: 'DiffViewComponent',

  propTypes: {
    model: PropTypes.object.isRequired
  },

  componentDidMount: function componentDidMount() {
    this._subscriptions = new CompositeDisposable();

    var DiffViewEditor = require('./DiffViewEditor');

    this._oldDiffEditor = new DiffViewEditor(this._getOldTextEditorElement());
    this._newDiffEditor = new DiffViewEditor(this._getNewTextEditorElement());

    // The first version of the diff view will have both editors readonly.
    // But later on, the right editor will be editable and savable.
    this._oldDiffEditor.setReadOnly();
    this._newDiffEditor.setReadOnly();

    var diffViewState = this.props.model.getDiffState();
    var oldText = diffViewState.oldText;
    var newText = diffViewState.newText;
    var filePath = diffViewState.filePath;
    var uiComponents = diffViewState.uiComponents;

    this._oldDiffEditor.setFileContents(filePath, oldText);
    this._newDiffEditor.setFileContents(filePath, newText);

    var SyncScroll = require('./SyncScroll');
    this._subscriptions.add(new SyncScroll(this._getOldTextEditorElement().getModel(), this._getNewTextEditorElement().getModel()));

    this._inlineComponents = this._oldDiffEditor.renderComponentsInline(uiComponents);
  },

  _computeDiffLinesAndOffsets: function _computeDiffLinesAndOffsets() {
    var _this = this;

    var _props$model$computeDiff = this.props.model.computeDiff(this._oldDiffEditor.getText(), this._newDiffEditor.getText());

    var addedLines = _props$model$computeDiff.addedLines;
    var removedLines = _props$model$computeDiff.removedLines;
    var oldLineOffsets = _props$model$computeDiff.oldLineOffsets;
    var newLineOffsets = _props$model$computeDiff.newLineOffsets;

    this._inlineComponents.forEach(function (element) {
      var domNode = React.findDOMNode(element.component);
      // get the height of the component after it has been rendered in the DOM
      var componentHeight = window.getComputedStyle(domNode).height;
      // "123px" -> 123
      componentHeight = Number(componentHeight.substring(0, componentHeight.length - 2));
      var lineHeight = _this._oldDiffEditor.getLineHeightInPixels();
      // calculate the number of lines we need to insert in the buffer to make room
      // for the component to be displayed
      var offset = Math.ceil(componentHeight / lineHeight);
      var offsetRow = element.bufferRow;

      newLineOffsets[offsetRow] = (newLineOffsets[offsetRow] || 0) + offset;
      oldLineOffsets[offsetRow] = (oldLineOffsets[offsetRow] || 0) + offset;

      // TODO(gendron):
      // horrible hack! Set the width of the overlay so that it won't resize when we
      // type comment replies into the text editor.
      // Need to figure out how Atom computes and sets the overlay dimensions.
      var componentWidth = window.getComputedStyle(domNode).width;
      domNode.style.width = componentWidth;
    });

    return {
      addedLines: addedLines,
      removedLines: removedLines,
      newLineOffsets: newLineOffsets,
      oldLineOffsets: oldLineOffsets
    };
  },

  updateDiffMarkers: function updateDiffMarkers() {
    var _computeDiffLinesAndOffsets2 = this._computeDiffLinesAndOffsets();

    var addedLines = _computeDiffLinesAndOffsets2.addedLines;
    var removedLines = _computeDiffLinesAndOffsets2.removedLines;
    var newLineOffsets = _computeDiffLinesAndOffsets2.newLineOffsets;
    var oldLineOffsets = _computeDiffLinesAndOffsets2.oldLineOffsets;

    // Set the empty space offsets in the diff editors marking for no-matching diff section.
    this._newDiffEditor.setOffsets(newLineOffsets);
    this._oldDiffEditor.setOffsets(oldLineOffsets);

    // Set highlighted lines in the diff editors marking the added and deleted lines.
    // This trigges a redraw for the editor, hence being done after the offsets have been set.
    this._newDiffEditor.setHighlightedLines(addedLines, undefined);
    this._oldDiffEditor.setHighlightedLines(undefined, removedLines);
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this._subscriptions) {
      this._subscriptions.dispose();
      this._subscriptions = null;
    }
  },

  render: function render() {
    return React.createElement(
      'div',
      { className: 'diff-view-component' },
      React.createElement(
        'div',
        { className: 'split-pane' },
        React.createElement(
          'div',
          { className: 'title' },
          React.createElement(
            'p',
            null,
            'Original'
          )
        ),
        React.createElement('atom-text-editor', { ref: 'old', style: { height: '100%' } })
      ),
      React.createElement(
        'div',
        { className: 'split-pane' },
        React.createElement(
          'div',
          { className: 'title' },
          React.createElement(
            'p',
            null,
            'Changed'
          )
        ),
        React.createElement('atom-text-editor', { ref: 'new', style: { height: '100%' } })
      )
    );
  },

  _getOldTextEditorElement: function _getOldTextEditorElement() {
    return this.refs['old'].getDOMNode();
  },

  _getNewTextEditorElement: function _getNewTextEditorElement() {
    return this.refs['new'].getDOMNode();
  }

});

module.exports = DiffViewComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdDb21wb25lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7O2VBV2dCLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXRDLG1CQUFtQixZQUFuQixtQkFBbUI7O0FBQ3hCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2pDLFNBQVMsR0FBSSxLQUFLLENBQWxCLFNBQVM7O0FBRWQsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDOzs7QUFDeEMsV0FBUyxFQUFFO0FBQ1QsU0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsVUFBVTtHQUNuQzs7QUFFRCxtQkFBaUIsRUFBQSw2QkFBRztBQUNsQixRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksbUJBQW1CLEVBQUUsQ0FBQzs7QUFFaEQsUUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUM7O0FBRWpELFFBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQztBQUMxRSxRQUFJLENBQUMsY0FBYyxHQUFHLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDLENBQUM7Ozs7QUFJMUUsUUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNsQyxRQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUVsQyxRQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMvQyxPQUFPLEdBQXFDLGFBQWEsQ0FBekQsT0FBTztRQUFFLE9BQU8s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QyxPQUFPLEdBQUcsaUJBQWlCLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtZGlmZi12aWV3L2xpYi9EaWZmVmlld0NvbXBvbmVudC5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xudmFyIHtQcm9wVHlwZXN9ID0gUmVhY3Q7XG5cbnZhciBEaWZmVmlld0NvbXBvbmVudCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgcHJvcFR5cGVzOiB7XG4gICAgbW9kZWw6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgIHZhciBEaWZmVmlld0VkaXRvciA9IHJlcXVpcmUoJy4vRGlmZlZpZXdFZGl0b3InKTtcblxuICAgIHRoaXMuX29sZERpZmZFZGl0b3IgPSBuZXcgRGlmZlZpZXdFZGl0b3IodGhpcy5fZ2V0T2xkVGV4dEVkaXRvckVsZW1lbnQoKSk7XG4gICAgdGhpcy5fbmV3RGlmZkVkaXRvciA9IG5ldyBEaWZmVmlld0VkaXRvcih0aGlzLl9nZXROZXdUZXh0RWRpdG9yRWxlbWVudCgpKTtcblxuICAgIC8vIFRoZSBmaXJzdCB2ZXJzaW9uIG9mIHRoZSBkaWZmIHZpZXcgd2lsbCBoYXZlIGJvdGggZWRpdG9ycyByZWFkb25seS5cbiAgICAvLyBCdXQgbGF0ZXIgb24sIHRoZSByaWdodCBlZGl0b3Igd2lsbCBiZSBlZGl0YWJsZSBhbmQgc2F2YWJsZS5cbiAgICB0aGlzLl9vbGREaWZmRWRpdG9yLnNldFJlYWRPbmx5KCk7XG4gICAgdGhpcy5fbmV3RGlmZkVkaXRvci5zZXRSZWFkT25seSgpO1xuXG4gICAgdmFyIGRpZmZWaWV3U3RhdGUgPSB0aGlzLnByb3BzLm1vZGVsLmdldERpZmZTdGF0ZSgpO1xuICAgIHZhciB7b2xkVGV4dCwgbmV3VGV4dCwgZmlsZVBhdGgsIHVpQ29tcG9uZW50c30gPSBkaWZmVmlld1N0YXRlO1xuICAgIHRoaXMuX29sZERpZmZFZGl0b3Iuc2V0RmlsZUNvbnRlbnRzKGZpbGVQYXRoLCBvbGRUZXh0KTtcbiAgICB0aGlzLl9uZXdEaWZmRWRpdG9yLnNldEZpbGVDb250ZW50cyhmaWxlUGF0aCwgbmV3VGV4dCk7XG5cblxuICAgIHZhciBTeW5jU2Nyb2xsID0gcmVxdWlyZSgnLi9TeW5jU2Nyb2xsJyk7XG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5hZGQobmV3IFN5bmNTY3JvbGwoXG4gICAgICAgIHRoaXMuX2dldE9sZFRleHRFZGl0b3JFbGVtZW50KCkuZ2V0TW9kZWwoKSxcbiAgICAgICAgdGhpcy5fZ2V0TmV3VGV4dEVkaXRvckVsZW1lbnQoKS5nZXRNb2RlbCgpXG4gICAgICApXG4gICAgKTtcblxuICAgIHRoaXMuX2lubGluZUNvbXBvbmVudHMgPSB0aGlzLl9vbGREaWZmRWRpdG9yLnJlbmRlckNvbXBvbmVudHNJbmxpbmUodWlDb21wb25lbnRzKTtcbiAgfSxcblxuICBfY29tcHV0ZURpZmZMaW5lc0FuZE9mZnNldHMoKSB7XG4gICAgdmFyIHthZGRlZExpbmVzLCByZW1vdmVkTGluZXMsIG9sZExpbmVPZmZzZXRzLCBuZXdMaW5lT2Zmc2V0c30gPVxuICAgICAgICB0aGlzLnByb3BzLm1vZGVsLmNvbXB1dGVEaWZmKHRoaXMuX29sZERpZmZFZGl0b3IuZ2V0VGV4dCgpLCB0aGlzLl9uZXdEaWZmRWRpdG9yLmdldFRleHQoKSk7XG5cbiAgICB0aGlzLl9pbmxpbmVDb21wb25lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICB2YXIgZG9tTm9kZSA9IFJlYWN0LmZpbmRET01Ob2RlKGVsZW1lbnQuY29tcG9uZW50KTtcbiAgICAgIC8vIGdldCB0aGUgaGVpZ2h0IG9mIHRoZSBjb21wb25lbnQgYWZ0ZXIgaXQgaGFzIGJlZW4gcmVuZGVyZWQgaW4gdGhlIERPTVxuICAgICAgdmFyIGNvbXBvbmVudEhlaWdodCA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvbU5vZGUpLmhlaWdodDtcbiAgICAgIC8vIFwiMTIzcHhcIiAtPiAxMjNcbiAgICAgIGNvbXBvbmVudEhlaWdodCA9IE51bWJlcihjb21wb25lbnRIZWlnaHQuc3Vic3RyaW5nKDAsIGNvbXBvbmVudEhlaWdodC5sZW5ndGggLSAyKSk7XG4gICAgICB2YXIgbGluZUhlaWdodCA9IHRoaXMuX29sZERpZmZFZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG4gICAgICAvLyBjYWxjdWxhdGUgdGhlIG51bWJlciBvZiBsaW5lcyB3ZSBuZWVkIHRvIGluc2VydCBpbiB0aGUgYnVmZmVyIHRvIG1ha2Ugcm9vbVxuICAgICAgLy8gZm9yIHRoZSBjb21wb25lbnQgdG8gYmUgZGlzcGxheWVkXG4gICAgICB2YXIgb2Zmc2V0ID0gTWF0aC5jZWlsKGNvbXBvbmVudEhlaWdodCAvIGxpbmVIZWlnaHQpO1xuICAgICAgdmFyIG9mZnNldFJvdyA9IGVsZW1lbnQuYnVmZmVyUm93O1xuXG4gICAgICBuZXdMaW5lT2Zmc2V0c1tvZmZzZXRSb3ddID0gKG5ld0xpbmVPZmZzZXRzW29mZnNldFJvd10gfHwgMCkgKyBvZmZzZXQ7XG4gICAgICBvbGRMaW5lT2Zmc2V0c1tvZmZzZXRSb3ddID0gKG9sZExpbmVPZmZzZXRzW29mZnNldFJvd10gfHwgMCkgKyBvZmZzZXQ7XG5cbiAgICAgIC8vIFRPRE8oZ2VuZHJvbik6XG4gICAgICAvLyBob3JyaWJsZSBoYWNrISBTZXQgdGhlIHdpZHRoIG9mIHRoZSBvdmVybGF5IHNvIHRoYXQgaXQgd29uJ3QgcmVzaXplIHdoZW4gd2VcbiAgICAgIC8vIHR5cGUgY29tbWVudCByZXBsaWVzIGludG8gdGhlIHRleHQgZWRpdG9yLlxuICAgICAgLy8gTmVlZCB0byBmaWd1cmUgb3V0IGhvdyBBdG9tIGNvbXB1dGVzIGFuZCBzZXRzIHRoZSBvdmVybGF5IGRpbWVuc2lvbnMuXG4gICAgICB2YXIgY29tcG9uZW50V2lkdGggPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb21Ob2RlKS53aWR0aDtcbiAgICAgIGRvbU5vZGUuc3R5bGUud2lkdGggPSBjb21wb25lbnRXaWR0aDtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBhZGRlZExpbmVzLFxuICAgICAgcmVtb3ZlZExpbmVzLFxuICAgICAgbmV3TGluZU9mZnNldHMsXG4gICAgICBvbGRMaW5lT2Zmc2V0cyxcbiAgICB9O1xuICB9LFxuXG4gIHVwZGF0ZURpZmZNYXJrZXJzKCkge1xuICAgIHZhciB7YWRkZWRMaW5lcywgcmVtb3ZlZExpbmVzLCBuZXdMaW5lT2Zmc2V0cywgb2xkTGluZU9mZnNldHN9ID0gdGhpcy5fY29tcHV0ZURpZmZMaW5lc0FuZE9mZnNldHMoKTtcbiAgICAvLyBTZXQgdGhlIGVtcHR5IHNwYWNlIG9mZnNldHMgaW4gdGhlIGRpZmYgZWRpdG9ycyBtYXJraW5nIGZvciBuby1tYXRjaGluZyBkaWZmIHNlY3Rpb24uXG4gICAgdGhpcy5fbmV3RGlmZkVkaXRvci5zZXRPZmZzZXRzKG5ld0xpbmVPZmZzZXRzKTtcbiAgICB0aGlzLl9vbGREaWZmRWRpdG9yLnNldE9mZnNldHMob2xkTGluZU9mZnNldHMpO1xuXG4gICAgLy8gU2V0IGhpZ2hsaWdodGVkIGxpbmVzIGluIHRoZSBkaWZmIGVkaXRvcnMgbWFya2luZyB0aGUgYWRkZWQgYW5kIGRlbGV0ZWQgbGluZXMuXG4gICAgLy8gVGhpcyB0cmlnZ2VzIGEgcmVkcmF3IGZvciB0aGUgZWRpdG9yLCBoZW5jZSBiZWluZyBkb25lIGFmdGVyIHRoZSBvZmZzZXRzIGhhdmUgYmVlbiBzZXQuXG4gICAgdGhpcy5fbmV3RGlmZkVkaXRvci5zZXRIaWdobGlnaHRlZExpbmVzKGFkZGVkTGluZXMsIHVuZGVmaW5lZCk7XG4gICAgdGhpcy5fb2xkRGlmZkVkaXRvci5zZXRIaWdobGlnaHRlZExpbmVzKHVuZGVmaW5lZCwgcmVtb3ZlZExpbmVzKTtcbiAgfSxcblxuICBjb21wb25lbnRXaWxsVW5tb3VudCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fc3Vic2NyaXB0aW9ucykge1xuICAgICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5kaXNwb3NlKCk7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbnVsbDtcbiAgICB9XG4gIH0sXG5cbiAgcmVuZGVyKCk6IFJlYWN0RWxlbWVudCB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdkaWZmLXZpZXctY29tcG9uZW50Jz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J3NwbGl0LXBhbmUnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSd0aXRsZSc+XG4gICAgICAgICAgICA8cD5PcmlnaW5hbDwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8YXRvbS10ZXh0LWVkaXRvciByZWY9J29sZCcgc3R5bGU9e3toZWlnaHQ6ICcxMDAlJ319IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nc3BsaXQtcGFuZSc+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J3RpdGxlJz5cbiAgICAgICAgICAgIDxwPkNoYW5nZWQ8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGF0b20tdGV4dC1lZGl0b3IgcmVmPSduZXcnIHN0eWxlPXt7aGVpZ2h0OiAnMTAwJSd9fSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgX2dldE9sZFRleHRFZGl0b3JFbGVtZW50KCk6IFRleHRFZGl0b3JFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5yZWZzWydvbGQnXS5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbiAgX2dldE5ld1RleHRFZGl0b3JFbGVtZW50KCk6IFRleHRFZGl0b3JFbGVtZW50IHtcbiAgICByZXR1cm4gdGhpcy5yZWZzWyduZXcnXS5nZXRET01Ob2RlKCk7XG4gIH0sXG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERpZmZWaWV3Q29tcG9uZW50O1xuIl19
