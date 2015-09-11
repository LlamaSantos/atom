
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var AtomInput = require('nuclide-ui-atom-input');

var _require = require('atom');

var CompositeDisposable = _require.CompositeDisposable;

var path = require('path');
var React = require('react-for-atom');

var PropTypes = React.PropTypes;

/**
 * Component that displays UI to create a new file.
 */
var FileDialogComponent = React.createClass({
  displayName: 'FileDialogComponent',

  _subscriptions: null,

  propTypes: {
    rootDirectory: PropTypes.object.isRequired,
    // The File or Directory to prepopulate the input with.
    initialEntry: PropTypes.object.isRequired,
    // Label for the message above the input. Will be displayed to the user.
    message: PropTypes.element.isRequired,
    // Will be called if the user confirms the 'add' action. Will be called before `onClose`.
    onConfirm: PropTypes.func.isRequired,
    // Will be called regardless of whether the user confirms.
    onClose: PropTypes.func.isRequired,
    // Whether or not to initially select the base name of the path.
    // This is useful for renaming files.
    shouldSelectBasename: PropTypes.bool
  },

  getDefaultProps: function getDefaultProps() {
    return {
      shouldSelectBasename: false
    };
  },

  componentDidMount: function componentDidMount() {
    this._isClosed = false;

    this._subscriptions = new CompositeDisposable();

    var component = this.refs['entryPath'];
    var element = component.getDOMNode();
    this._subscriptions.add(atom.commands.add(element, {
      'core:confirm': this.confirm,
      'core:cancel': this.close
    }));

    var entryPath = this.props.rootDirectory.relativize(this.props.initialEntry.getPath());
    if (entryPath !== '' && this.props.initialEntry.isDirectory()) {
      entryPath = path.normalize(entryPath + '/');
    }

    component.focus();

    var editor = component.getTextEditor();
    component.setText(entryPath);
    if (this.props.shouldSelectBasename) {
      var _path$parse = path.parse(entryPath);

      var base = _path$parse.base;
      var name = _path$parse.name;
      var dir = _path$parse.dir;

      var selectionStart = dir ? dir.length + 1 : 0;
      var selectionEnd = selectionStart + name.length;
      editor.setSelectedBufferRange([[0, selectionStart], [0, selectionEnd]]);
    }
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this._subscriptions) {
      this._subscriptions.dispose();
      this._subscriptions = null;
    }
  },

  render: function render() {
    // The root element cannot have a 'key' property, so we use a dummy
    // <div> as the root. Ideally, the <atom-panel> would be the root.
    return React.createElement(
      'div',
      null,
      React.createElement(
        'atom-panel',
        { className: 'modal from-top', key: 'add-dialog' },
        React.createElement(
          'label',
          null,
          this.props.message
        ),
        React.createElement(AtomInput, { ref: 'entryPath', onBlur: this.close })
      )
    );
  },

  confirm: function confirm() {
    this.props.onConfirm(this.props.rootDirectory, this.refs['entryPath'].getText());
    this.close();
  },

  close: function close() {
    if (!this._isClosed) {
      this._isClosed = true;
      this.props.onClose();
    }
  }
});

