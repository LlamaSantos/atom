
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

var _require = require('nuclide-atom-helpers');

var extractWordAtPosition = _require.extractWordAtPosition;

var _require2 = require('nuclide-client');

var getServiceByNuclideUri = _require2.getServiceByNuclideUri;

var _require3 = require('atom');

var Range = _require3.Range;

var _require4 = require('nuclide-commons');

var getConfigValueAsync = _require4.getConfigValueAsync;

var JAVASCRIPT_WORD_REGEX = /[a-zA-Z0-9_$]+/g;

module.exports = (function () {
  function TypeHintProvider() {
    _classCallCheck(this, TypeHintProvider);
  }

  _createClass(TypeHintProvider, [{
    key: 'typeHint',
    value: _asyncToGenerator(function* (editor, position) {
      var enabled = yield getConfigValueAsync('nuclide-flow.enableTypeHints')();
      if (!enabled) {
        return null;
      }
      var filePath = editor.getPath();
      var contents = editor.getText();
      var flowService = yield getServiceByNuclideUri('FlowService', filePath);

      var type = yield flowService.getType(filePath, contents, position.row, position.column);
      if (type === null) {
        return null;
      }

      // TODO(nmote) refine this regex to better capture JavaScript expressions.
      // Having this regex be not quite right is just a display issue, though --
      // it only affects the location of the tooltip.
      var word = extractWordAtPosition(editor, position, JAVASCRIPT_WORD_REGEX);
      var range;
      if (word) {
        range = word.range;
      } else {
        range = new Range(position, position);
      }
      return {
        hint: type,
        range: range
      };
    })
  }]);

  return TypeHintProvider;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZsb3cvbGliL1R5cGVIaW50UHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O2VBV2tCLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzs7SUFBeEQscUJBQXFCLFlBQXJCLHFCQUFxQjs7Z0JBQ0ssT0FBTyxDQUFDLGdCQUFnQixDQUFDOztJQUFuRCxzQkFBc0IsYUFBdEIsc0JBQXNCOztnQkFDYixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUF4QixLQUFLLGFBQUwsS0FBSzs7Z0JBQ2tCLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzs7SUFBakQsbUJBQW1CLGFBQW5CLG1CQUFtQjs7QUFFeEIsSUFBTSxxQkFBcUIsR0FBRyxpQkFBaUIsQ0FBQzs7QUFFaEQsTUFBTSxDQUFDLE9BQU87V0FBUyxnQkFBZ0I7MEJBQWhCLGdCQUFnQjs7O2VBQWhCLGdCQUFnQjs7NkJBRXZCLFdBQUMsTUFBa0IsRUFBRSxRQUFlLEVBQXNCO0FBQ3RFLFVBQUksT0FBTyxHQUFHLE1BQU0sbUJBQW1CLENBQUMsOEJBQThCLENBQUMsRUFBRSxDQUFDO0FBQzFFLFVBQUksQ0FBQyxPQUFPLEVBQUU7QUFDWixlQUFPLElBQUksQ0FBQztPQUNiO0FBQ0QsVUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFVBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoQyxVQUFJLFdBQVcsR0FBRyxNQUFNLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQzs7QUFFeEUsVUFBSSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDeEYsVUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQ2pCLGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7O0FBS0QsVUFBSSxJQUFJLEdBQUcscUJBQXFCLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0FBQzFFLFVBQUksS0FBSyxDQUFDO0FBQ1YsVUFBSSxJQUFJLEVBQUU7QUFDUixhQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztPQUNwQixNQUFNO0FBQ0wsYUFBSyxHQUFHLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztPQUN2QztBQUNELGFBQU87QUFDTCxZQUFJLEVBQUUsSUFBSTtBQUNWLGFBQUssRUFBTCxLQUFLO09BQ04sQ0FBQztLQUNIOzs7U0E5Qm9CLGdCQUFnQjtJQWdDdEMsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1mbG93L2xpYi9UeXBlSGludFByb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtleHRyYWN0V29yZEF0UG9zaXRpb259ID0gcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKTtcbnZhciB7Z2V0U2VydmljZUJ5TnVjbGlkZVVyaX0gPSByZXF1aXJlKCdudWNsaWRlLWNsaWVudCcpO1xudmFyIHtSYW5nZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIge2dldENvbmZpZ1ZhbHVlQXN5bmN9ID0gcmVxdWlyZSgnbnVjbGlkZS1jb21tb25zJyk7XG5cbmNvbnN0IEpBVkFTQ1JJUFRfV09SRF9SRUdFWCA9IC9bYS16QS1aMC05XyRdKy9nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzIFR5cGVIaW50UHJvdmlkZXIge1xuXG4gIGFzeW5jIHR5cGVIaW50KGVkaXRvcjogVGV4dEVkaXRvciwgcG9zaXRpb246IFBvaW50KTogUHJvbWlzZTw/VHlwZUhpbnQ+IHtcbiAgICB2YXIgZW5hYmxlZCA9IGF3YWl0IGdldENvbmZpZ1ZhbHVlQXN5bmMoJ251Y2xpZGUtZmxvdy5lbmFibGVUeXBlSGludHMnKSgpO1xuICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBmaWxlUGF0aCA9IGVkaXRvci5nZXRQYXRoKCk7XG4gICAgdmFyIGNvbnRlbnRzID0gZWRpdG9yLmdldFRleHQoKTtcbiAgICB2YXIgZmxvd1NlcnZpY2UgPSBhd2FpdCBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKCdGbG93U2VydmljZScsIGZpbGVQYXRoKTtcblxuICAgIHZhciB0eXBlID0gYXdhaXQgZmxvd1NlcnZpY2UuZ2V0VHlwZShmaWxlUGF0aCwgY29udGVudHMsIHBvc2l0aW9uLnJvdywgcG9zaXRpb24uY29sdW1uKTtcbiAgICBpZiAodHlwZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gVE9ETyhubW90ZSkgcmVmaW5lIHRoaXMgcmVnZXggdG8gYmV0dGVyIGNhcHR1cmUgSmF2YVNjcmlwdCBleHByZXNzaW9ucy5cbiAgICAvLyBIYXZpbmcgdGhpcyByZWdleCBiZSBub3QgcXVpdGUgcmlnaHQgaXMganVzdCBhIGRpc3BsYXkgaXNzdWUsIHRob3VnaCAtLVxuICAgIC8vIGl0IG9ubHkgYWZmZWN0cyB0aGUgbG9jYXRpb24gb2YgdGhlIHRvb2x0aXAuXG4gICAgdmFyIHdvcmQgPSBleHRyYWN0V29yZEF0UG9zaXRpb24oZWRpdG9yLCBwb3NpdGlvbiwgSkFWQVNDUklQVF9XT1JEX1JFR0VYKTtcbiAgICB2YXIgcmFuZ2U7XG4gICAgaWYgKHdvcmQpIHtcbiAgICAgIHJhbmdlID0gd29yZC5yYW5nZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmFuZ2UgPSBuZXcgUmFuZ2UocG9zaXRpb24sIHBvc2l0aW9uKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIGhpbnQ6IHR5cGUsXG4gICAgICByYW5nZSxcbiAgICB9O1xuICB9XG5cbn07XG4iXX0=
