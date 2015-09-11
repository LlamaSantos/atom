
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _require = require('atom');

var Point = _require.Point;
var Range = _require.Range;

var AutocompleteProvider = (function () {
  function AutocompleteProvider() {
    _classCallCheck(this, AutocompleteProvider);
  }

  _createClass(AutocompleteProvider, [{
    key: 'getAutocompleteSuggestions',
    value: _asyncToGenerator(function* (request) {
      var replacementPrefix = this.findPrefix(request.editor);
      if (!replacementPrefix) {
        return [];
      }

      var _require2 = require('./hack');

      var fetchCompletionsForEditor = _require2.fetchCompletionsForEditor;

      var completions = yield fetchCompletionsForEditor(request.editor, replacementPrefix);

      return completions.map(function (completion) {
        return {
          snippet: completion.matchSnippet,
          replacementPrefix: replacementPrefix,
          rightLabel: completion.matchType
        };
      });
    })
  }, {
    key: 'findPrefix',
    value: function findPrefix(editor) {
      var cursor = editor.getLastCursor();
      // We use custom wordRegex to adopt php variables starting with $.
      var currentRange = cursor.getCurrentWordBufferRange({ wordRegex: /(\$\w*)|\w+/ });
      // Current word might go beyond the cursor, so we cut it.
      var range = new Range(currentRange.start, new Point(cursor.getBufferRow(), cursor.getBufferColumn()));
      var prefix = editor.getTextInBufferRange(range).trim();
      // Prefix could just be $ or ends with string literal.
      if (prefix === '$' || !/[\W]$/.test(prefix)) {
        return prefix;
      } else {
        return '';
      }
    }
  }]);

  return AutocompleteProvider;
})();

