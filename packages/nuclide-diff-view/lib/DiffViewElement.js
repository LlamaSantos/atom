
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DiffViewElement = (function (_HTMLElement) {
  _inherits(DiffViewElement, _HTMLElement);

  function DiffViewElement() {
    _classCallCheck(this, DiffViewElement);

    _get(Object.getPrototypeOf(DiffViewElement.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(DiffViewElement, [{
    key: 'initialize',
    value: function initialize(model) {
      this._model = model;
      return this;
    }

    /**
     * Return the tab title for the opened diff view tab item.
     */
  }, {
    key: 'getTitle',
    value: function getTitle() {
      return 'Diff View';
    }

    /**
     * Return the tab URI for the opened diff view tab item.
     * This guarantees only one diff view will be opened per URI.
     */
  }, {
    key: 'getURI',
    value: function getURI() {
      return this._model.getURI();
    }
  }]);

  return DiffViewElement;
})(HTMLElement);

module.exports = DiffViewElement = document.registerElement('nuclide-diff-view', {
  prototype: DiffViewElement.prototype
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdFbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBV04sZUFBZTtZQUFmLGVBQWU7O1dBQWYsZUFBZTswQkFBZixlQUFlOzsrQkFBZixlQUFlOzs7ZUFBZixlQUFlOztXQUVULG9CQUFDLEtBQUssRUFBRTtBQUNoQixVQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztBQUNwQixhQUFPLElBQUksQ0FBQztLQUNiOzs7Ozs7O1dBS08sb0JBQUc7QUFDVCxhQUFPLFdBQVcsQ0FBQztLQUNwQjs7Ozs7Ozs7V0FNSyxrQkFBRztBQUNQLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztLQUM3Qjs7O1NBcEJHLGVBQWU7R0FBUyxXQUFXOztBQXdCekMsTUFBTSxDQUFDLE9BQU8sR0FBRyxlQUFlLEdBQUcsUUFBUSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsRUFBRTtBQUMvRSxXQUFTLEVBQUUsZUFBZSxDQUFDLFNBQVM7Q0FDckMsQ0FBQyxDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWRpZmYtdmlldy9saWIvRGlmZlZpZXdFbGVtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxuY2xhc3MgRGlmZlZpZXdFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuXG4gIGluaXRpYWxpemUobW9kZWwpIHtcbiAgICB0aGlzLl9tb2RlbCA9IG1vZGVsO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybiB0aGUgdGFiIHRpdGxlIGZvciB0aGUgb3BlbmVkIGRpZmYgdmlldyB0YWIgaXRlbS5cbiAgICovXG4gIGdldFRpdGxlKCkge1xuICAgIHJldHVybiAnRGlmZiBWaWV3JztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIHRhYiBVUkkgZm9yIHRoZSBvcGVuZWQgZGlmZiB2aWV3IHRhYiBpdGVtLlxuICAgKiBUaGlzIGd1YXJhbnRlZXMgb25seSBvbmUgZGlmZiB2aWV3IHdpbGwgYmUgb3BlbmVkIHBlciBVUkkuXG4gICAqL1xuICBnZXRVUkkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX21vZGVsLmdldFVSSSgpO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEaWZmVmlld0VsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoJ251Y2xpZGUtZGlmZi12aWV3Jywge1xuICBwcm90b3R5cGU6IERpZmZWaWV3RWxlbWVudC5wcm90b3R5cGUsXG59KTtcbiJdfQ==
