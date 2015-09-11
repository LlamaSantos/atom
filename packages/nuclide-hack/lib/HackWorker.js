
/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var fs = require('fs');
var path = require('path');
var logger = require('nuclide-logging').getLogger();

var DEFAULT_WEBWORKER_TIMEOUT = 30 * 1000;
var DEFAULT_POOR_PERF_TIMEOUT = 8 * 1000;

/**
 * HackWorker uses the hh_ide.js that's a translation from OCaml to JavaScript (not readable).
 * It's responsible for providing language services without hitting the server, if possible.
 * e.g. some autocompletions, go to definition, diagnostic requests and outline could be served locally.
 * This is done as a web worker not to block the main UI thread when executing language tasks.
 */

var HackWorker = (function () {
  function HackWorker(options) {
    var _this = this;

    _classCallCheck(this, HackWorker);

    options = options || {};
    this._activeTask = null;
    this._taskQueue = [];
    this._depTaskQueue = [];
    this._webWorkerTimeout = options.webWorkerTimeout || DEFAULT_WEBWORKER_TIMEOUT;
    this._poorPefTimeout = options.poorPerfTimeout || DEFAULT_POOR_PERF_TIMEOUT;
    this._worker = options.worker || startWebWorker();
    this._worker.addEventListener('message', function (e) {
      return _this._handleHackWorkerReply(e.data);
    }, false);
    this._worker.addEventListener('error', function (error) {
      return _this._handleHackWorkerError(error);
    }, false);
  }

  /**
   * Runs a web worker task and returns a promise of the value expected from the hack worker.
   */

  _createClass(HackWorker, [{
    key: 'runWorkerTask',
    value: function runWorkerTask(workerMessage, options) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        options = options || {};
        var queue = options.isDependency ? _this2._depTaskQueue : _this2._taskQueue;
        queue.push({
          workerMessage: workerMessage,
          onResponse: function onResponse(response) {
            var internalError = response.internal_error;
            if (internalError) {
              logger.error('Hack Worker: Internal Error! - ' + String(internalError) + ' - ' + JSON.stringify(workerMessage));
              reject(internalError);
            } else {
              resolve(response);
            }
          },
          onFail: function onFail(error) {
            logger.error('Hack Worker: Error!', error, JSON.stringify(workerMessage));
            reject(error);
          }
        });
        _this2._dispatchTaskIfReady();
      });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this._worker.terminate();
    }
  }, {
    key: '_dispatchTaskIfReady',
    value: function _dispatchTaskIfReady() {
      if (this._activeTask) {
        return;
      }
      if (this._taskQueue.length) {
        this._activeTask = this._taskQueue.shift();
      } else if (this._depTaskQueue.length) {
        this._activeTask = this._depTaskQueue.shift();
      }
      if (this._activeTask) {
        // dispatch it and start timers
        var workerMessage = this._activeTask.workerMessage;
        this._dispatchTask(workerMessage);
        this._timeoutTimer = setTimeout(function () {
          logger.warn('Webworker is stuck in a job!', JSON.stringify(workerMessage));
        }, this._webWorkerTimeout);
        this._performanceTimer = setTimeout(function () {
          logger.warn('Poor Webworker Performance!', JSON.stringify(workerMessage));
        }, this._poorPefTimeout);
      }
    }
  }, {
    key: '_dispatchTask',
    value: function _dispatchTask(task) {
      this._worker.postMessage(task);
    }
  }, {
    key: '_handleHackWorkerReply',
    value: function _handleHackWorkerReply(reply) {
      this._clearTimers();
      if (this._activeTask) {
        this._activeTask.onResponse(reply);
      } else {
        logger.error('Hack Worker replied without an active task!');
      }
      this._activeTask = null;
      this._dispatchTaskIfReady();
    }
  }, {
    key: '_handleHackWorkerError',
    value: function _handleHackWorkerError(error) {
      this._clearTimers();
      if (this._activeTask) {
        this._activeTask.onFail(error);
      } else {
        logger.error('Hack Worker errored without an active task!');
      }
      this._activeTask = null;
      this._dispatchTaskIfReady();
    }
  }, {
    key: '_clearTimers',
    value: function _clearTimers() {
      clearTimeout(this._timeoutTimer);
      clearTimeout(this._performanceTimer);
    }
  }]);

  return HackWorker;
})();

