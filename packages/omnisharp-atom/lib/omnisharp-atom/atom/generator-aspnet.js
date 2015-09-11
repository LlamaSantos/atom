var rx_1 = require("rx");
var lodash_1 = require("lodash");
// TODO: Make sure it stays in sync with
var commands = [
    'AngularController',
    'AngularControllerAs',
    'AngularDirective',
    'AngularFactory',
    'AngularModule',
    'BowerJson',
    'Class',
    'CoffeeScript',
    'Config',
    'gitignore',
    'Gruntfile',
    'Gulpfile',
    'HTMLPage',
    'Interface',
    'JavaScript',
    'JScript',
    'JSON',
    'JSONSchema',
    'JSX',
    'Middleware',
    'MvcController',
    'MvcView',
    'PackageJson',
    'StartupClass',
    'StyleSheet',
    'StyleSheetLess',
    'StyleSheetSCSS',
    'TagHelper',
    'TextFile',
    'TypeScript',
    'TypeScriptConfig',
    'WebApiController'
];
var GeneratorAspnet = (function () {
    function GeneratorAspnet() {
        this.required = true;
        this.title = 'Aspnet Yeoman Generator';
        this.description = 'Enables the aspnet yeoman generator.';
    }
    GeneratorAspnet.prototype.activate = function () {
        var _this = this;
        this.disposable = new rx_1.CompositeDisposable();
        this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:new-application', function () { return _this.run("aspnet:app"); }));
        this.disposable.add(atom.commands.add('atom-workspace', 'omnisharp-atom:new-class', function () { return _this.run("aspnet:Class"); }));
        lodash_1.each(commands, function (command) {
            _this.disposable.add(atom.commands.add('atom-workspace', "omnisharp-atom:aspnet-" + command, function () { return _this.run("aspnet:" + command); }));
        });
    };
    GeneratorAspnet.prototype.run = function (command) {
        if (this.generator) {
            this.generator.run(command, undefined, { promptOnZeroDirectories: true });
        }
    };
    GeneratorAspnet.prototype.setup = function (generator) {
        this.generator = generator;
    };
    GeneratorAspnet.prototype.dispose = function () {
        this.disposable.dispose();
    };
    return GeneratorAspnet;
})();
exports.generatorAspnet = new GeneratorAspnet;
