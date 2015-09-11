
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

var _require = require('nuclide-ui-tree');

var LazyTreeNode = _require.LazyTreeNode;

var LazyFileTreeNode = (function (_LazyTreeNode) {
  _inherits(LazyFileTreeNode, _LazyTreeNode);

  function LazyFileTreeNode(file, parent, fetchChildren) {
    _classCallCheck(this, LazyFileTreeNode);

    _get(Object.getPrototypeOf(LazyFileTreeNode.prototype), 'constructor', this).call(this, file, parent, file.isDirectory(), fetchChildren);
  }

  _createClass(LazyFileTreeNode, [{
    key: 'getKey',
    value: function getKey() {
      if (!this.__key) {
        var label = this.__parent ? this.__parent.getKey() + this.getLabel() : this.getItem().getPath();
        var suffix = this.__isContainer && !label.endsWith('/') ? '/' : '';
        this.__key = label + suffix;
      }
      return this.__key;
    }
  }, {
    key: 'getLabel',
    value: function getLabel() {
      return this.getItem().getBaseName();
    }
  }, {
    key: 'isSymlink',
    value: function isSymlink() {
      // The `symlink` property is assigned in the atom$Directory and atom$File
      // constructors with the `@symlink` class property syntax in its argument
      // list.
      return this.getItem().symlink;
    }
  }]);

  return LazyFileTreeNode;
})(LazyTreeNode);

module.exports = LazyFileTreeNode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZpbGUtdHJlZS9saWIvTGF6eUZpbGVUcmVlTm9kZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztlQVdTLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQzs7SUFBMUMsWUFBWSxZQUFaLFlBQVk7O0lBRVgsZ0JBQWdCO1lBQWhCLGdCQUFnQjs7QUFFVCxXQUZQLGdCQUFnQixDQUdoQixJQUFnQyxFQUNoQyxNQUF5QixFQUN6QixhQUE4QyxFQUFFOzBCQUxoRCxnQkFBZ0I7O0FBTWxCLCtCQU5FLGdCQUFnQiw2Q0FNWixJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxhQUFhLEVBQUU7R0FDeEQ7O2VBUEcsZ0JBQWdCOztXQVNkLGtCQUFXO0FBQ2YsVUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7QUFDZixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNoRyxZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ25FLFlBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxHQUFHLE1BQU0sQ0FBQztPQUM3QjtBQUNELGFBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztLQUNuQjs7O1dBRU8sb0JBQVc7QUFDakIsYUFBTyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDckM7OztXQUVRLHFCQUFZOzs7O0FBSW5CLGFBQU8sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQztLQUMvQjs7O1NBM0JHLGdCQUFnQjtHQUFTLFlBQVk7O0FBK0IzQyxNQUFNLENBQUMsT0FBTyxHQUFHLGdCQUFnQixDQUFDIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWZpbGUtdHJlZS9saWIvTGF6eUZpbGVUcmVlTm9kZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciB7TGF6eVRyZWVOb2RlfSA9IHJlcXVpcmUoJ251Y2xpZGUtdWktdHJlZScpO1xuXG5jbGFzcyBMYXp5RmlsZVRyZWVOb2RlIGV4dGVuZHMgTGF6eVRyZWVOb2RlIHtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGZpbGU6IGF0b20kRmlsZSB8IGF0b20kRGlyZWN0b3J5LFxuICAgICAgcGFyZW50OiA/TGF6eUZpbGVUcmVlTm9kZSxcbiAgICAgIGZldGNoQ2hpbGRyZW46IChub2RlOiBMYXp5VHJlZU5vZGUpID0+IFByb21pc2UpIHtcbiAgICBzdXBlcihmaWxlLCBwYXJlbnQsIGZpbGUuaXNEaXJlY3RvcnkoKSwgZmV0Y2hDaGlsZHJlbik7XG4gIH1cblxuICBnZXRLZXkoKTogc3RyaW5nIHtcbiAgICBpZiAoIXRoaXMuX19rZXkpIHtcbiAgICAgIHZhciBsYWJlbCA9IHRoaXMuX19wYXJlbnQgPyB0aGlzLl9fcGFyZW50LmdldEtleSgpICsgdGhpcy5nZXRMYWJlbCgpIDogdGhpcy5nZXRJdGVtKCkuZ2V0UGF0aCgpO1xuICAgICAgdmFyIHN1ZmZpeCA9IHRoaXMuX19pc0NvbnRhaW5lciAmJiAhbGFiZWwuZW5kc1dpdGgoJy8nKSA/ICcvJyA6ICcnO1xuICAgICAgdGhpcy5fX2tleSA9IGxhYmVsICsgc3VmZml4O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX2tleTtcbiAgfVxuXG4gIGdldExhYmVsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0SXRlbSgpLmdldEJhc2VOYW1lKCk7XG4gIH1cblxuICBpc1N5bWxpbmsoKTogYm9vbGVhbiB7XG4gICAgLy8gVGhlIGBzeW1saW5rYCBwcm9wZXJ0eSBpcyBhc3NpZ25lZCBpbiB0aGUgYXRvbSREaXJlY3RvcnkgYW5kIGF0b20kRmlsZVxuICAgIC8vIGNvbnN0cnVjdG9ycyB3aXRoIHRoZSBgQHN5bWxpbmtgIGNsYXNzIHByb3BlcnR5IHN5bnRheCBpbiBpdHMgYXJndW1lbnRcbiAgICAvLyBsaXN0LlxuICAgIHJldHVybiB0aGlzLmdldEl0ZW0oKS5zeW1saW5rO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMYXp5RmlsZVRyZWVOb2RlO1xuIl19