function startWebWorker() {
  // Hacky way to load the worker files from the filesystem as text,
  // then inject the text into Blob url for the WebWorker to consume.
  // http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string
  // I did so because I can't use the atom:// url protocol to load resources in javascript:
  // https://github.com/atom/atom/blob/master/src/browser/atom-protocol-handler.coffee
  var hhIdeText = fs.readFileSync(path.join(__dirname, '../static/hh_ide.js'));
  var webWorkerText = fs.readFileSync(path.join(__dirname, '../static/HackWebWorker.js'));
  // Concatenate the code text to pass to the Worker in a blob url
  var workerText = hhIdeText + '\n//<<MERGE>>\n' + webWorkerText;
  var Blob = window.Blob;
  var Worker = window.Worker;
  var URL = window.URL;

  var blob = new Blob([workerText], { type: 'application/javascript' });
  var worker = new Worker(URL.createObjectURL(blob));
  return worker;
}

module.exports = HackWorker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvZm9sZGVycy94Zi9yc3BoNF9jNTczMTVyczU3eHhzZHNrcnhudjM2dDAvVC90bXBlbW0ySHVwdWJsaXNoX3BhY2thZ2VzL2FwbS9udWNsaWRlLWhhY2svbGliL0hhY2tXb3JrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFDOzs7Ozs7Ozs7Ozs7OztBQVdaLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN2QixJQUFJLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDM0IsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7O0FBRXBELElBQUkseUJBQXlCLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztBQUMxQyxJQUFJLHlCQUF5QixHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7Ozs7Ozs7OztJQWlCbkMsVUFBVTtBQVdILFdBWFAsVUFBVSxDQVdGLE9BQTJCLEVBQUU7OzswQkFYckMsVUFBVTs7QUFZWixXQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUN4QixRQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUN4QixRQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNyQixRQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztBQUN4QixRQUFJLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixJQUFJLHlCQUF5QixDQUFDO0FBQy9FLFFBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDLGVBQWUsSUFBSSx5QkFBeUIsQ0FBQztBQUM1RSxRQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksY0FBYyxFQUFFLENBQUM7QUFDbEQsUUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsVUFBQyxDQUFDO2FBQUssTUFBSyxzQkFBc0IsQ0FBQyxD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QUFTLEdBQUcsaUJBQWlCLEdBQUcsYUFBYSxDQUFDO01BQzFELElBQUksR0FBaUIsTUFBTSxDQUEzQixJQUFJO01BQUUsTUFBTSxHQUFTLE1BQU0sQ0FBckIsTUFBTTtNQUFFLEdBQUcsR0FBSSxNQUFNLENBQWIsR0FBRzs7QUFDdEIsTUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBQyxDQUFDLENBQUM7QUFDcEUsTUFBSSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ25ELFNBQU8sTUFBTSxDQUFDO0NBQ2Y7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMiLCJmaWxlIjoiL3Zhci9mb2xkZXJzL3hmL3JzcGg0X2M1NzMxNXJzNTd4eHNkc2tyeG52MzZ0MC9UL3RtcGVtbTJIdXB1Ymxpc2hfcGFja2FnZXMvYXBtL251Y2xpZGUtaGFjay9saWIvSGFja1dvcmtlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2UgYmFiZWwnO1xuLyogQGZsb3cgKi9cblxuLypcbiAqIENvcHlyaWdodCAoYykgMjAxNS1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBsaWNlbnNlIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgaW5cbiAqIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbnZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbnZhciBsb2dnZXIgPSByZXF1aXJlKCdudWNsaWRlLWxvZ2dpbmcnKS5nZXRMb2dnZXIoKTtcblxudmFyIERFRkFVTFRfV0VCV09SS0VSX1RJTUVPVVQgPSAzMCAqIDEwMDA7XG52YXIgREVGQVVMVF9QT09SX1BFUkZfVElNRU9VVCA9IDggKiAxMDAwO1xuXG50eXBlIFdvcmtlclRhc2sgPSB7XG4gIHdvcmtlck1lc3NhZ2U6IGFueTtcbiAgb25SZXNwb25zZTogKHJlc3BvbnNlOiBhbnkpID0+IHZvaWQ7XG4gIG9uRmFpbDogKGVycm9yOiBFcnJvcikgPT4gdm9pZDtcbn07XG5cbi8qKlxuICogSGFja1dvcmtlciB1c2VzIHRoZSBoaF9pZGUuanMgdGhhdCdzIGEgdHJhbnNsYXRpb24gZnJvbSBPQ2FtbCB0byBKYXZhU2NyaXB0IChub3QgcmVhZGFibGUpLlxuICogSXQncyByZXNwb25zaWJsZSBmb3IgcHJvdmlkaW5nIGxhbmd1YWdlIHNlcnZpY2VzIHdpdGhvdXQgaGl0dGluZyB0aGUgc2VydmVyLCBpZiBwb3NzaWJsZS5cbiAqIGUuZy4gc29tZSBhdXRvY29tcGxldGlvbnMsIGdvIHRvIGRlZmluaXRpb24sIGRpYWdub3N0aWMgcmVxdWVzdHMgYW5kIG91dGxpbmUgY291bGQgYmUgc2VydmVkIGxvY2FsbHkuXG4gKiBUaGlzIGlzIGRvbmUgYXMgYSB3ZWIgd29ya2VyIG5vdCB0byBibG9jayB0aGUgbWFpbiBVSSB0aHJlYWQgd2hlbiBleGVjdXRpbmcgbGFuZ3VhZ2UgdGFza3MuXG4gKi9cblxudHlwZSBIYWNrV29ya2VyT3B0aW9ucyA9IHt3ZWJXb3JrZXJUaW1lb3V0OiA/bnVtYmVyOyBwb29yUGVyZlRpbWVvdXQ6ID9udW1iZXI7IHdvcmtlcjogP1dvcmtlcjt9O1xuXG5jbGFzcyBIYWNrV29ya2VyIHtcblxuICBfYWN0aXZlVGFzazogP1dvcmtlclRhc2s7XG4gIF90YXNrUXVldWU6IEFycmF5PFdvcmtlclRhc2s+O1xuICBfZGVwVGFza1F1ZXVlOiBBcnJheTxXb3JrZXJUYXNrPjtcbiAgX3dlYldvcmtlclRpbWVvdXQ6IG51bWJlcjtcbiAgX3Bvb3JQZWZUaW1lb3V0OiBudW1iZXI7XG4gIF93b3JrZXI6IFdvcmtlcjtcbiAgX3RpbWVvdXRUaW1lcjogYW55O1xuICBfcGVyZm9ybWFuY2VUaW1lcjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKG9wdGlvbnM6ID9IYWNrV29ya2VyT3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuX2FjdGl2ZVRhc2sgPSBudWxsO1xuICAgIHRoaXMuX3Rhc2tRdWV1ZSA9IFtdO1xuICAgIHRoaXMuX2RlcFRhc2tRdWV1ZSA9IFtdO1xuICAgIHRoaXMuX3dlYldvcmtlclRpbWVvdXQgPSBvcHRpb25zLndlYldvcmtlclRpbWVvdXQgfHwgREVGQVVMVF9XRUJXT1JLRVJfVElNRU9VVDtcbiAgICB0aGlzLl9wb29yUGVmVGltZW91dCA9IG9wdGlvbnMucG9vclBlcmZUaW1lb3V0IHx8IERFRkFVTFRfUE9PUl9QRVJGX1RJTUVPVVQ7XG4gICAgdGhpcy5fd29ya2VyID0gb3B0aW9ucy53b3JrZXIgfHwgc3RhcnRXZWJXb3JrZXIoKTtcbiAgICB0aGlzLl93b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIChlKSA9PiB0aGlzLl9oYW5kbGVIYWNrV29ya2VyUmVwbHkoZS5kYXRhKSwgZmFsc2UpO1xuICAgIHRoaXMuX3dvcmtlci5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChlcnJvcikgPT4gdGhpcy5faGFuZGxlSGFja1dvcmtlckVycm9yKGVycm9yKSwgZmFsc2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJ1bnMgYSB3ZWIgd29ya2VyIHRhc2sgYW5kIHJldHVybnMgYSBwcm9taXNlIG9mIHRoZSB2YWx1ZSBleHBlY3RlZCBmcm9tIHRoZSBoYWNrIHdvcmtlci5cbiAgICovXG4gIHJ1bldvcmtlclRhc2sod29ya2VyTWVzc2FnZTogYW55LCBvcHRpb25zOiBhbnkpOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgIHZhciBxdWV1ZSA9IG9wdGlvbnMuaXNEZXBlbmRlbmN5ID8gdGhpcy5fZGVwVGFza1F1ZXVlIDogdGhpcy5fdGFza1F1ZXVlO1xuICAgICAgcXVldWUucHVzaCh7XG4gICAgICAgIHdvcmtlck1lc3NhZ2UsXG4gICAgICAgIG9uUmVzcG9uc2U6IChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgIHZhciBpbnRlcm5hbEVycm9yID0gcmVzcG9uc2UuaW50ZXJuYWxfZXJyb3I7XG4gICAgICAgICAgaWYgKGludGVybmFsRXJyb3IpIHtcbiAgICAgICAgICAgIGxvZ2dlci5lcnJvcignSGFjayBXb3JrZXI6IEludGVybmFsIEVycm9yISAtICcgK1xuICAgICAgICAgICAgICAgIFN0cmluZyhpbnRlcm5hbEVycm9yKSArICcgLSAnICsgSlNPTi5zdHJpbmdpZnkod29ya2VyTWVzc2FnZSkpO1xuICAgICAgICAgICAgcmVqZWN0KGludGVybmFsRXJyb3IpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG9uRmFpbDogKGVycm9yKSA9PiB7XG4gICAgICAgICAgbG9nZ2VyLmVycm9yKCdIYWNrIFdvcmtlcjogRXJyb3IhJywgZXJyb3IsIEpTT04uc3RyaW5naWZ5KHdvcmtlck1lc3NhZ2UpKTtcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICB0aGlzLl9kaXNwYXRjaFRhc2tJZlJlYWR5KCk7XG4gICAgfSk7XG4gIH1cblxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuX3dvcmtlci50ZXJtaW5hdGUoKTtcbiAgfVxuXG4gIF9kaXNwYXRjaFRhc2tJZlJlYWR5KCkge1xuICAgIGlmICh0aGlzLl9hY3RpdmVUYXNrKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl90YXNrUXVldWUubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9hY3RpdmVUYXNrID0gdGhpcy5fdGFza1F1ZXVlLnNoaWZ0KCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLl9kZXBUYXNrUXVldWUubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9hY3RpdmVUYXNrID0gdGhpcy5fZGVwVGFza1F1ZXVlLnNoaWZ0KCk7XG4gICAgfVxuICAgIGlmICh0aGlzLl9hY3RpdmVUYXNrKSB7XG4gICAgICAvLyBkaXNwYXRjaCBpdCBhbmQgc3RhcnQgdGltZXJzXG4gICAgICB2YXIgd29ya2VyTWVzc2FnZSA9IHRoaXMuX2FjdGl2ZVRhc2sud29ya2VyTWVzc2FnZTtcbiAgICAgIHRoaXMuX2Rpc3BhdGNoVGFzayh3b3JrZXJNZXNzYWdlKTtcbiAgICAgIHRoaXMuX3RpbWVvdXRUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBsb2dnZXIud2FybignV2Vid29ya2VyIGlzIHN0dWNrIGluIGEgam9iIScsIEpTT04uc3RyaW5naWZ5KHdvcmtlck1lc3NhZ2UpKTtcbiAgICAgIH0sIHRoaXMuX3dlYldvcmtlclRpbWVvdXQpO1xuICAgICAgdGhpcy5fcGVyZm9ybWFuY2VUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICBsb2dnZXIud2FybignUG9vciBXZWJ3b3JrZXIgUGVyZm9ybWFuY2UhJywgSlNPTi5zdHJpbmdpZnkod29ya2VyTWVzc2FnZSkpO1xuICAgICAgfSwgdGhpcy5fcG9vclBlZlRpbWVvdXQpO1xuICAgIH1cbiAgfVxuXG4gIF9kaXNwYXRjaFRhc2sodGFzazogV29ya2VyVGFzaykge1xuICAgIHRoaXMuX3dvcmtlci5wb3N0TWVzc2FnZSh0YXNrKTtcbiAgfVxuXG4gIF9oYW5kbGVIYWNrV29ya2VyUmVwbHkocmVwbHk6IGFueSkge1xuICAgIHRoaXMuX2NsZWFyVGltZXJzKCk7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZVRhc2spIHtcbiAgICAgIHRoaXMuX2FjdGl2ZVRhc2sub25SZXNwb25zZShyZXBseSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ2dlci5lcnJvcignSGFjayBXb3JrZXIgcmVwbGllZCB3aXRob3V0IGFuIGFjdGl2ZSB0YXNrIScpO1xuICAgIH1cbiAgICB0aGlzLl9hY3RpdmVUYXNrID0gbnVsbDtcbiAgICB0aGlzLl9kaXNwYXRjaFRhc2tJZlJlYWR5KCk7XG4gIH1cblxuICBfaGFuZGxlSGFja1dvcmtlckVycm9yKGVycm9yOiBFcnJvcikge1xuICAgIHRoaXMuX2NsZWFyVGltZXJzKCk7XG4gICAgaWYgKHRoaXMuX2FjdGl2ZVRhc2spIHtcbiAgICAgIHRoaXMuX2FjdGl2ZVRhc2sub25GYWlsKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nZ2VyLmVycm9yKCdIYWNrIFdvcmtlciBlcnJvcmVkIHdpdGhvdXQgYW4gYWN0aXZlIHRhc2shJyk7XG4gICAgfVxuICAgIHRoaXMuX2FjdGl2ZVRhc2sgPSBudWxsO1xuICAgIHRoaXMuX2Rpc3BhdGNoVGFza0lmUmVhZHkoKTtcbiAgfVxuXG4gIF9jbGVhclRpbWVycygpIHtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZW91dFRpbWVyKTtcbiAgICBjbGVhclRpbWVvdXQodGhpcy5fcGVyZm9ybWFuY2VUaW1lcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3RhcnRXZWJXb3JrZXIoKTogV29ya2VyIHtcbiAgLy8gSGFja3kgd2F5IHRvIGxvYWQgdGhlIHdvcmtlciBmaWxlcyBmcm9tIHRoZSBmaWxlc3lzdGVtIGFzIHRleHQsXG4gIC8vIHRoZW4gaW5qZWN0IHRoZSB0ZXh0IGludG8gQmxvYiB1cmwgZm9yIHRoZSBXZWJXb3JrZXIgdG8gY29uc3VtZS5cbiAgLy8gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDM0MzkxMy9ob3ctdG8tY3JlYXRlLWEtd2ViLXdvcmtlci1mcm9tLWEtc3RyaW5nXG4gIC8vIEkgZGlkIHNvIGJlY2F1c2UgSSBjYW4ndCB1c2UgdGhlIGF0b206Ly8gdXJsIHByb3RvY29sIHRvIGxvYWQgcmVzb3VyY2VzIGluIGphdmFzY3JpcHQ6XG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hdG9tL2F0b20vYmxvYi9tYXN0ZXIvc3JjL2Jyb3dzZXIvYXRvbS1wcm90b2NvbC1oYW5kbGVyLmNvZmZlZVxuICB2YXIgaGhJZGVUZXh0ID0gZnMucmVhZEZpbGVTeW5jKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9zdGF0aWMvaGhfaWRlLmpzJykpO1xuICB2YXIgd2ViV29ya2VyVGV4dCA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4vc3RhdGljL0hhY2tXZWJXb3JrZXIuanMnKSk7XG4gIC8vIENvbmNhdGVuYXRlIHRoZSBjb2RlIHRleHQgdG8gcGFzcyB0byB0aGUgV29ya2VyIGluIGEgYmxvYiB1cmxcbiAgdmFyIHdvcmtlclRleHQgPSBoaElkZVRleHQgKyAnXFxuLy88PE1FUkdFPj5cXG4nICsgd2ViV29ya2VyVGV4dDtcbiAgdmFyIHtCbG9iLCBXb3JrZXIsIFVSTH0gPSB3aW5kb3c7XG4gIHZhciBibG9iID0gbmV3IEJsb2IoW3dvcmtlclRleHRdLCB7dHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnfSk7XG4gIHZhciB3b3JrZXIgPSBuZXcgV29ya2VyKFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikpO1xuICByZXR1cm4gd29ya2VyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhhY2tXb3JrZXI7XG4iXX0=