module.exports = AutocompleteProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL0F1dG9jb21wbGV0ZVByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztlQVdTLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQS9CLEtBQUssWUFBTCxLQUFLO0lBQUUsS0FBSyxZQUFMLEtBQUs7O0lBRVgsb0JBQW9CO1dBQXBCLG9CQUFvQjswQkFBcEIsb0JBQW9COzs7ZUFBcEIsb0JBQW9COzs2QkFFUSxXQUM1QixPQUEwRixFQUNwQztBQUN4RCxVQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3hELFVBQUksQ0FBQyxpQkFBaUIsRUFBRTtBQUN0QixlQUFPLEVBQUUsQ0FBQztPQUNYOztzQkFFaUMsT0FBTyxDQUFDLFFBQVEsQ0FBQzs7VUFBOUMseUJBQXlCLGFBQXpCLHlCQUF5Qjs7QUFDOUIsVUFBSSxXQUFXLEdBQUcsTUFBTSx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLGlCQUFpQixDQUFDLENBQUM7O0FBRXJGLGFBQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFBLFVBQVUsRUFBSTtBQUNuQyxlQUFPO0FBQ0wsaUJBQU8sRUFBRSxVQUFVLENBQUMsWUFBWTtBQUNoQywyQkFBaUIsRUFBakIsaUJBQWlCO0FBQ2pCLG9CQUFVLEVBQUUsVUFBVSxDQUFDLFNBQVM7U0FDakMsQ0FBQztPQUNILENBQUMsQ0FBQztLQUNKOzs7V0FFUyxvQkFBQyxNQUFrQixFQUFVO0FBQ3JDLFVBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxhQUFhLEVBQUUsQ0FBQzs7QUFFcEMsVUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLHlCQUF5QixDQUFDLEVBQUMsU0FBUyxFQUFDLGFBQWEsRUFBQyxDQUFDLENBQUM7O0FBRS9FLFVBQUksS0FBSyxHQUFHLElBQUksS0FBSyxDQUNqQixZQUFZLENBQUMsS0FBSyxFQUNsQixJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLEVBQUUsTUFBTSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNoRSxVQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRXZELFVBQUksTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDM0MsZUFBTyxNQUFNLENBQUM7T0FDZixNQUFNO0FBQ0wsZUFBTyxFQUFFLENBQUM7T0FDWDtLQUNGOzs7U0FyQ0csb0JBQW9COzs7QUF3QzFCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsb0JBQW9CLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtaGFjay9saWIvQXV0b2NvbXBsZXRlUHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG52YXIge1BvaW50LCBSYW5nZX0gPSByZXF1aXJlKCdhdG9tJyk7XG5cbmNsYXNzIEF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcblxuICBhc3luYyBnZXRBdXRvY29tcGxldGVTdWdnZXN0aW9ucyhcbiAgICAgIHJlcXVlc3Q6IHtlZGl0b3I6IFRleHRFZGl0b3I7IGJ1ZmZlclBvc2l0aW9uOiBQb2ludDsgc2NvcGVEZXNjcmlwdG9yOiBhbnk7IHByZWZpeDogc3RyaW5nfSk6XG4gICAgICBQcm9taXNlPEFycmF5PHtzbmlwcGV0OiBzdHJpbmc7IHJpZ2h0TGFiZWw6IHN0cmluZ30+PiB7XG4gICAgdmFyIHJlcGxhY2VtZW50UHJlZml4ID0gdGhpcy5maW5kUHJlZml4KHJlcXVlc3QuZWRpdG9yKTtcbiAgICBpZiAoIXJlcGxhY2VtZW50UHJlZml4KSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgdmFyIHtmZXRjaENvbXBsZXRpb25zRm9yRWRpdG9yfSA9IHJlcXVpcmUoJy4vaGFjaycpO1xuICAgIHZhciBjb21wbGV0aW9ucyA9IGF3YWl0IGZldGNoQ29tcGxldGlvbnNGb3JFZGl0b3IocmVxdWVzdC5lZGl0b3IsIHJlcGxhY2VtZW50UHJlZml4KTtcblxuICAgIHJldHVybiBjb21wbGV0aW9ucy5tYXAoY29tcGxldGlvbiA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzbmlwcGV0OiBjb21wbGV0aW9uLm1hdGNoU25pcHBldCxcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXG4gICAgICAgIHJpZ2h0TGFiZWw6IGNvbXBsZXRpb24ubWF0Y2hUeXBlLFxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIGZpbmRQcmVmaXgoZWRpdG9yOiBUZXh0RWRpdG9yKTogc3RyaW5nIHtcbiAgICB2YXIgY3Vyc29yID0gZWRpdG9yLmdldExhc3RDdXJzb3IoKTtcbiAgICAvLyBXZSB1c2UgY3VzdG9tIHdvcmRSZWdleCB0byBhZG9wdCBwaHAgdmFyaWFibGVzIHN0YXJ0aW5nIHdpdGggJC5cbiAgICB2YXIgY3VycmVudFJhbmdlID0gY3Vyc29yLmdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2Uoe3dvcmRSZWdleDovKFxcJFxcdyopfFxcdysvfSk7XG4gICAgLy8gQ3VycmVudCB3b3JkIG1pZ2h0IGdvIGJleW9uZCB0aGUgY3Vyc29yLCBzbyB3ZSBjdXQgaXQuXG4gICAgdmFyIHJhbmdlID0gbmV3IFJhbmdlKFxuICAgICAgICBjdXJyZW50UmFuZ2Uuc3RhcnQsXG4gICAgICAgIG5ldyBQb2ludChjdXJzb3IuZ2V0QnVmZmVyUm93KCksIGN1cnNvci5nZXRCdWZmZXJDb2x1bW4oKSkpO1xuICAgIHZhciBwcmVmaXggPSBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpLnRyaW0oKTtcbiAgICAvLyBQcmVmaXggY291bGQganVzdCBiZSAkIG9yIGVuZHMgd2l0aCBzdHJpbmcgbGl0ZXJhbC5cbiAgICBpZiAocHJlZml4ID09PSAnJCcgfHwgIS9bXFxXXSQvLnRlc3QocHJlZml4KSkge1xuICAgICAgcmV0dXJuIHByZWZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dG9jb21wbGV0ZVByb3ZpZGVyO1xuIl19
