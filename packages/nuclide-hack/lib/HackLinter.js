
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

var _require = require('./hack');

var findDiagnostics = _require.findDiagnostics;

var _require2 = require('nuclide-hack-common/lib/constants');

var HACK_GRAMMAR = _require2.HACK_GRAMMAR;

module.exports = {
  providerName: 'Hack',
  grammarScopes: [HACK_GRAMMAR],
  scope: 'file',
  lintOnFly: true,
  lint: _asyncToGenerator(function* (textEditor) {
    var file = textEditor.getBuffer().file;
    if (!file) {
      return [];
    }

    var diagnostics = yield findDiagnostics(textEditor);
    return diagnostics.length ? diagnostics : [];
  })
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL0hhY2tMaW50ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7ZUFXWSxPQUFPLENBQUMsUUFBUSxDQUFDOztJQUFwQyxlQUFlLFlBQWYsZUFBZTs7Z0JBQ0MsT0FBTyxDQUFDLG1DQUFtQyxDQUFDOztJQUE1RCxZQUFZLGFBQVosWUFBWTs7QUFFakIsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNmLGNBQVksRUFBRSxNQUFNO0FBQ3BCLGVBQWEsRUFBRSxDQUFDLFlBQVksQ0FBQztBQUM3QixPQUFLLEVBQUUsTUFBTTtBQUNiLFdBQVMsRUFBRSxJQUFJO0FBQ2YsQUFBTSxNQUFJLG9CQUFBLFdBQUMsVUFBc0IsRUFBMEI7QUFDekQsUUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQztBQUN2QyxRQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1QsYUFBTyxFQUFFLENBQUM7S0FDWDs7QUFFRCxRQUFJLFdBQVcsR0FBRyxNQUFNLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNwRCxXQUFPLFdBQVcsQ0FBQyxNQUFNLEdBQUcsV0FBVyxHQUFHLEVBQUUsQ0FBQztHQUM5QyxDQUFBO0NBQ0YsQ0FBQyIsImZpbGUiOiIvdmFyL2ZvbGRlcnMveGYvcnNwaDRfYzU3MzE1cnM1N3h4c2Rza3J4bnYzNnQwL1QvdG1wZW1tMkh1cHVibGlzaF9wYWNrYWdlcy9hcG0vbnVjbGlkZS1oYWNrL2xpYi9IYWNrTGludGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG4vKiBAZmxvdyAqL1xuXG4vKlxuICogQ29weXJpZ2h0IChjKSAyMDE1LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIGxpY2Vuc2UgZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBpblxuICogdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKi9cblxudmFyIHtmaW5kRGlhZ25vc3RpY3N9ID0gcmVxdWlyZSgnLi9oYWNrJyk7XG52YXIge0hBQ0tfR1JBTU1BUn0gPSByZXF1aXJlKCdudWNsaWRlLWhhY2stY29tbW9uL2xpYi9jb25zdGFudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHByb3ZpZGVyTmFtZTogJ0hhY2snLFxuICBncmFtbWFyU2NvcGVzOiBbSEFDS19HUkFNTUFSXSxcbiAgc2NvcGU6ICdmaWxlJyxcbiAgbGludE9uRmx5OiB0cnVlLFxuICBhc3luYyBsaW50KHRleHRFZGl0b3I6IFRleHRFZGl0b3IpOiBQcm9taXNlPEFycmF5PE9iamVjdD4+IHtcbiAgICB2YXIgZmlsZSA9IHRleHRFZGl0b3IuZ2V0QnVmZmVyKCkuZmlsZTtcbiAgICBpZiAoIWZpbGUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICB2YXIgZGlhZ25vc3RpY3MgPSBhd2FpdCBmaW5kRGlhZ25vc3RpY3ModGV4dEVkaXRvcik7XG4gICAgcmV0dXJuIGRpYWdub3N0aWNzLmxlbmd0aCA/IGRpYWdub3N0aWNzIDogW107XG4gIH0sXG59O1xuIl19
