(function() {
  var Chains, Promise, debug, expect, getRandomArbitrary;

  Promise = require("bluebird");

  Chains = require("../index");

  expect = require('chai').expect;

  debug = require("debug")("chains:tests");

  getRandomArbitrary = function(min, max) {
    return Math.random() * (max - min) + min;
  };

  describe('Testing Chains', function() {
    it('concurrency consistancy check', function() {
      var argData, initData, len, p;
      len = 5;
      p = new Chains;
      initData = 10;
      argData = 29;
      p.push(function(data) {
        return new Promise(function(resolve, reject) {
          data = data / 2;
          return resolve(data);
        });
      });
      p.push(function(data) {
        return new Promise(function(resolve, reject) {
          var ex;
          ex = function() {
            var r;
            r = new Promise(function(res, rej) {
              data = data + 2;
              return res(data);
            });
            return r.then(resolve, reject);
          };
          return setTimeout(ex, getRandomArbitrary(0, 500));
        });
      }, [argData]);
      p.push(function(data) {
        return new Promise(function(resolve, reject) {
          data = data * 3;
          return resolve(data);
        });
      });
      debug("start");
      return p.last(initData).then(function(result) {
        debug("end", result);
        return expect(result).to.equal((argData + 2) * 3);
      });
    });
    return it('Last test with functions', function() {
      var count, i, len, p, _i;
      len = 5;
      p = new Chains;
      count = 0;
      for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
        p.push(function(a) {
          if (a == null) {
            a = 0;
          }
          return new Promise(function(resolve, reject) {
            var ex;
            ex = function() {
              var v;
              v = new Promise(function(rs, rj) {
                var c;
                debug("in", a);
                expect(count).to.equal(a);
                count++;
                c = a + 1;
                debug("out", c);
                return resolve(c);
              });
              return v.then(resolve, reject);
            };
            return setTimeout(ex, getRandomArbitrary(0, 200));
          });
        });
      }
      debug("start");
      return p.last(0).then(function(result) {
        debug("end");
        expect(result).to.equal(len);
        return expect(p.data.length).to.equal(len);
      });
    });
  });

}).call(this);
