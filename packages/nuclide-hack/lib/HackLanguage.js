var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

'use babel';

var _require = require('atom');

var Range = _require.Range;

var HackWorker = require('./HackWorker');

var _require2 = require('nuclide-hack-common/lib/constants');

var CompletionType = _require2.CompletionType;
var SymbolType = _require2.SymbolType;

var logger = require('nuclide-logging').getLogger();
// The word char regex include \ to search for namespaced classes.
var wordCharRegex = /[\w\\]/;
// The xhp char regex include : and - to match xhp tags like <ui:button-group>.
var xhpCharRegex = /[\w:-]/;
var XHP_LINE_TEXT_REGEX = /<([a-z][a-z0-9_.:-]*)[^>]*\/?>/gi;

var UPDATE_DEPENDENCIES_INTERVAL_MS = 10000;

/**
 * The HackLanguage is the controller that servers language requests by trying to get worker results
 * and/or results from HackService (which would be executing hh_client on a supporting server)
 * and combining and/or selecting the results to give back to the requester.
 */
module.exports = (function () {

  /**
   * `basePath` should be the directory where the .hhconfig file is located.
   * It should only be null if client is a NullHackClient.
   */

  function HackLanguage(client, basePath) {
    _classCallCheck(this, HackLanguage);

    this._hackWorker = new HackWorker();
    this._client = client;
    this._pathContentsMap = {};
    this._basePath = basePath;
    this._isFinishedLoadingDependencies = true;

    this._setupUpdateDependenciesInterval();
  }

  _createClass(HackLanguage, [{
    key: '_setupUpdateDependenciesInterval',
    value: function _setupUpdateDependenciesInterval() {
      var _this = this;

      // Fetch any dependencies the HackWorker needs after learning about this file.
      // We don't block any realtime logic on the dependency fetching - it could take a while.
      var pendingUpdateDependencies = false;

      var finishUpdateDependencies = function finishUpdateDependencies() {
        pendingUpdateDependencies = false;
      };

      this._updateDependenciesInterval = setInterval(function () {
        if (pendingUpdateDependencies) {
          return;
        }
        pendingUpdateDependencies = true;
        _this.updateDependencies().then(finishUpdateDependencies, finishUpdateDependencies);
      }, UPDATE_DEPENDENCIES_INTERVAL_MS);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._hackWorker.dispose();
      clearInterval(this._updateDependenciesInterval);
    }
  }, {
    key: 'getCompletions',
    value: _asyncToGenerator(function* (path, contents, offset) {
      // Calculate the offset of the cursor from the beginning of the file.
      // Then insert AUTO332 in at this offset. (Hack uses this as a marker.)
      var markedContents = contents.substring(0, offset) + 'AUTO332' + contents.substring(offset, contents.length);
      yield this.updateFile(path, markedContents);
      var webWorkerMessage = { cmd: 'hh_auto_complete', args: [path] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      var completionType = getCompletionType(response.completion_type);
      var completions = response.completions;
      if (shouldDoServerCompletion(completionType) || !completions.length) {
        completions = yield this._client.getHackCompletions(markedContents);
      }
      return processCompletions(completions);
    })
  }, {
    key: 'updateFile',
    value: _asyncToGenerator(function* (path, contents) {
      if (contents !== this._pathContentsMap[path]) {
        this._pathContentsMap[path] = contents;
        var webWorkerMessage = { cmd: 'hh_add_file', args: [path, contents] };
        this._isFinishedLoadingDependencies = false;
        return yield this._hackWorker.runWorkerTask(webWorkerMessage);
      }
    })
  }, {
    key: 'updateDependencies',
    value: _asyncToGenerator(function* () {
      var webWorkerMessage = { cmd: 'hh_get_deps', args: [] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      if (!response.deps.length) {
        this._isFinishedLoadingDependencies = true;
        return;
      }
      var dependencies = {};
      try {
        dependencies = yield this._client.getHackDependencies(response.deps);
      } catch (err) {
        // Ignore the error, it's just dependency fetching.
        logger.warn('getHackDependencies error:', err);
      }
      // Serially update depednecies not to block the worker from serving other feature requests.
      for (var path in dependencies) {
        yield this.updateDependency(path, dependencies[path]);
      }
    })
  }, {
    key: 'updateDependency',
    value: _asyncToGenerator(function* (path, contents) {
      if (contents !== this._pathContentsMap[path]) {
        var webWorkerMessage = { cmd: 'hh_add_dep', args: [path, contents] };
        yield this._hackWorker.runWorkerTask(webWorkerMessage, { isDependency: true });
      }
    })

    /**
     * A simple way to estimate if all Hack dependencies have been loaded.
     * This flag is turned off when a file gets updated or added, and gets turned back on
     * once `updateDependencies()` returns no additional dependencies.
     *
     * The flag only updates every UPDATE_DEPENDENCIES_INTERVAL_MS, so it's not perfect -
     * however, it should be good enough for loading indicators / warnings.
     */
  }, {
    key: 'isFinishedLoadingDependencies',
    value: function isFinishedLoadingDependencies() {
      return this._isFinishedLoadingDependencies;
    }
  }, {
    key: 'formatSource',
    value: _asyncToGenerator(function* (contents, startPosition, endPosition) {
      var webWorkerMessage = { cmd: 'hh_format', args: [contents, startPosition, endPosition] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      var errorMessage = response.error_message;
      if (errorMessage) {
        if (errorMessage === 'Php_or_decl') {
          throw new Error('Sorry, PHP and <?hh //decl are not supported');
        } else if (errorMessage === 'Parsing_error') {
          throw new Error('Parsing Error! Fix your file so the syntax is valid and retry');
        } else {
          throw new Error('failed formating hack code' + errorMessage);
        }
      } else {
        return response.result;
      }
    })
  }, {
    key: 'getDiagnostics',
    value: _asyncToGenerator(function* (path, contents) {
      if (!isHackFile(contents)) {
        return [];
      }
      yield this.updateFile(path, contents);
      var webWorkerMessage = { cmd: 'hh_check_file', args: [path] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      return parseErrorsFromResponse(response);
    })
  }, {
    key: 'getServerDiagnostics',
    value: _asyncToGenerator(function* () {
      var response = yield this._client.getHackDiagnostics();
      return parseErrorsFromResponse(response);
    })
  }, {
    key: 'getDefinition',
    value: _asyncToGenerator(function* (path, contents, lineNumber, column, lineText) {

      if (!isHackFile(contents)) {
        return null;
      }

      var _ref = yield Promise.all([
      // First Stage. Ask Hack clientside for a result location.
      this._getDefinitionLocationAtPosition(path, contents, lineNumber, column),
      // Second stage. Ask Hack clientside for the name of the symbol we're on. If we get a name,
      // ask the server for the location of this name
      this._getDefinitionFromIdentifyMethod(path, contents, lineNumber, column),
      // Third stage, do simple string parsing of the file to get a string to search the server for.
      // Then ask the server for the location of that string.
      this._getDefinitionFromStringParse(lineText, column)]);

      var _ref2 = _slicedToArray(_ref, 3);

      var clientSideResults = _ref2[0];
      var identifyMethodResults = _ref2[1];
      var stringParseResults = _ref2[2];

      // We now have results from all 3 sources. Chose the best results to show to the user.
      if (identifyMethodResults.length === 1) {
        return identifyMethodResults;
      } else if (stringParseResults.length === 1) {
        return stringParseResults;
      } else if (clientSideResults.length === 1) {
        return clientSideResults;
      } else if (identifyMethodResults.length > 0) {
        return identifyMethodResults;
      } else if (stringParseResults.length > 0) {
        return stringParseResults;
      } else {
        return clientSideResults;
      }
    })
  }, {
    key: 'getSymbolNameAtPosition',
    value: _asyncToGenerator(function* (path, contents, lineNumber, column) {

      yield this.updateFile(path, contents);
      var webWorkerMessage = { cmd: 'hh_get_method_name', args: [path, lineNumber, column] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      if (!response.name) {
        return null;
      }
      var symbolType = getSymbolType(response.result_type);
      var position = response.pos;
      return {
        name: response.name,
        type: symbolType,
        line: position.line - 1,
        column: position.char_start - 1,
        length: position.char_end - position.char_start + 1
      };
    })
  }, {
    key: '_getDefinitionLocationAtPosition',
    value: _asyncToGenerator(function* (path, contents, lineNumber, column) {

      yield this.updateFile(path, contents);
      var webWorkerMessage = { cmd: 'hh_infer_pos', args: [path, lineNumber, column] };
      var response = yield this._hackWorker.runWorkerTask(webWorkerMessage);
      var position = response.pos || {};
      if (position.filename) {
        return [{
          path: position.filename,
          line: position.line - 1,
          column: position.char_start - 1,
          length: position.char_end - position.char_start + 1
        }];
      } else {
        return [];
      }
    })
  }, {
    key: '_getDefinitionFromIdentifyMethod',
    value: _asyncToGenerator(function* (path, contents, lineNumber, column) {

      try {
        var symbol = yield this.getSymbolNameAtPosition(path, contents, lineNumber, column);
        var defs = [];
        if (symbol && symbol.name) {
          defs = yield this._client.getHackDefinition(symbol.name, symbol.type);
        }
        return defs;
      } catch (err) {
        // ignore the error
        logger.warn('_getDefinitionFromIdentifyMethod error:', err);
        return [];
      }
    })
  }, {
    key: '_getDefinitionFromStringParse',
    value: _asyncToGenerator(function* (lineText, column) {
      var _parseStringForExpression2 = this._parseStringForExpression(lineText, column);

      var search = _parseStringForExpression2.search;
      var start = _parseStringForExpression2.start;
      var end = _parseStringForExpression2.end;

      if (!search) {
        return [];
      }
      var defs = [];
      try {
        defs = yield this._client.getHackDefinition(search, SymbolType.UNKNOWN);
      } catch (err) {
        // ignore the error
        logger.warn('_getDefinitionFromStringParse error:', err);
      }
      return defs.map(function (definition) {
        return {
          path: definition.path,
          line: definition.line,
          column: definition.column,
          searchStartColumn: start,
          searchEndColumn: end
        };
      });
    })
  }, {
    key: '_parseStringForExpression',
    value: function _parseStringForExpression(lineText, column) {
      var search = null;
      var start = column;

      var isXHP = false;
      var xhpMatch;
      while (xhpMatch = XHP_LINE_TEXT_REGEX.exec(lineText)) {
        var xhpMatchIndex = xhpMatch.index + 1;
        if (column >= xhpMatchIndex && column < xhpMatchIndex + xhpMatch[1].length) {
          isXHP = true;
          break;
        }
      }

      var syntaxCharRegex = isXHP ? xhpCharRegex : wordCharRegex;
      // Scan for the word start for the hack variable, function or xhp tag
      // we are trying to get the definition for.
      while (start >= 0 && syntaxCharRegex.test(lineText.charAt(start))) {
        start--;
      }
      if (lineText[start] === '$') {
        start--;
      }
      start++;
      var end = column;
      while (syntaxCharRegex.test(lineText.charAt(end))) {
        end++;
      }
      search = lineText.substring(start, end);
      // XHP UI elements start with : but the usages doesn't have that colon.
      if (isXHP && !search.startsWith(':')) {
        search = ':' + search;
      }
      return { search: search, start: start, end: end };
    }
  }, {
    key: 'getType',
    value: _asyncToGenerator(function* (path, contents, expression, lineNumber, column) {
      if (!isHackFile(contents) || !expression.startsWith('$')) {
        return null;
      }
      yield this.updateFile(path, contents);
      var webWorkerMessage = { cmd: 'hh_infer_type', args: [path, lineNumber, column] };

      var _ref3 = yield this._hackWorker.runWorkerTask(webWorkerMessage);

      var type = _ref3.type;

      return type;
    })
  }, {
    key: 'getReferences',
    value: _asyncToGenerator(function* (contents, symbolName) {
      if (!isHackFile(contents)) {
        return null;
      }
      return yield this._client.getHackReferences(symbolName);
    })
  }, {
    key: 'getBasePath',
    value: function getBasePath() {
      return this._basePath;
    }
  }]);

  return HackLanguage;
})();

var stringToCompletionType = {
  'id': CompletionType.ID,
  'new': CompletionType.NEW,
  'type': CompletionType.TYPE,
  'class_get': CompletionType.CLASS_GET,
  'var': CompletionType.VAR
};

function getCompletionType(input) {
  var completionType = stringToCompletionType[input];
  if (typeof completionType === 'undefined') {
    completionType = CompletionType.NONE;
  }
  return completionType;
}

var stringToSymbolType = {
  'class': SymbolType.CLASS,
  'function': SymbolType.FUNCTION,
  'method': SymbolType.METHOD,
  'local': SymbolType.LOCAL
};

function getSymbolType(input) {
  var symbolType = stringToSymbolType[input];
  if (typeof symbolType === 'undefined') {
    symbolType = SymbolType.METHOD;
  }
  return symbolType;
}

function parseErrorsFromResponse(response) {
  var errors = response.errors.map(function (error) {
    var rootCause = null;
    var errorParts = error.message;
    return errorParts.map(function (errorPart) {
      if (!rootCause) {
        var start = errorPart.start;
        var end = errorPart.end;
        var line = errorPart.line;
        var path = errorPart.path;

        start--;
        line--;
        rootCause = {
          range: new Range([line, start], [line, end]),
          path: path,
          start: start,
          line: line
        };
      }
      return {
        type: 'Error',
        text: errorPart.descr,
        filePath: rootCause.path,
        range: rootCause.range
      };
    });
  });
  // flatten the arrays
  return [].concat.apply([], errors);
}

var serverCompletionTypes = new Set([CompletionType.ID, CompletionType.NEW, CompletionType.TYPE]);

function shouldDoServerCompletion(type) {
  return serverCompletionTypes.has(type);
}

function processCompletions(completionsResponse) {
  return completionsResponse.map(function (completion) {
    var name = completion.name;
    var type = completion.type;
    var functionDetails = completion.func_details;

    if (type && type.indexOf('(') === 0 && type.lastIndexOf(')') === type.length - 1) {
      type = type.substring(1, type.length - 1);
    }
    var matchSnippet = name;
    if (functionDetails) {
      var params = functionDetails.params;

      // Construct the snippet: e.g. myFunction(${1:$arg1}, ${2:$arg2});
      var paramsString = params.map(function (param, index) {
        return '${' + (index + 1) + ':' + param.name + '}';
      }).join(', ');
      matchSnippet = name + '(' + paramsString + ')';
    }
    return {
      matchSnippet: matchSnippet,
      matchText: name,
      matchType: type
    };
  });
}

function isHackFile(contents) {
  return contents && contents.startsWith('<?hh');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL0hhY2tMYW5ndWFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsV0FBVyxDQUFDOztlQWFFLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXhCLEtBQUssWUFBTCxLQUFLOztBQUNWLElBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQzs7Z0JBQ04sT0FBTyxDQUFDLG1DQUFtQyxDQUFDOztJQUExRSxjQUFjLGFBQWQsY0FBYztJQUFFLFVBQVUsYUFBVixVQUFVOztBQUMvQixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQzs7QUFFcEQsSUFBSSxhQUFhLEdBQUcsUUFBUSxDQUFDOztBQUU3QixJQUFJLFlBQVksR0FBRyxRQUFRLENBQUM7QUFDNUIsSUFBSSxtQkFBbUIsR0FBRyxrQ0FBa0MsQ0FBQzs7QUFFN0QsSUFBTSwrQkFBK0IsR0FBRyxLQUFLLENBQUM7Ozs7Ozs7QUFPOUMsTUFBTSxDQUFDLE9BQU87Ozs7Ozs7QUFNRCxXQU5VLFlBQVksQ0FNckIsTUFBcUIsRUFBRSxRQUFpQixFQUFFOzBCQU5qQyxZQUFZOztBQU8vQixRQUFJLENBQUMsV0FBVyxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7QUFDcEMsUUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDdEIsUUFBSSxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQztBQUMzQixRQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztBQUMxQixRQUFJLENBQUMsOEJBQThCLEdBQUcsSUFBSSxDQUFDOztBQUUzQyxRQUFJLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQztHQUN6Qzs7ZUFkb0IsWUFBWTs7V0FnQkQsNENB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LFlBQVksR0FBRyxHQUFHLENBQUM7S0FDaEQ7QUFDRCxXQUFPO0FBQ0wsa0JBQVksRUFBWixZQUFZO0FBQ1osZUFBUyxFQUFFLElBQUk7QUFDZixlQUFTLEVBQUUsSUFBSTtLQUNoQixDQUFDO0dBQ0gsQ0FBQyxDQUFDO0NBQ0o7O0FBRUQsU0FBUyxVQUFVLENBQUMsUUFBZ0IsRUFBVztBQUM3QyxTQUFPLFFBQVEsSUFBSSxRQUFRLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0NBQ2hEIiwiZmlsZSI6Ii92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL0hhY2tMYW5ndWFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmltcG9ydCB0eXBlIHtIYWNrUmVmZXJlbmNlfSBmcm9tICdudWNsaWRlLWhhY2stY29tbW9uJztcblxudmFyIHtSYW5nZX0gPSByZXF1aXJlKCdhdG9tJyk7XG52YXIgSGFja1dvcmtlciA9IHJlcXVpcmUoJy4vSGFja1dvcmtlcicpO1xudmFyIHtDb21wbGV0aW9uVHlwZSwgU3ltYm9sVHlwZX0gPSByZXF1aXJlKCdudWNsaWRlLWhhY2stY29tbW9uL2xpYi9jb25zdGFudHMnKTtcbnZhciBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcbi8vIFRoZSB3b3JkIGNoYXIgcmVnZXggaW5jbHVkZSBcXCB0byBzZWFyY2ggZm9yIG5hbWVzcGFjZWQgY2xhc3Nlcy5cbnZhciB3b3JkQ2hhclJlZ2V4ID0gL1tcXHdcXFxcXS87XG4vLyBUaGUgeGhwIGNoYXIgcmVnZXggaW5jbHVkZSA6IGFuZCAtIHRvIG1hdGNoIHhocCB0YWdzIGxpa2UgPHVpOmJ1dHRvbi1ncm91cD4uXG52YXIgeGhwQ2hhclJlZ2V4ID0gL1tcXHc6LV0vO1xudmFyIFhIUF9MSU5FX1RFWFRfUkVHRVggPSAvPChbYS16XVthLXowLTlfLjotXSopW14+XSpcXC8/Pi9naTtcblxuY29uc3QgVVBEQVRFX0RFUEVOREVOQ0lFU19JTlRFUlZBTF9NUyA9IDEwMDAwO1xuXG4vKipcbiAqIFRoZSBIYWNrTGFuZ3VhZ2UgaXMgdGhlIGNvbnRyb2xsZXIgdGhhdCBzZXJ2ZXJzIGxhbmd1YWdlIHJlcXVlc3RzIGJ5IHRyeWluZyB0byBnZXQgd29ya2VyIHJlc3VsdHNcbiAqIGFuZC9vciByZXN1bHRzIGZyb20gSGFja1NlcnZpY2UgKHdoaWNoIHdvdWxkIGJlIGV4ZWN1dGluZyBoaF9jbGllbnQgb24gYSBzdXBwb3J0aW5nIHNlcnZlcilcbiAqIGFuZCBjb21iaW5pbmcgYW5kL29yIHNlbGVjdGluZyB0aGUgcmVzdWx0cyB0byBnaXZlIGJhY2sgdG8gdGhlIHJlcXVlc3Rlci5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBjbGFzcyBIYWNrTGFuZ3VhZ2Uge1xuXG4gIC8qKlxuICAgKiBgYmFzZVBhdGhgIHNob3VsZCBiZSB0aGUgZGlyZWN0b3J5IHdoZXJlIHRoZSAuaGhjb25maWcgZmlsZSBpcyBsb2NhdGVkLlxuICAgKiBJdCBzaG91bGQgb25seSBiZSBudWxsIGlmIGNsaWVudCBpcyBhIE51bGxIYWNrQ2xpZW50LlxuICAgKi9cbiAgY29uc3RydWN0b3IoY2xpZW50OiBOdWNsaWRlQ2xpZW50LCBiYXNlUGF0aDogP3N0cmluZykge1xuICAgIHRoaXMuX2hhY2tXb3JrZXIgPSBuZXcgSGFja1dvcmtlcigpO1xuICAgIHRoaXMuX2NsaWVudCA9IGNsaWVudDtcbiAgICB0aGlzLl9wYXRoQ29udGVudHNNYXAgPSB7fTtcbiAgICB0aGlzLl9iYXNlUGF0aCA9IGJhc2VQYXRoO1xuICAgIHRoaXMuX2lzRmluaXNoZWRMb2FkaW5nRGVwZW5kZW5jaWVzID0gdHJ1ZTtcblxuICAgIHRoaXMuX3NldHVwVXBkYXRlRGVwZW5kZW5jaWVzSW50ZXJ2YWwoKTtcbiAgfVxuXG4gIF9zZXR1cFVwZGF0ZURlcGVuZGVuY2llc0ludGVydmFsKCkge1xuICAgIC8vIEZldGNoIGFueSBkZXBlbmRlbmNpZXMgdGhlIEhhY2tXb3JrZXIgbmVlZHMgYWZ0ZXIgbGVhcm5pbmcgYWJvdXQgdGhpcyBmaWxlLlxuICAgIC8vIFdlIGRvbid0IGJsb2NrIGFueSByZWFsdGltZSBsb2dpYyBvbiB0aGUgZGVwZW5kZW5jeSBmZXRjaGluZyAtIGl0IGNvdWxkIHRha2UgYSB3aGlsZS5cbiAgICB2YXIgcGVuZGluZ1VwZGF0ZURlcGVuZGVuY2llcyA9IGZhbHNlO1xuXG4gICAgdmFyIGZpbmlzaFVwZGF0ZURlcGVuZGVuY2llcyA9ICgpID0+IHtcbiAgICAgIHBlbmRpbmdVcGRhdGVEZXBlbmRlbmNpZXMgPSBmYWxzZTtcbiAgICB9O1xuXG4gICAgdGhpcy5fdXBkYXRlRGVwZW5kZW5jaWVzSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAocGVuZGluZ1VwZGF0ZURlcGVuZGVuY2llcykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBwZW5kaW5nVXBkYXRlRGVwZW5kZW5jaWVzID0gdHJ1ZTtcbiAgICAgIHRoaXMudXBkYXRlRGVwZW5kZW5jaWVzKCkudGhlbihmaW5pc2hVcGRhdGVEZXBlbmRlbmNpZXMsIGZpbmlzaFVwZGF0ZURlcGVuZGVuY2llcyk7XG4gICAgfSwgVVBEQVRFX0RFUEVOREVOQ0lFU19JTlRFUlZBTF9NUyk7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX2hhY2tXb3JrZXIuZGlzcG9zZSgpO1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fdXBkYXRlRGVwZW5kZW5jaWVzSW50ZXJ2YWwpO1xuICB9XG5cbiAgYXN5bmMgZ2V0Q29tcGxldGlvbnMocGF0aDogc3RyaW5nLCBjb250ZW50czogc3RyaW5nLCBvZmZzZXQ6IG51bWJlcik6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuICAgIC8vIENhbGN1bGF0ZSB0aGUgb2Zmc2V0IG9mIHRoZSBjdXJzb3IgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHRoZSBmaWxlLlxuICAgIC8vIFRoZW4gaW5zZXJ0IEFVVE8zMzIgaW4gYXQgdGhpcyBvZmZzZXQuIChIYWNrIHVzZXMgdGhpcyBhcyBhIG1hcmtlci4pXG4gICAgdmFyIG1hcmtlZENvbnRlbnRzID0gY29udGVudHMuc3Vic3RyaW5nKDAsIG9mZnNldCkgK1xuICAgICAgICAnQVVUTzMzMicgKyBjb250ZW50cy5zdWJzdHJpbmcob2Zmc2V0LCBjb250ZW50cy5sZW5ndGgpO1xuICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZShwYXRoLCBtYXJrZWRDb250ZW50cyk7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfYXV0b19jb21wbGV0ZScsIGFyZ3M6IFtwYXRoXX07XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIHZhciBjb21wbGV0aW9uVHlwZSA9IGdldENvbXBsZXRpb25UeXBlKHJlc3BvbnNlLmNvbXBsZXRpb25fdHlwZSk7XG4gICAgdmFyIGNvbXBsZXRpb25zID0gcmVzcG9uc2UuY29tcGxldGlvbnM7XG4gICAgaWYgKHNob3VsZERvU2VydmVyQ29tcGxldGlvbihjb21wbGV0aW9uVHlwZSkgfHwgIWNvbXBsZXRpb25zLmxlbmd0aCkge1xuICAgICAgY29tcGxldGlvbnMgPSBhd2FpdCB0aGlzLl9jbGllbnQuZ2V0SGFja0NvbXBsZXRpb25zKG1hcmtlZENvbnRlbnRzKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2Nlc3NDb21wbGV0aW9ucyhjb21wbGV0aW9ucyk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVGaWxlKHBhdGg6IHN0cmluZywgY29udGVudHM6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIGlmIChjb250ZW50cyAhPT0gdGhpcy5fcGF0aENvbnRlbnRzTWFwW3BhdGhdKSB7XG4gICAgICB0aGlzLl9wYXRoQ29udGVudHNNYXBbcGF0aF0gPSBjb250ZW50cztcbiAgICAgIHZhciB3ZWJXb3JrZXJNZXNzYWdlID0ge2NtZDogJ2hoX2FkZF9maWxlJywgYXJnczogW3BhdGgsIGNvbnRlbnRzXX07XG4gICAgICB0aGlzLl9pc0ZpbmlzaGVkTG9hZGluZ0RlcGVuZGVuY2llcyA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2hhY2tXb3JrZXIucnVuV29ya2VyVGFzayh3ZWJXb3JrZXJNZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyB1cGRhdGVEZXBlbmRlbmNpZXMoKTogUHJvbWlzZSB7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfZ2V0X2RlcHMnLCBhcmdzOiBbXX07XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIGlmICghcmVzcG9uc2UuZGVwcy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX2lzRmluaXNoZWRMb2FkaW5nRGVwZW5kZW5jaWVzID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRlcGVuZGVuY2llcyA9IHt9O1xuICAgIHRyeSB7XG4gICAgICBkZXBlbmRlbmNpZXMgPSBhd2FpdCB0aGlzLl9jbGllbnQuZ2V0SGFja0RlcGVuZGVuY2llcyhyZXNwb25zZS5kZXBzKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIElnbm9yZSB0aGUgZXJyb3IsIGl0J3MganVzdCBkZXBlbmRlbmN5IGZldGNoaW5nLlxuICAgICAgbG9nZ2VyLndhcm4oJ2dldEhhY2tEZXBlbmRlbmNpZXMgZXJyb3I6JywgZXJyKTtcbiAgICB9XG4gICAgLy8gU2VyaWFsbHkgdXBkYXRlIGRlcGVkbmVjaWVzIG5vdCB0byBibG9jayB0aGUgd29ya2VyIGZyb20gc2VydmluZyBvdGhlciBmZWF0dXJlIHJlcXVlc3RzLlxuICAgIGZvciAodmFyIHBhdGggaW4gZGVwZW5kZW5jaWVzKSB7XG4gICAgICBhd2FpdCB0aGlzLnVwZGF0ZURlcGVuZGVuY3kocGF0aCwgZGVwZW5kZW5jaWVzW3BhdGhdKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyB1cGRhdGVEZXBlbmRlbmN5KHBhdGg6IHN0cmluZywgY29udGVudHM6IHN0cmluZyk6IFByb21pc2Uge1xuICAgIGlmIChjb250ZW50cyAhPT0gdGhpcy5fcGF0aENvbnRlbnRzTWFwW3BhdGhdKSB7XG4gICAgICB2YXIgd2ViV29ya2VyTWVzc2FnZSA9IHtjbWQ6ICdoaF9hZGRfZGVwJywgYXJnczogW3BhdGgsIGNvbnRlbnRzXX07XG4gICAgICBhd2FpdCB0aGlzLl9oYWNrV29ya2VyLnJ1bldvcmtlclRhc2sod2ViV29ya2VyTWVzc2FnZSwge2lzRGVwZW5kZW5jeTogdHJ1ZX0pO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBIHNpbXBsZSB3YXkgdG8gZXN0aW1hdGUgaWYgYWxsIEhhY2sgZGVwZW5kZW5jaWVzIGhhdmUgYmVlbiBsb2FkZWQuXG4gICAqIFRoaXMgZmxhZyBpcyB0dXJuZWQgb2ZmIHdoZW4gYSBmaWxlIGdldHMgdXBkYXRlZCBvciBhZGRlZCwgYW5kIGdldHMgdHVybmVkIGJhY2sgb25cbiAgICogb25jZSBgdXBkYXRlRGVwZW5kZW5jaWVzKClgIHJldHVybnMgbm8gYWRkaXRpb25hbCBkZXBlbmRlbmNpZXMuXG4gICAqXG4gICAqIFRoZSBmbGFnIG9ubHkgdXBkYXRlcyBldmVyeSBVUERBVEVfREVQRU5ERU5DSUVTX0lOVEVSVkFMX01TLCBzbyBpdCdzIG5vdCBwZXJmZWN0IC1cbiAgICogaG93ZXZlciwgaXQgc2hvdWxkIGJlIGdvb2QgZW5vdWdoIGZvciBsb2FkaW5nIGluZGljYXRvcnMgLyB3YXJuaW5ncy5cbiAgICovXG4gIGlzRmluaXNoZWRMb2FkaW5nRGVwZW5kZW5jaWVzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc0ZpbmlzaGVkTG9hZGluZ0RlcGVuZGVuY2llcztcbiAgfVxuXG4gIGFzeW5jIGZvcm1hdFNvdXJjZShjb250ZW50czogc3RyaW5nLCBzdGFydFBvc2l0aW9uOiBudW1iZXIsIGVuZFBvc2l0aW9uOiBudW1iZXIpIHtcbiAgICB2YXIgd2ViV29ya2VyTWVzc2FnZSA9IHtjbWQ6ICdoaF9mb3JtYXQnLCBhcmdzOiBbY29udGVudHMsIHN0YXJ0UG9zaXRpb24sIGVuZFBvc2l0aW9uXX07XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIHZhciBlcnJvck1lc3NhZ2UgPSByZXNwb25zZS5lcnJvcl9tZXNzYWdlO1xuICAgIGlmIChlcnJvck1lc3NhZ2UpIHtcbiAgICAgIGlmIChlcnJvck1lc3NhZ2UgPT09ICdQaHBfb3JfZGVjbCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTb3JyeSwgUEhQIGFuZCA8P2hoIC8vZGVjbCBhcmUgbm90IHN1cHBvcnRlZCcpO1xuICAgICAgfSBlbHNlIGlmIChlcnJvck1lc3NhZ2UgPT09ICdQYXJzaW5nX2Vycm9yJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNpbmcgRXJyb3IhIEZpeCB5b3VyIGZpbGUgc28gdGhlIHN5bnRheCBpcyB2YWxpZCBhbmQgcmV0cnknKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZmFpbGVkIGZvcm1hdGluZyBoYWNrIGNvZGUnICsgZXJyb3JNZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHJlc3BvbnNlLnJlc3VsdDtcbiAgICB9XG4gIH1cblxuICBhc3luYyBnZXREaWFnbm9zdGljcyhwYXRoOiBzdHJpbmcsIGNvbnRlbnRzOiBzdHJpbmcpOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICBpZiAoIWlzSGFja0ZpbGUoY29udGVudHMpKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZShwYXRoLCBjb250ZW50cyk7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfY2hlY2tfZmlsZScsIGFyZ3M6IFtwYXRoXX07XG4gICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIHJldHVybiBwYXJzZUVycm9yc0Zyb21SZXNwb25zZShyZXNwb25zZSk7XG4gIH1cblxuICBhc3luYyBnZXRTZXJ2ZXJEaWFnbm9zdGljcygpOiBQcm9taXNlPEFycmF5PGFueT4+IHtcbiAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9jbGllbnQuZ2V0SGFja0RpYWdub3N0aWNzKCk7XG4gICAgcmV0dXJuIHBhcnNlRXJyb3JzRnJvbVJlc3BvbnNlKHJlc3BvbnNlKTtcbiAgfVxuXG4gIGFzeW5jIGdldERlZmluaXRpb24oXG4gICAgICBwYXRoOiBzdHJpbmcsXG4gICAgICBjb250ZW50czogc3RyaW5nLFxuICAgICAgbGluZU51bWJlcjogbnVtYmVyLFxuICAgICAgY29sdW1uOiBudW1iZXIsXG4gICAgICBsaW5lVGV4dDogc3RyaW5nXG4gICAgKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG5cbiAgICBpZiAoIWlzSGFja0ZpbGUoY29udGVudHMpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgW2NsaWVudFNpZGVSZXN1bHRzLCBpZGVudGlmeU1ldGhvZFJlc3VsdHMsIHN0cmluZ1BhcnNlUmVzdWx0c10gPVxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgICAvLyBGaXJzdCBTdGFnZS4gQXNrIEhhY2sgY2xpZW50c2lkZSBmb3IgYSByZXN1bHQgbG9jYXRpb24uXG4gICAgICAgIHRoaXMuX2dldERlZmluaXRpb25Mb2NhdGlvbkF0UG9zaXRpb24ocGF0aCwgY29udGVudHMsIGxpbmVOdW1iZXIsIGNvbHVtbiksXG4gICAgICAgIC8vIFNlY29uZCBzdGFnZS4gQXNrIEhhY2sgY2xpZW50c2lkZSBmb3IgdGhlIG5hbWUgb2YgdGhlIHN5bWJvbCB3ZSdyZSBvbi4gSWYgd2UgZ2V0IGEgbmFtZSxcbiAgICAgICAgLy8gYXNrIHRoZSBzZXJ2ZXIgZm9yIHRoZSBsb2NhdGlvbiBvZiB0aGlzIG5hbWVcbiAgICAgICAgdGhpcy5fZ2V0RGVmaW5pdGlvbkZyb21JZGVudGlmeU1ldGhvZChwYXRoLCBjb250ZW50cywgbGluZU51bWJlciwgY29sdW1uKSxcbiAgICAgICAgLy8gVGhpcmQgc3RhZ2UsIGRvIHNpbXBsZSBzdHJpbmcgcGFyc2luZyBvZiB0aGUgZmlsZSB0byBnZXQgYSBzdHJpbmcgdG8gc2VhcmNoIHRoZSBzZXJ2ZXIgZm9yLlxuICAgICAgICAvLyBUaGVuIGFzayB0aGUgc2VydmVyIGZvciB0aGUgbG9jYXRpb24gb2YgdGhhdCBzdHJpbmcuXG4gICAgICAgIHRoaXMuX2dldERlZmluaXRpb25Gcm9tU3RyaW5nUGFyc2UobGluZVRleHQsIGNvbHVtbiksXG4gICAgICBdKTtcbiAgICAvLyBXZSBub3cgaGF2ZSByZXN1bHRzIGZyb20gYWxsIDMgc291cmNlcy4gQ2hvc2UgdGhlIGJlc3QgcmVzdWx0cyB0byBzaG93IHRvIHRoZSB1c2VyLlxuICAgIGlmIChpZGVudGlmeU1ldGhvZFJlc3VsdHMubGVuZ3RoID09PSAxKSB7XG4gICAgICByZXR1cm4gaWRlbnRpZnlNZXRob2RSZXN1bHRzO1xuICAgIH0gZWxzZSBpZiAoc3RyaW5nUGFyc2VSZXN1bHRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIHN0cmluZ1BhcnNlUmVzdWx0cztcbiAgICB9IGVsc2UgaWYgKGNsaWVudFNpZGVSZXN1bHRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIGNsaWVudFNpZGVSZXN1bHRzO1xuICAgIH0gZWxzZSBpZiAoaWRlbnRpZnlNZXRob2RSZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBpZGVudGlmeU1ldGhvZFJlc3VsdHM7XG4gICAgfSBlbHNlIGlmIChzdHJpbmdQYXJzZVJlc3VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHN0cmluZ1BhcnNlUmVzdWx0cztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNsaWVudFNpZGVSZXN1bHRzO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGdldFN5bWJvbE5hbWVBdFBvc2l0aW9uKFxuICAgICAgcGF0aDogc3RyaW5nLFxuICAgICAgY29udGVudHM6IHN0cmluZyxcbiAgICAgIGxpbmVOdW1iZXI6IG51bWJlcixcbiAgICAgIGNvbHVtbjogbnVtYmVyXG4gICAgKTogUHJvbWlzZTxhbnk+IHtcblxuICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZShwYXRoLCBjb250ZW50cyk7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfZ2V0X21ldGhvZF9uYW1lJywgYXJnczogW3BhdGgsIGxpbmVOdW1iZXIsIGNvbHVtbl19O1xuICAgIHZhciByZXNwb25zZSA9IGF3YWl0IHRoaXMuX2hhY2tXb3JrZXIucnVuV29ya2VyVGFzayh3ZWJXb3JrZXJNZXNzYWdlKTtcbiAgICBpZiAoIXJlc3BvbnNlLm5hbWUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgc3ltYm9sVHlwZSA9IGdldFN5bWJvbFR5cGUocmVzcG9uc2UucmVzdWx0X3R5cGUpO1xuICAgIHZhciBwb3NpdGlvbiA9IHJlc3BvbnNlLnBvcztcbiAgICByZXR1cm4ge1xuICAgICAgbmFtZTogcmVzcG9uc2UubmFtZSxcbiAgICAgIHR5cGU6IHN5bWJvbFR5cGUsXG4gICAgICBsaW5lOiBwb3NpdGlvbi5saW5lIC0gMSxcbiAgICAgIGNvbHVtbjogcG9zaXRpb24uY2hhcl9zdGFydCAtIDEsXG4gICAgICBsZW5ndGg6IHBvc2l0aW9uLmNoYXJfZW5kIC0gcG9zaXRpb24uY2hhcl9zdGFydCArIDEsXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIF9nZXREZWZpbml0aW9uTG9jYXRpb25BdFBvc2l0aW9uKFxuICAgICAgcGF0aDogc3RyaW5nLFxuICAgICAgY29udGVudHM6IHN0cmluZyxcbiAgICAgIGxpbmVOdW1iZXI6IG51bWJlcixcbiAgICAgIGNvbHVtbjogbnVtYmVyXG4gICAgKTogUHJvbWlzZTxBcnJheTxhbnk+PiB7XG5cbiAgICBhd2FpdCB0aGlzLnVwZGF0ZUZpbGUocGF0aCwgY29udGVudHMpO1xuICAgIHZhciB3ZWJXb3JrZXJNZXNzYWdlID0ge2NtZDogJ2hoX2luZmVyX3BvcycsIGFyZ3M6IFtwYXRoLCBsaW5lTnVtYmVyLCBjb2x1bW5dfTtcbiAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLl9oYWNrV29ya2VyLnJ1bldvcmtlclRhc2sod2ViV29ya2VyTWVzc2FnZSk7XG4gICAgdmFyIHBvc2l0aW9uID0gcmVzcG9uc2UucG9zIHx8IHt9O1xuICAgIGlmIChwb3NpdGlvbi5maWxlbmFtZSkge1xuICAgICAgcmV0dXJuIFt7XG4gICAgICAgIHBhdGg6IHBvc2l0aW9uLmZpbGVuYW1lLFxuICAgICAgICBsaW5lOiBwb3NpdGlvbi5saW5lIC0gMSxcbiAgICAgICAgY29sdW1uOiBwb3NpdGlvbi5jaGFyX3N0YXJ0IC0gMSxcbiAgICAgICAgbGVuZ3RoOiBwb3NpdGlvbi5jaGFyX2VuZCAtIHBvc2l0aW9uLmNoYXJfc3RhcnQgKyAxLFxuICAgICAgfV07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBfZ2V0RGVmaW5pdGlvbkZyb21JZGVudGlmeU1ldGhvZChcbiAgICAgIHBhdGg6IHN0cmluZyxcbiAgICAgIGNvbnRlbnRzOiBzdHJpbmcsXG4gICAgICBsaW5lTnVtYmVyOiBudW1iZXIsXG4gICAgICBjb2x1bW46IG51bWJlclxuICAgICk6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBzeW1ib2wgPSBhd2FpdCB0aGlzLmdldFN5bWJvbE5hbWVBdFBvc2l0aW9uKHBhdGgsIGNvbnRlbnRzLCBsaW5lTnVtYmVyLCBjb2x1bW4pO1xuICAgICAgdmFyIGRlZnMgPSBbXTtcbiAgICAgIGlmIChzeW1ib2wgJiYgc3ltYm9sLm5hbWUpIHtcbiAgICAgICAgZGVmcyA9IGF3YWl0IHRoaXMuX2NsaWVudC5nZXRIYWNrRGVmaW5pdGlvbihzeW1ib2wubmFtZSwgc3ltYm9sLnR5cGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGRlZnM7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBpZ25vcmUgdGhlIGVycm9yXG4gICAgICBsb2dnZXIud2FybignX2dldERlZmluaXRpb25Gcm9tSWRlbnRpZnlNZXRob2QgZXJyb3I6JywgZXJyKTtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBfZ2V0RGVmaW5pdGlvbkZyb21TdHJpbmdQYXJzZShsaW5lVGV4dDogc3RyaW5nLCBjb2x1bW46IG51bWJlcik6IFByb21pc2U8QXJyYXk8YW55Pj4ge1xuICAgIHZhciB7c2VhcmNoLCBzdGFydCwgZW5kfSA9IHRoaXMuX3BhcnNlU3RyaW5nRm9yRXhwcmVzc2lvbihsaW5lVGV4dCwgY29sdW1uKTtcbiAgICBpZiAoIXNlYXJjaCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB2YXIgZGVmcyA9IFtdO1xuICAgIHRyeSB7XG4gICAgICBkZWZzID0gYXdhaXQgdGhpcy5fY2xpZW50LmdldEhhY2tEZWZpbml0aW9uKHNlYXJjaCwgU3ltYm9sVHlwZS5VTktOT1dOKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIGlnbm9yZSB0aGUgZXJyb3JcbiAgICAgIGxvZ2dlci53YXJuKCdfZ2V0RGVmaW5pdGlvbkZyb21TdHJpbmdQYXJzZSBlcnJvcjonLCBlcnIpO1xuICAgIH1cbiAgICByZXR1cm4gZGVmcy5tYXAoZGVmaW5pdGlvbiA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwYXRoOiBkZWZpbml0aW9uLnBhdGgsXG4gICAgICAgIGxpbmU6IGRlZmluaXRpb24ubGluZSxcbiAgICAgICAgY29sdW1uOiBkZWZpbml0aW9uLmNvbHVtbixcbiAgICAgICAgc2VhcmNoU3RhcnRDb2x1bW46IHN0YXJ0LFxuICAgICAgICBzZWFyY2hFbmRDb2x1bW46IGVuZCxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBfcGFyc2VTdHJpbmdGb3JFeHByZXNzaW9uKGxpbmVUZXh0OiBzdHJpbmcsIGNvbHVtbjogbnVtYmVyKTogc3RyaW5nIHtcbiAgICB2YXIgc2VhcmNoID0gbnVsbDtcbiAgICB2YXIgc3RhcnQgPSBjb2x1bW47XG5cbiAgICB2YXIgaXNYSFAgPSBmYWxzZTtcbiAgICB2YXIgeGhwTWF0Y2g7XG4gICAgd2hpbGUgICh4aHBNYXRjaCA9IFhIUF9MSU5FX1RFWFRfUkVHRVguZXhlYyhsaW5lVGV4dCkpIHtcbiAgICAgIHZhciB4aHBNYXRjaEluZGV4ID0geGhwTWF0Y2guaW5kZXggKyAxO1xuICAgICAgaWYgKGNvbHVtbiA+PSB4aHBNYXRjaEluZGV4ICYmIGNvbHVtbiA8ICh4aHBNYXRjaEluZGV4ICsgeGhwTWF0Y2hbMV0ubGVuZ3RoKSkge1xuICAgICAgICBpc1hIUCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBzeW50YXhDaGFyUmVnZXggPSBpc1hIUCA/IHhocENoYXJSZWdleCA6IHdvcmRDaGFyUmVnZXg7XG4gICAgLy8gU2NhbiBmb3IgdGhlIHdvcmQgc3RhcnQgZm9yIHRoZSBoYWNrIHZhcmlhYmxlLCBmdW5jdGlvbiBvciB4aHAgdGFnXG4gICAgLy8gd2UgYXJlIHRyeWluZyB0byBnZXQgdGhlIGRlZmluaXRpb24gZm9yLlxuICAgIHdoaWxlIChzdGFydCA+PSAwICYmIHN5bnRheENoYXJSZWdleC50ZXN0KGxpbmVUZXh0LmNoYXJBdChzdGFydCkpKSB7XG4gICAgICBzdGFydC0tO1xuICAgIH1cbiAgICBpZiAobGluZVRleHRbc3RhcnRdID09PSAnJCcpIHtcbiAgICAgIHN0YXJ0LS07XG4gICAgfVxuICAgIHN0YXJ0Kys7XG4gICAgdmFyIGVuZCA9IGNvbHVtbjtcbiAgICB3aGlsZSAoc3ludGF4Q2hhclJlZ2V4LnRlc3QobGluZVRleHQuY2hhckF0KGVuZCkpKSB7XG4gICAgICBlbmQrKztcbiAgICB9XG4gICAgc2VhcmNoID0gbGluZVRleHQuc3Vic3RyaW5nKHN0YXJ0LCBlbmQpO1xuICAgIC8vIFhIUCBVSSBlbGVtZW50cyBzdGFydCB3aXRoIDogYnV0IHRoZSB1c2FnZXMgZG9lc24ndCBoYXZlIHRoYXQgY29sb24uXG4gICAgaWYgKGlzWEhQICYmICFzZWFyY2guc3RhcnRzV2l0aCgnOicpKSB7XG4gICAgICBzZWFyY2ggPSAnOicgKyBzZWFyY2g7XG4gICAgfVxuICAgIHJldHVybiB7c2VhcmNoLCBzdGFydCwgZW5kfTtcbiAgfVxuXG4gIGFzeW5jIGdldFR5cGUocGF0aDogc3RyaW5nLCBjb250ZW50czogc3RyaW5nLCBleHByZXNzaW9uOiBzdHJpbmcsIGxpbmVOdW1iZXI6IG51bWJlciwgY29sdW1uOiBudW1iZXIpOiA/c3RyaW5nIHtcbiAgICBpZiAoIWlzSGFja0ZpbGUoY29udGVudHMpIHx8ICFleHByZXNzaW9uLnN0YXJ0c1dpdGgoJyQnKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGF3YWl0IHRoaXMudXBkYXRlRmlsZShwYXRoLCBjb250ZW50cyk7XG4gICAgdmFyIHdlYldvcmtlck1lc3NhZ2UgPSB7Y21kOiAnaGhfaW5mZXJfdHlwZScsIGFyZ3M6IFtwYXRoLCBsaW5lTnVtYmVyLCBjb2x1bW5dfTtcbiAgICB2YXIge3R5cGV9ID0gYXdhaXQgdGhpcy5faGFja1dvcmtlci5ydW5Xb3JrZXJUYXNrKHdlYldvcmtlck1lc3NhZ2UpO1xuICAgIHJldHVybiB0eXBlO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmVmZXJlbmNlcyhjb250ZW50czogc3RyaW5nLCBzeW1ib2xOYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9BcnJheTxIYWNrUmVmZXJlbmNlPj4ge1xuICAgIGlmICghaXNIYWNrRmlsZShjb250ZW50cykpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gYXdhaXQgdGhpcy5fY2xpZW50LmdldEhhY2tSZWZlcmVuY2VzKHN5bWJvbE5hbWUpO1xuICB9XG5cbiAgZ2V0QmFzZVBhdGgoKTogP3N0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuX2Jhc2VQYXRoO1xuICB9XG59O1xuXG52YXIgc3RyaW5nVG9Db21wbGV0aW9uVHlwZSA9IHtcbiAgJ2lkJzogQ29tcGxldGlvblR5cGUuSUQsXG4gICduZXcnOiBDb21wbGV0aW9uVHlwZS5ORVcsXG4gICd0eXBlJzogQ29tcGxldGlvblR5cGUuVFlQRSxcbiAgJ2NsYXNzX2dldCc6IENvbXBsZXRpb25UeXBlLkNMQVNTX0dFVCxcbiAgJ3Zhcic6IENvbXBsZXRpb25UeXBlLlZBUixcbn07XG5cbmZ1bmN0aW9uIGdldENvbXBsZXRpb25UeXBlKGlucHV0OiBzdHJpbmcpIHtcbiAgdmFyIGNvbXBsZXRpb25UeXBlID0gc3RyaW5nVG9Db21wbGV0aW9uVHlwZVtpbnB1dF07XG4gIGlmICh0eXBlb2YgY29tcGxldGlvblR5cGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgY29tcGxldGlvblR5cGUgPSBDb21wbGV0aW9uVHlwZS5OT05FO1xuICB9XG4gIHJldHVybiBjb21wbGV0aW9uVHlwZTtcbn1cblxudmFyIHN0cmluZ1RvU3ltYm9sVHlwZSA9IHtcbiAgJ2NsYXNzJzogU3ltYm9sVHlwZS5DTEFTUyxcbiAgJ2Z1bmN0aW9uJzogU3ltYm9sVHlwZS5GVU5DVElPTixcbiAgJ21ldGhvZCc6IFN5bWJvbFR5cGUuTUVUSE9ELFxuICAnbG9jYWwnOiBTeW1ib2xUeXBlLkxPQ0FMLFxufTtcblxuZnVuY3Rpb24gZ2V0U3ltYm9sVHlwZShpbnB1dDogc3RyaW5nKSB7XG4gIHZhciBzeW1ib2xUeXBlID0gc3RyaW5nVG9TeW1ib2xUeXBlW2lucHV0XTtcbiAgaWYgKHR5cGVvZiBzeW1ib2xUeXBlID09PSAndW5kZWZpbmVkJykge1xuICAgIHN5bWJvbFR5cGUgPSBTeW1ib2xUeXBlLk1FVEhPRDtcbiAgfVxuICByZXR1cm4gc3ltYm9sVHlwZTtcbn1cblxuZnVuY3Rpb24gcGFyc2VFcnJvcnNGcm9tUmVzcG9uc2UocmVzcG9uc2U6IGFueSk6IEFycmF5PGFueT4ge1xuICB2YXIgZXJyb3JzID0gcmVzcG9uc2UuZXJyb3JzLm1hcChlcnJvciA9PiB7XG4gICAgdmFyIHJvb3RDYXVzZSA9IG51bGw7XG4gICAgdmFyIGVycm9yUGFydHMgPSBlcnJvci5tZXNzYWdlO1xuICAgIHJldHVybiBlcnJvclBhcnRzLm1hcChlcnJvclBhcnQgPT4ge1xuICAgICAgaWYgKCFyb290Q2F1c2UpIHtcbiAgICAgICAgdmFyIHtzdGFydCwgZW5kLCBsaW5lLCBwYXRofSA9IGVycm9yUGFydDtcbiAgICAgICAgc3RhcnQtLTtcbiAgICAgICAgbGluZS0tO1xuICAgICAgICByb290Q2F1c2UgPSB7XG4gICAgICAgICAgcmFuZ2U6IG5ldyBSYW5nZShbbGluZSwgc3RhcnRdLCBbbGluZSwgZW5kXSksXG4gICAgICAgICAgcGF0aCxcbiAgICAgICAgICBzdGFydCxcbiAgICAgICAgICBsaW5lLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogJ0Vycm9yJyxcbiAgICAgICAgdGV4dDogZXJyb3JQYXJ0LmRlc2NyLFxuICAgICAgICBmaWxlUGF0aDogcm9vdENhdXNlLnBhdGgsXG4gICAgICAgIHJhbmdlOiByb290Q2F1c2UucmFuZ2UsXG4gICAgICB9O1xuICAgIH0pO1xuICB9KTtcbiAgLy8gZmxhdHRlbiB0aGUgYXJyYXlzXG4gIHJldHVybiBbXS5jb25jYXQuYXBwbHkoW10sIGVycm9ycyk7XG59XG5cbnZhciBzZXJ2ZXJDb21wbGV0aW9uVHlwZXMgPSBuZXcgU2V0KFtcbiAgQ29tcGxldGlvblR5cGUuSUQsXG4gIENvbXBsZXRpb25UeXBlLk5FVyxcbiAgQ29tcGxldGlvblR5cGUuVFlQRSxcbl0pO1xuXG5mdW5jdGlvbiBzaG91bGREb1NlcnZlckNvbXBsZXRpb24odHlwZTogQ29tcGxldGlvblR5cGUpOiBib29sZWFuIHtcbiAgcmV0dXJuIHNlcnZlckNvbXBsZXRpb25UeXBlcy5oYXModHlwZSk7XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NDb21wbGV0aW9ucyhjb21wbGV0aW9uc1Jlc3BvbnNlOiBBcnJheTxhbnk+KTogQXJyYXk8YW55PiB7XG4gIHJldHVybiBjb21wbGV0aW9uc1Jlc3BvbnNlLm1hcCgoY29tcGxldGlvbikgPT4ge1xuICAgIHZhciB7bmFtZSwgdHlwZSwgZnVuY19kZXRhaWxzOiBmdW5jdGlvbkRldGFpbHN9ID0gY29tcGxldGlvbjtcbiAgICBpZiAodHlwZSAmJiB0eXBlLmluZGV4T2YoJygnKSA9PT0gMCAmJiB0eXBlLmxhc3RJbmRleE9mKCcpJykgPT09IHR5cGUubGVuZ3RoIC0gMSkge1xuICAgICAgdHlwZSA9IHR5cGUuc3Vic3RyaW5nKDEsIHR5cGUubGVuZ3RoIC0gMSk7XG4gICAgfVxuICAgIHZhciBtYXRjaFNuaXBwZXQgPSBuYW1lO1xuICAgIGlmIChmdW5jdGlvbkRldGFpbHMpIHtcbiAgICAgIHZhciB7cGFyYW1zfSA9IGZ1bmN0aW9uRGV0YWlscztcbiAgICAgIC8vIENvbnN0cnVjdCB0aGUgc25pcHBldDogZS5nLiBteUZ1bmN0aW9uKCR7MTokYXJnMX0sICR7MjokYXJnMn0pO1xuICAgICAgdmFyIHBhcmFtc1N0cmluZyA9IHBhcmFtcy5tYXAoKHBhcmFtLCBpbmRleCkgPT4gJyR7JyArIChpbmRleCArIDEpICsgJzonICsgcGFyYW0ubmFtZSArICd9Jykuam9pbignLCAnKTtcbiAgICAgIG1hdGNoU25pcHBldCA9IG5hbWUgKyAnKCcgKyBwYXJhbXNTdHJpbmcgKyAnKSc7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBtYXRjaFNuaXBwZXQsXG4gICAgICBtYXRjaFRleHQ6IG5hbWUsXG4gICAgICBtYXRjaFR5cGU6IHR5cGUsXG4gICAgfTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGlzSGFja0ZpbGUoY29udGVudHM6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gY29udGVudHMgJiYgY29udGVudHMuc3RhcnRzV2l0aCgnPD9oaCcpO1xufVxuIl19
