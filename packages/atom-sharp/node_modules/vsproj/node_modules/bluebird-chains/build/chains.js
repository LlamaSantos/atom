(function() {
  var Chains, Promise, debug, isFunction, util,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Promise = require('bluebird');

  util = require('util');

  debug = require("debug")("chains:main");

  isFunction = function(functionToCheck) {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
  };

  Chains = (function() {
    function Chains() {
      this.loops = __bind(this.loops, this);
      this.run = __bind(this.run, this);
      this.push = __bind(this.push, this);
      this.data = [];
    }

    Chains.prototype.push = function(func, args, context) {
      if (!isFunction(func)) {
        throw "Unable to add promise as it is not a function, functions are require for delayed execution";
      }
      return this.data.push({
        func: func,
        args: args,
        context: context
      });
    };

    Chains.prototype.last = function() {
      return this.run(arguments, true);
    };

    Chains.prototype.collect = function() {
      return this.run(arguments, false);
    };

    Chains.prototype.run = function(args, concat) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var collect;
          collect = [];
          return _this.loops(_this.data.slice(0), args, concat, collect).then(resolve, reject)["catch"](function(e) {
            debug("run error", e);
            return reject(e);
          });
        };
      })(this));
    };

    Chains.prototype.loops = function(data, args, concat, collect) {
      if (concat == null) {
        concat = false;
      }
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var onComplete, p;
          onComplete = function(a) {
            if (a != null) {
              collect.push(a);
            }
            debug("execute complete");
            return _this.loops(data, arguments, concat, collect).then(resolve, reject)["catch"](function(e) {
              debug("error caught", e);
              return reject(e);
            });
          };
          p = data.shift();
          if (p != null) {
            debug("executing promise function");
            if (p.args != null) {
              args = p.args;
            }
            return p.func.apply(p.context, args).then(onComplete, reject)["catch"](function(e) {
              debug("error caught", e);
              return reject(e);
            });
          }
          debug("finished", collect.length, concat, collect);
          if (concat) {
            return resolve(collect[collect.length - 1]);
          } else {
            return resolve(collect);
          }
        };
      })(this));
    };

    return Chains;

  })();

  module.exports = Chains;

}).call(this);
