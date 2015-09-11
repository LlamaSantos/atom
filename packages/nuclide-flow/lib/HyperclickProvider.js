
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _require = require('nuclide-client');

var getServiceByNuclideUri = _require.getServiceByNuclideUri;

var _require2 = require('nuclide-atom-helpers');

var goToLocation = _require2.goToLocation;

var _require3 = require('./constants.js');

var JS_GRAMMARS = _require3.JS_GRAMMARS;

var JS_GRAMMARS_SET = new Set(JS_GRAMMARS);

module.exports = {
  priority: 20,
  getSuggestionForWord: _asyncToGenerator(function* (textEditor, text, range) {
    if (!JS_GRAMMARS_SET.has(textEditor.getGrammar().scopeName)) {
      return null;
    }

    var file = textEditor.getPath();
    var position = range.start;

    var location = yield getServiceByNuclideUri('FlowService', file).findDefinition(file, textEditor.getText(), position.row + 1, position.column + 1);
    if (location) {
      return {
        range: range,
        callback: function callback() {
          goToLocation(location.file, location.line, location.column);
        }
      };
    } else {
      return null;
    }
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZsb3cvbGliL0h5cGVyY2xpY2tQcm92aWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7OztlQVVtQixPQUFPLENBQUMsZ0JBQWdCLENBQUM7O0lBQW5ELHNCQUFzQixZQUF0QixzQkFBc0I7O2dCQUNOLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQzs7SUFBL0MsWUFBWSxhQUFaLFlBQVk7O2dCQUVHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQzs7SUFBeEMsV0FBVyxhQUFYLFdBQVc7O0FBQ2hCLElBQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDOztBQUU3QyxNQUFNLENBQUMsT0FBTyxHQUFHO0FBQ2YsVUFBUSxFQUFFLEVBQUU7QUFDWixBQUFNLHNCQUFvQixvQkFBQSxXQUFDLFVBQXNCLEVBQUUsSUFBWSxFQUFFLEtBQVksRUFBRTtBQUM3RSxRQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDM0QsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxRQUFJLElBQUksR0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsUUFBUSxHQUFJLEtBQUssQ0FBeEIsS0FBSzs7QUFDVixRQUFJLFFBQVEsR0FBRyxNQUFNLHNCQUFzQixDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FDM0QsY0FBYyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN2RixRQUFJLFFBQVEsRUFBRTtBQUNaLGFBQU87QUFDTCxhQUFLLEVBQUwsS0FBSztBQUNMLGdCQUFRLEVBQUEsb0JBQUc7QUFDVCxzQkFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDN0Q7T0FDRixDQUFDO0tBQ0gsTUFBTTtBQUNMLGFBQU8sSUFBSSxDQUFDO0tBQ2I7R0FDRixDQUFBO0NBQ0YsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1mbG93L2xpYi9IeXBlcmNsaWNrUHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xudmFyIHtnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpfSA9IHJlcXVpcmUoJ251Y2xpZGUtY2xpZW50Jyk7XG52YXIge2dvVG9Mb2NhdGlvbn0gPSByZXF1aXJlKCdudWNsaWRlLWF0b20taGVscGVycycpO1xuXG52YXIge0pTX0dSQU1NQVJTfSA9IHJlcXVpcmUoJy4vY29uc3RhbnRzLmpzJyk7XG5jb25zdCBKU19HUkFNTUFSU19TRVQgPSBuZXcgU2V0KEpTX0dSQU1NQVJTKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByaW9yaXR5OiAyMCxcbiAgYXN5bmMgZ2V0U3VnZ2VzdGlvbkZvcldvcmQodGV4dEVkaXRvcjogVGV4dEVkaXRvciwgdGV4dDogc3RyaW5nLCByYW5nZTogUmFuZ2UpIHtcbiAgICBpZiAoIUpTX0dSQU1NQVJTX1NFVC5oYXModGV4dEVkaXRvci5nZXRHcmFtbWFyKCkuc2NvcGVOYW1lKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGZpbGUgPSB0ZXh0RWRpdG9yLmdldFBhdGgoKTtcbiAgICB2YXIge3N0YXJ0OiBwb3NpdGlvbn0gPSByYW5nZTtcbiAgICB2YXIgbG9jYXRpb24gPSBhd2FpdCBnZXRTZXJ2aWNlQnlOdWNsaWRlVXJpKCdGbG93U2VydmljZScsIGZpbGUpXG4gICAgICAgIC5maW5kRGVmaW5pdGlvbihmaWxlLCB0ZXh0RWRpdG9yLmdldFRleHQoKSwgcG9zaXRpb24ucm93ICsgMSwgcG9zaXRpb24uY29sdW1uICsgMSk7XG4gICAgaWYgKGxvY2F0aW9uKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByYW5nZSxcbiAgICAgICAgY2FsbGJhY2soKSB7XG4gICAgICAgICAgZ29Ub0xvY2F0aW9uKGxvY2F0aW9uLmZpbGUsIGxvY2F0aW9uLmxpbmUsIGxvY2F0aW9uLmNvbHVtbik7XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0sXG59O1xuIl19
