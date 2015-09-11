
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

// We can't pull in nuclide-find-references as a dependency, unfortunately.
// import type {FindReferencesData} from 'nuclide-find-references';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _require = require('./hack');

var _findReferences = _require.findReferences;

var _require2 = require('nuclide-hack-common');

var HACK_GRAMMAR = _require2.HACK_GRAMMAR;

module.exports = {
  findReferences: _asyncToGenerator(function* (textEditor, position) /*FindReferencesData*/{
    var fileUri = textEditor.getPath();
    if (!fileUri || HACK_GRAMMAR !== textEditor.getGrammar().scopeName) {
      return null;
    }

    var result = yield _findReferences(textEditor, position.row, position.column);
    if (!result) {
      throw new Error('Could not find references.');
    }

    var baseUri = result.baseUri;
    var symbolName = result.symbolName;
    var references = result.references;

    if (!references.length) {
      throw new Error('No references found.');
    }

    // Process this into the format nuclide-find-references expects.
    references = references.map(function (ref) {
      return {
        uri: ref.filename,
        name: null, // TODO(hansonw): Get the caller when it's available
        start: {
          line: ref.line,
          column: ref.char_start
        },
        end: {
          line: ref.line,
          column: ref.char_end
        }
      };
    });

    // Strip off the global namespace indicator.
    if (symbolName.startsWith('\\')) {
      symbolName = symbolName.slice(1);
    }

    return {
      baseUri: baseUri,
      referencedSymbolName: symbolName,
      references: references
    };
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL0ZpbmRSZWZlcmVuY2VzUHJvdmlkZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7ZUFjVyxPQUFPLENBQUMsUUFBUSxDQUFDOztJQUFuQyxlQUFjLFlBQWQsY0FBYzs7Z0JBQ0UsT0FBTyxDQUFDLHFCQUFxQixDQUFDOztJQUE5QyxZQUFZLGFBQVosWUFBWTs7QUFFakIsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLEFBQU0sZ0JBQWMsb0JBQUEsV0FDbEIsVUFBc0IsRUFDdEIsUUFBb0Isd0JBQ3FCO0FBQ3pDLFFBQUksT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNuQyxRQUFJLENBQUMsT0FBTyxJQUFJLFlBQVksS0FBSyxVQUFVLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxFQUFFO0FBQ2xFLGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0FBRUQsUUFBSSxNQUFNLEdBQUcsTUFBTSxlQUFjLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdFLFFBQUksQ0FBQyxNQUFNLEVBQUU7QUFDWCxZQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7S0FDL0M7O1FBRUksT0FBTyxHQUE0QixNQUFNLENBQXpDLE9BQU87UUFBRSxVQUFVLEdBQWdCLE1BQU0sQ0FBaEMsVUFBVTtRQUFFLFVBQVUsR0FBSSxNQUFNLENBQXBCLFVBQVU7O0FBQ3BDLFFBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFO0FBQ3RCLFlBQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztLQUN6Qzs7O0FBR0QsY0FBVSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBQSxHQUFHLEVBQUk7QUFDakMsYUFBTztBQUNMLFdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUTtBQUNqQixZQUFJLEVBQUUsSUFBSTtBQUNWLGFBQUssRUFBRTtBQUNMLGNBQUksRUFBRSxHQUFHLENBQUMsSUFBSTtBQUNkLGdCQUFNLEVBQUUsR0FBRyxDQUFDLFVBQVU7U0FDdkI7QUFDRCxXQUFHLEVBQUU7QUFDSCxjQUFJLEVBQUUsR0FBRyxDQUFDLElBQUk7QUFDZCxnQkFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRO1NBQ3JCO09BQ0YsQ0FBQztLQUNILENBQUMsQ0FBQzs7O0FBR0gsUUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQy9CLGdCQUFVLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQzs7QUFFRCxXQUFPO0FBQ0wsYUFBTyxFQUFQLE9BQU87QUFDUCwwQkFBb0IsRUFBRSxVQUFVO0FBQ2hDLGdCQUFVLEVBQVYsVUFBVTtLQUNYLENBQUM7R0FDSCxDQUFBO0NBQ0YsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1oYWNrL2xpYi9GaW5kUmVmZXJlbmNlc1Byb3ZpZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuLy8gV2UgY2FuJ3QgcHVsbCBpbiBudWNsaWRlLWZpbmQtcmVmZXJlbmNlcyBhcyBhIGRlcGVuZGVuY3ksIHVuZm9ydHVuYXRlbHkuXG4vLyBpbXBvcnQgdHlwZSB7RmluZFJlZmVyZW5jZXNEYXRhfSBmcm9tICdudWNsaWRlLWZpbmQtcmVmZXJlbmNlcyc7XG5cbnZhciB7ZmluZFJlZmVyZW5jZXN9ID0gcmVxdWlyZSgnLi9oYWNrJyk7XG52YXIge0hBQ0tfR1JBTU1BUn0gPSByZXF1aXJlKCdudWNsaWRlLWhhY2stY29tbW9uJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhc3luYyBmaW5kUmVmZXJlbmNlcyhcbiAgICB0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHBvc2l0aW9uOiBhdG9tJFBvaW50XG4gICk6IFByb21pc2U8P09iamVjdCAvKkZpbmRSZWZlcmVuY2VzRGF0YSovPiB7XG4gICAgdmFyIGZpbGVVcmkgPSB0ZXh0RWRpdG9yLmdldFBhdGgoKTtcbiAgICBpZiAoIWZpbGVVcmkgfHwgSEFDS19HUkFNTUFSICE9PSB0ZXh0RWRpdG9yLmdldEdyYW1tYXIoKS5zY29wZU5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciByZXN1bHQgPSBhd2FpdCBmaW5kUmVmZXJlbmNlcyh0ZXh0RWRpdG9yLCBwb3NpdGlvbi5yb3csIHBvc2l0aW9uLmNvbHVtbik7XG4gICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGZpbmQgcmVmZXJlbmNlcy4nKTtcbiAgICB9XG5cbiAgICB2YXIge2Jhc2VVcmksIHN5bWJvbE5hbWUsIHJlZmVyZW5jZXN9ID0gcmVzdWx0O1xuICAgIGlmICghcmVmZXJlbmNlcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVmZXJlbmNlcyBmb3VuZC4nKTtcbiAgICB9XG5cbiAgICAvLyBQcm9jZXNzIHRoaXMgaW50byB0aGUgZm9ybWF0IG51Y2xpZGUtZmluZC1yZWZlcmVuY2VzIGV4cGVjdHMuXG4gICAgcmVmZXJlbmNlcyA9IHJlZmVyZW5jZXMubWFwKHJlZiA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1cmk6IHJlZi5maWxlbmFtZSxcbiAgICAgICAgbmFtZTogbnVsbCwgLy8gVE9ETyhoYW5zb253KTogR2V0IHRoZSBjYWxsZXIgd2hlbiBpdCdzIGF2YWlsYWJsZVxuICAgICAgICBzdGFydDoge1xuICAgICAgICAgIGxpbmU6IHJlZi5saW5lLFxuICAgICAgICAgIGNvbHVtbjogcmVmLmNoYXJfc3RhcnQsXG4gICAgICAgIH0sXG4gICAgICAgIGVuZDoge1xuICAgICAgICAgIGxpbmU6IHJlZi5saW5lLFxuICAgICAgICAgIGNvbHVtbjogcmVmLmNoYXJfZW5kLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIC8vIFN0cmlwIG9mZiB0aGUgZ2xvYmFsIG5hbWVzcGFjZSBpbmRpY2F0b3IuXG4gICAgaWYgKHN5bWJvbE5hbWUuc3RhcnRzV2l0aCgnXFxcXCcpKSB7XG4gICAgICBzeW1ib2xOYW1lID0gc3ltYm9sTmFtZS5zbGljZSgxKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgYmFzZVVyaSxcbiAgICAgIHJlZmVyZW5jZWRTeW1ib2xOYW1lOiBzeW1ib2xOYW1lLFxuICAgICAgcmVmZXJlbmNlcyxcbiAgICB9O1xuICB9XG59O1xuIl19
