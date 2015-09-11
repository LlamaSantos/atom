var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use babel';

var React = require('react-for-atom');

var _require = require('nuclide-atom-helpers');

var fileTypeClass = _require.fileTypeClass;

var path = require('path');

var FileResultComponent = (function () {
  function FileResultComponent() {
    _classCallCheck(this, FileResultComponent);
  }

  _createClass(FileResultComponent, null, [{
    key: 'getComponentForItem',
    value: function getComponentForItem(item) {
      var filePath = item.path;

      var filenameStart = filePath.lastIndexOf(path.sep);
      var importantIndexes = [filenameStart, filePath.length].concat(item.matchIndexes).sort(function (index1, index2) {
        return index1 - index2;
      });

      var folderComponents = [];
      var filenameComponents = [];

      var last = -1;
      // Split the path into it's path and directory, with matching characters pulled out and highlighted.
      //
      // When there's no matches, the ouptut is equivalent to just calling path.dirname/basename.
      importantIndexes.forEach(function (index) {
        // If the index is after the filename start, push the new text elements
        // into `filenameComponents`, otherwise push them into `folderComponents`.
        var target = index <= filenameStart ? folderComponents : filenameComponents;

        // If there was text before the `index`, push it onto `target` unstyled.
        var previousString = filePath.slice(last + 1, index);
        if (previousString.length !== 0) {
          target.push(React.createElement(
            'span',
            { key: index + 'prev' },
            previousString
          ));
        }

        // Don't put the '/' between the folder path and the filename on either line.
        if (index !== filenameStart && index < filePath.length) {
          var character = filePath.charAt(index);
          target.push(React.createElement(
            'span',
            { key: index, className: 'quick-open-file-search-match' },
            character
          ));
        }

        last = index;
      });

      var filenameClasses = ['file', 'icon', fileTypeClass(filePath)].join(' ');
      var folderClasses = ['path', 'no-icon'].join(' ');

      // `data-name` is support for the "file-icons" package.
      // See: https://atom.io/packages/file-icons
      return React.createElement(
        'div',
        null,
        React.createElement(
          'span',
          { className: filenameClasses, 'data-name': path.basename(filePath) },
          filenameComponents
        ),
        React.createElement(
          'span',
          { className: folderClasses },
          folderComponents
        )
      );
    }
  }]);

  return FileResultComponent;
})();

