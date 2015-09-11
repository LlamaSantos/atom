
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

module.exports = (function () {
  function TypeHintProvider() {
    _classCallCheck(this, TypeHintProvider);
  }

  _createClass(TypeHintProvider, [{
    key: 'typeHint',
    value: function typeHint(editor, position) {
      return hack.typeHintFromEditor(editor, position);
    }
  }]);

  return TypeHintProvider;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL1R5cGVIaW50UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztBQVdaLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFN0IsTUFBTSxDQUFDLE9BQU87V0FBUyxnQkFBZ0I7MEJBQWhCLGdCQUFnQjs7O2VBQWhCLGdCQUFnQjs7V0FFN0Isa0JBQUMsTUFBa0IsRUFBRSxRQUFlLEVBQXFCO0FBQy9ELGFBQU8sSUFBSSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztLQUNsRDs7O1NBSm9CLGdCQUFnQjtJQU10QyxDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL1R5cGVIaW50UHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIgaGFjayA9IHJlcXVpcmUoJy4vaGFjaycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFR5cGVIaW50UHJvdmlkZXIge1xuXG4gIHR5cGVIaW50KGVkaXRvcjogVGV4dEVkaXRvciwgcG9zaXRpb246IFBvaW50KTogUHJvbWlzZTxUeXBlSGludD4ge1xuICAgIHJldHVybiBoYWNrLnR5cGVIaW50RnJvbUVkaXRvcihlZGl0b3IsIHBvc2l0aW9uKTtcbiAgfVxuXG59O1xuIl19