module.exports = FileDialogComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZpbGUtdHJlZS9saWIvRmlsZURpYWxvZ0NvbXBvbmVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7QUFXWixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQzs7ZUFDckIsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBdEMsbUJBQW1CLFlBQW5CLG1CQUFtQjs7QUFDeEIsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzNCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztJQUVqQyxTQUFTLEdBQUksS0FBSyxDQUFsQixTQUFTOzs7OztBQUtkLElBQUksbUJBQW1CLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQzs7O0FBQzFDLGdCQUFjLEVBQUcsSUFBSSxBQUF1Qjs7QUFFNUMsV0FBUyxFQUFFO0FBQ1QsaUJBQWEsRUFBRSxTQUFTLENBQUMsTUFBTSxDQUFDLFVBQVU7O0FBRTFDLGdCQUFZLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxVQUFVOztBQUV6QyxXQUFPLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVOztBQUVyQyxhQUFTLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVOztBQUVwQyxXQUFPLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVOzs7QUFHbEMsd0JBQW9CLEVBQUUsU0FBUyxDQUFDLElBQUk7R0FDckM7O0FBRUQsaUJBQWUsRUFBQSwyQkFBMkI7QUFDeEMsV0FBTztBQUNMLDBCQUFvQixFQUFFLEtBQUs7S0FDNUIsQ0FBQztHQUNIOztBQUVELG1CQUFpQixFQUFBLDZCQUFHO0FBQ2xCLFFBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxD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RyxtQkFBbUIsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1maWxlLXRyZWUvbGliL0ZpbGVEaWFsb2dDb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgQXRvbUlucHV0ID0gcmVxdWlyZSgnbnVjbGlkZS11aS1hdG9tLWlucHV0Jyk7XG52YXIge0NvbXBvc2l0ZURpc3Bvc2FibGV9ID0gcmVxdWlyZSgnYXRvbScpO1xudmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdC1mb3ItYXRvbScpO1xuXG52YXIge1Byb3BUeXBlc30gPSBSZWFjdDtcblxuLyoqXG4gKiBDb21wb25lbnQgdGhhdCBkaXNwbGF5cyBVSSB0byBjcmVhdGUgYSBuZXcgZmlsZS5cbiAqL1xudmFyIEZpbGVEaWFsb2dDb21wb25lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIF9zdWJzY3JpcHRpb25zOiAobnVsbDogP0NvbXBvc2l0ZURpc3Bvc2FibGUpLFxuXG4gIHByb3BUeXBlczoge1xuICAgIHJvb3REaXJlY3Rvcnk6IFByb3BUeXBlcy5vYmplY3QuaXNSZXF1aXJlZCxcbiAgICAvLyBUaGUgRmlsZSBvciBEaXJlY3RvcnkgdG8gcHJlcG9wdWxhdGUgdGhlIGlucHV0IHdpdGguXG4gICAgaW5pdGlhbEVudHJ5OiBQcm9wVHlwZXMub2JqZWN0LmlzUmVxdWlyZWQsXG4gICAgLy8gTGFiZWwgZm9yIHRoZSBtZXNzYWdlIGFib3ZlIHRoZSBpbnB1dC4gV2lsbCBiZSBkaXNwbGF5ZWQgdG8gdGhlIHVzZXIuXG4gICAgbWVzc2FnZTogUHJvcFR5cGVzLmVsZW1lbnQuaXNSZXF1aXJlZCxcbiAgICAvLyBXaWxsIGJlIGNhbGxlZCBpZiB0aGUgdXNlciBjb25maXJtcyB0aGUgJ2FkZCcgYWN0aW9uLiBXaWxsIGJlIGNhbGxlZCBiZWZvcmUgYG9uQ2xvc2VgLlxuICAgIG9uQ29uZmlybTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAvLyBXaWxsIGJlIGNhbGxlZCByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHVzZXIgY29uZmlybXMuXG4gICAgb25DbG9zZTogUHJvcFR5cGVzLmZ1bmMuaXNSZXF1aXJlZCxcbiAgICAvLyBXaGV0aGVyIG9yIG5vdCB0byBpbml0aWFsbHkgc2VsZWN0IHRoZSBiYXNlIG5hbWUgb2YgdGhlIHBhdGguXG4gICAgLy8gVGhpcyBpcyB1c2VmdWwgZm9yIHJlbmFtaW5nIGZpbGVzLlxuICAgIHNob3VsZFNlbGVjdEJhc2VuYW1lOiBQcm9wVHlwZXMuYm9vbCxcbiAgfSxcblxuICBnZXREZWZhdWx0UHJvcHMoKToge1trZXk6IHN0cmluZ106IG1peGVkfSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNob3VsZFNlbGVjdEJhc2VuYW1lOiBmYWxzZSxcbiAgICB9O1xuICB9LFxuXG4gIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgIHZhciBjb21wb25lbnQgPSB0aGlzLnJlZnNbJ2VudHJ5UGF0aCddO1xuICAgIHZhciBlbGVtZW50ID0gY29tcG9uZW50LmdldERPTU5vZGUoKTtcbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcbiAgICAgICAgZWxlbWVudCxcbiAgICAgICAge1xuICAgICAgICAgICdjb3JlOmNvbmZpcm0nOiB0aGlzLmNvbmZpcm0sXG4gICAgICAgICAgJ2NvcmU6Y2FuY2VsJzogdGhpcy5jbG9zZSxcbiAgICAgICAgfSkpO1xuXG4gICAgdmFyIGVudHJ5UGF0aCA9IHRoaXMucHJvcHMucm9vdERpcmVjdG9yeS5yZWxhdGl2aXplKHRoaXMucHJvcHMuaW5pdGlhbEVudHJ5LmdldFBhdGgoKSk7XG4gICAgaWYgKGVudHJ5UGF0aCAhPT0gJycgJiYgdGhpcy5wcm9wcy5pbml0aWFsRW50cnkuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgZW50cnlQYXRoID0gcGF0aC5ub3JtYWxpemUoZW50cnlQYXRoICsgJy8nKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnQuZm9jdXMoKTtcblxuICAgIHZhciBlZGl0b3IgPSBjb21wb25lbnQuZ2V0VGV4dEVkaXRvcigpO1xuICAgIGNvbXBvbmVudC5zZXRUZXh0KGVudHJ5UGF0aCk7XG4gICAgaWYgKHRoaXMucHJvcHMuc2hvdWxkU2VsZWN0QmFzZW5hbWUpIHtcbiAgICAgIHZhciB7YmFzZSwgbmFtZSwgZGlyfSA9IHBhdGgucGFyc2UoZW50cnlQYXRoKTtcbiAgICAgIHZhciBzZWxlY3Rpb25TdGFydCA9IGRpciA/IGRpci5sZW5ndGggKyAxIDogMDtcbiAgICAgIHZhciBzZWxlY3Rpb25FbmQgPSBzZWxlY3Rpb25TdGFydCArIG5hbWUubGVuZ3RoO1xuICAgICAgZWRpdG9yLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2UoW1swLCBzZWxlY3Rpb25TdGFydF0sIFswLCBzZWxlY3Rpb25FbmRdXSk7XG4gICAgfVxuICB9LFxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIGlmICh0aGlzLl9zdWJzY3JpcHRpb25zKSB7XG4gICAgICB0aGlzLl9zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBudWxsO1xuICAgIH1cbiAgfSxcblxuICByZW5kZXIoKTogUmVhY3RFbGVtZW50IHtcbiAgICAvLyBUaGUgcm9vdCBlbGVtZW50IGNhbm5vdCBoYXZlIGEgJ2tleScgcHJvcGVydHksIHNvIHdlIHVzZSBhIGR1bW15XG4gICAgLy8gPGRpdj4gYXMgdGhlIHJvb3QuIElkZWFsbHksIHRoZSA8YXRvbS1wYW5lbD4gd291bGQgYmUgdGhlIHJvb3QuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxhdG9tLXBhbmVsIGNsYXNzTmFtZT0nbW9kYWwgZnJvbS10b3AnIGtleT0nYWRkLWRpYWxvZyc+XG4gICAgICAgICAgPGxhYmVsPnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9sYWJlbD5cbiAgICAgICAgICA8QXRvbUlucHV0IHJlZj0nZW50cnlQYXRoJyBvbkJsdXI9e3RoaXMuY2xvc2V9IC8+XG4gICAgICAgIDwvYXRvbS1wYW5lbD5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH0sXG5cbiAgY29uZmlybSgpIHtcbiAgICB0aGlzLnByb3BzLm9uQ29uZmlybSh0aGlzLnByb3BzLnJvb3REaXJlY3RvcnksIHRoaXMucmVmc1snZW50cnlQYXRoJ10uZ2V0VGV4dCgpKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH0sXG5cbiAgY2xvc2UoKSB7XG4gICAgaWYgKCF0aGlzLl9pc0Nsb3NlZCkge1xuICAgICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuICAgICAgdGhpcy5wcm9wcy5vbkNsb3NlKCk7XG4gICAgfVxuICB9LFxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmlsZURpYWxvZ0NvbXBvbmVudDtcbiJdfQ==