module.exports = FileResultComponent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL0ZpbGVSZXN1bHRDb21wb25lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsV0FBVyxDQUFDOztBQWFaLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztlQUNoQixPQUFPLENBQUMsc0JBQXNCLENBQUM7O0lBQWhELGFBQWEsWUFBYixhQUFhOztBQUNsQixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7O0lBRXJCLG1CQUFtQjtXQUFuQixtQkFBbUI7MEJBQW5CLG1CQUFtQjs7O2VBQW5CLG1CQUFtQjs7V0FFRyw2QkFBQyxJQUFnQixFQUFnQjtBQUN6RCxVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDOztBQUV6QixVQUFJLGFBQWEsR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuRCxVQUFJLGdCQUFnQixHQUFHLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUN6QixJQUFJLENBQUMsVUFBQyxNQUFNLEVBQUUsTUFBTTtlQUFLLE1BQU0sR0FBRyxNQUFNO09BQUEsQ0FBQyxDQUFDOztBQUVsRyxVQUFJLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztBQUMxQixVQUFJLGtCQUFrQixHQUFHLEVBQUUsQ0FBQzs7QUFFNUIsVUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7Ozs7QUFJZCxzQkFBZ0IsQ0FBQyxPQUFPLENBQUMsVUFBQyxLQUFLLEVBQUs7OztBQUdsQyxZQUFJLE1BQU0sR0FBRyxLQUFLLElBQUksYUFBYSxHQUFHLGdCQUFnQixHQUFHLGtCQUFrQixDQUFDOzs7QUFHNUUsWUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3JELFlBQUksY0FBYyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDL0IsZ0JBQU0sQ0FBQyxJQUFJLENBQUM7O2NBQU0sR0FBRyxFQUFFLEtBQUssR0FBRyxNQUFNLEFBQUM7WUFBRSxjQUFjO1dBQVEsQ0FBQyxDQUFDO1NBQ2pFOzs7QUFHRCxZQUFJLEtBQUssS0FBSyxhQUFhLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDdEQsY0FBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN2QyxnQkFBTSxDQUFDLElBQUksQ0FBQzs7Y0FBTSxHQUFHLEVBQUUsS0FBSyxBQUFDLEVBQUMsU0FBUyxFQUFDLDhCQUE4QjtZQUFFLFNBQVM7V0FBUSxDQUFDLENBQUM7U0FDNUY7O0FBRUQsWUFBSSxHQUFHLEtBQUssQ0FBQztPQUNkLENBQUMsQ0FBQzs7QUFFSCxVQUFJLGVBQWUsR0FBRyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzFFLFVBQUksYUFBYSxHQUFHLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7OztBQUlsRCxhQUNFOzs7UUFDRTs7WUFBTSxTQUFTLEVBQUUsZUFBZSxBQUFDLEVBQUMsYUFBVyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxBQUFDO1VBQ2xFLGtCQUFrQjtTQUNkO1FBQ1A7O1lBQU0sU0FBUyxFQUFFLGFBQWEsQUFBQztVQUFFLGdCQUFnQjtTQUFRO09BQ3JELENBQ047S0FDSDs7O1NBakRHLG1CQUFtQjs7O0FBb0R6QixNQUFNLENBQUMsT0FBTyxHQUFHLG1CQUFtQixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLXF1aWNrLW9wZW4vbGliL0ZpbGVSZXN1bHRDb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcbi8qIEBmbG93ICovXG5cbi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgbGljZW5zZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGluXG4gKiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG5pbXBvcnQgdHlwZSB7RmlsZVJlc3VsdH0gZnJvbSAnLi90eXBlcyc7XG5cbnZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0LWZvci1hdG9tJyk7XG52YXIge2ZpbGVUeXBlQ2xhc3N9ID0gcmVxdWlyZSgnbnVjbGlkZS1hdG9tLWhlbHBlcnMnKTtcbnZhciBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuXG5jbGFzcyBGaWxlUmVzdWx0Q29tcG9uZW50IHtcblxuICBzdGF0aWMgZ2V0Q29tcG9uZW50Rm9ySXRlbShpdGVtOiBGaWxlUmVzdWx0KTogUmVhY3RFbGVtZW50IHtcbiAgICB2YXIgZmlsZVBhdGggPSBpdGVtLnBhdGg7XG5cbiAgICB2YXIgZmlsZW5hbWVTdGFydCA9IGZpbGVQYXRoLmxhc3RJbmRleE9mKHBhdGguc2VwKTtcbiAgICB2YXIgaW1wb3J0YW50SW5kZXhlcyA9IFtmaWxlbmFtZVN0YXJ0LCBmaWxlUGF0aC5sZW5ndGhdLmNvbmNhdChpdGVtLm1hdGNoSW5kZXhlcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNvcnQoKGluZGV4MSwgaW5kZXgyKSA9PiBpbmRleDEgLSBpbmRleDIpO1xuXG4gICAgdmFyIGZvbGRlckNvbXBvbmVudHMgPSBbXTtcbiAgICB2YXIgZmlsZW5hbWVDb21wb25lbnRzID0gW107XG5cbiAgICB2YXIgbGFzdCA9IC0xO1xuICAgIC8vIFNwbGl0IHRoZSBwYXRoIGludG8gaXQncyBwYXRoIGFuZCBkaXJlY3RvcnksIHdpdGggbWF0Y2hpbmcgY2hhcmFjdGVycyBwdWxsZWQgb3V0IGFuZCBoaWdobGlnaHRlZC5cbiAgICAvL1xuICAgIC8vIFdoZW4gdGhlcmUncyBubyBtYXRjaGVzLCB0aGUgb3VwdHV0IGlzIGVxdWl2YWxlbnQgdG8ganVzdCBjYWxsaW5nIHBhdGguZGlybmFtZS9iYXNlbmFtZS5cbiAgICBpbXBvcnRhbnRJbmRleGVzLmZvckVhY2goKGluZGV4KSA9PiB7XG4gICAgICAvLyBJZiB0aGUgaW5kZXggaXMgYWZ0ZXIgdGhlIGZpbGVuYW1lIHN0YXJ0LCBwdXNoIHRoZSBuZXcgdGV4dCBlbGVtZW50c1xuICAgICAgLy8gaW50byBgZmlsZW5hbWVDb21wb25lbnRzYCwgb3RoZXJ3aXNlIHB1c2ggdGhlbSBpbnRvIGBmb2xkZXJDb21wb25lbnRzYC5cbiAgICAgIHZhciB0YXJnZXQgPSBpbmRleCA8PSBmaWxlbmFtZVN0YXJ0ID8gZm9sZGVyQ29tcG9uZW50cyA6IGZpbGVuYW1lQ29tcG9uZW50cztcblxuICAgICAgLy8gSWYgdGhlcmUgd2FzIHRleHQgYmVmb3JlIHRoZSBgaW5kZXhgLCBwdXNoIGl0IG9udG8gYHRhcmdldGAgdW5zdHlsZWQuXG4gICAgICB2YXIgcHJldmlvdXNTdHJpbmcgPSBmaWxlUGF0aC5zbGljZShsYXN0ICsgMSwgaW5kZXgpO1xuICAgICAgaWYgKHByZXZpb3VzU3RyaW5nLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICB0YXJnZXQucHVzaCg8c3BhbiBrZXk9e2luZGV4ICsgJ3ByZXYnfT57cHJldmlvdXNTdHJpbmd9PC9zcGFuPik7XG4gICAgICB9XG5cbiAgICAgIC8vIERvbid0IHB1dCB0aGUgJy8nIGJldHdlZW4gdGhlIGZvbGRlciBwYXRoIGFuZCB0aGUgZmlsZW5hbWUgb24gZWl0aGVyIGxpbmUuXG4gICAgICBpZiAoaW5kZXggIT09IGZpbGVuYW1lU3RhcnQgJiYgaW5kZXggPCBmaWxlUGF0aC5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGNoYXJhY3RlciA9IGZpbGVQYXRoLmNoYXJBdChpbmRleCk7XG4gICAgICAgIHRhcmdldC5wdXNoKDxzcGFuIGtleT17aW5kZXh9IGNsYXNzTmFtZT1cInF1aWNrLW9wZW4tZmlsZS1zZWFyY2gtbWF0Y2hcIj57Y2hhcmFjdGVyfTwvc3Bhbj4pO1xuICAgICAgfVxuXG4gICAgICBsYXN0ID0gaW5kZXg7XG4gICAgfSk7XG5cbiAgICB2YXIgZmlsZW5hbWVDbGFzc2VzID0gWydmaWxlJywgJ2ljb24nLCBmaWxlVHlwZUNsYXNzKGZpbGVQYXRoKV0uam9pbignICcpO1xuICAgIHZhciBmb2xkZXJDbGFzc2VzID0gWydwYXRoJywgJ25vLWljb24nXS5qb2luKCcgJyk7XG5cbiAgICAvLyBgZGF0YS1uYW1lYCBpcyBzdXBwb3J0IGZvciB0aGUgXCJmaWxlLWljb25zXCIgcGFja2FnZS5cbiAgICAvLyBTZWU6IGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9maWxlLWljb25zXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17ZmlsZW5hbWVDbGFzc2VzfSBkYXRhLW5hbWU9e3BhdGguYmFzZW5hbWUoZmlsZVBhdGgpfT5cbiAgICAgICAgICB7ZmlsZW5hbWVDb21wb25lbnRzfVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT17Zm9sZGVyQ2xhc3Nlc30+e2ZvbGRlckNvbXBvbmVudHN9PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBGaWxlUmVzdWx0Q29tcG9uZW50O1xuIl19
