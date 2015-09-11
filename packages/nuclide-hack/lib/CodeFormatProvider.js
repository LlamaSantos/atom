
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var hack = require('./hack');

var CodeFormatProvider = (function () {
  function CodeFormatProvider() {
    _classCallCheck(this, CodeFormatProvider);
  }

  _createClass(CodeFormatProvider, [{
    key: 'formatCode',
    value: function formatCode(editor, range) {
      return hack.formatSourceFromEditor(editor, range);
    }
  }]);

  return CodeFormatProvider;
})();

module.exports = CodeFormatProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL0NvZGVGb3JtYXRQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7O0FBV1osSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztJQUV2QixrQkFBa0I7V0FBbEIsa0JBQWtCOzBCQUFsQixrQkFBa0I7OztlQUFsQixrQkFBa0I7O1dBRVosb0JBQUMsTUFBa0IsRUFBRSxLQUFZLEVBQW1CO0FBQzVELGFBQU8sSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNuRDs7O1NBSkcsa0JBQWtCOzs7QUFReEIsTUFBTSxDQUFDLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1oYWNrL2xpYi9Db2RlRm9ybWF0UHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgaGFjayA9IHJlcXVpcmUoJy4vaGFjaycpO1xuXG5jbGFzcyBDb2RlRm9ybWF0UHJvdmlkZXIge1xuXG4gIGZvcm1hdENvZGUoZWRpdG9yOiBUZXh0RWRpdG9yLCByYW5nZTogUmFuZ2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBoYWNrLmZvcm1hdFNvdXJjZUZyb21FZGl0b3IoZWRpdG9yLCByYW5nZSk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvZGVGb3JtYXRQcm92aWRlcjtcbiJdfQ==
