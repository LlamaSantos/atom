(function() {
  var Promise, VsProj, vsSolution;

  Promise = require("bluebird");

  vsSolution = require("./solution");

  VsProj = (function() {
    function VsProj() {}

    VsProj.openSolution = function(file) {
      return new Promise(function(resolve, reject) {
        var sol;
        sol = new vsSolution();
        return sol.open(file).then(function() {
          return resolve(sol);
        });
      });
    };

    return VsProj;

  })();

  module.exports = VsProj;

}).call(this);
