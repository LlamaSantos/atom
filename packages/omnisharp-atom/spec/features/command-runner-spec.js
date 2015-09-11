var Omni = require('../../lib/omni-sharp-server/omni');
var rx_1 = require("rx");
var test_helpers_1 = require("../test-helpers");
var win32 = process.platform === "win32";
describe('Command Runner', function () {
    test_helpers_1.setupFeature(['features/command-runner']);
    it('adds commands', function () {
        var disposable = new rx_1.CompositeDisposable();
        waitsForPromise(function () {
            return test_helpers_1.openEditor('commands/project.json');
        });
        waitsForPromise(function () {
            return rx_1.Observable.merge(Omni.clients.map(function (z) { return true; }), Omni.listener.model.projects.map(function (z) { return true; })).debounce(10000).take(1).toPromise();
        });
        runs(function () {
            var commands = atom.commands;
            if (win32) {
                expect(commands.registeredCommands['omnisharp-dnx:commands-[web]-(watch)']).toBeTruthy();
            }
            else {
                expect(commands.registeredCommands['omnisharp-dnx:commands-[kestrel]-(watch)']).toBeTruthy();
            }
            expect(commands.registeredCommands['omnisharp-dnx:commands-[run]']).toBeTruthy();
            disposable.dispose();
        });
    });
    // TODO: Add Tests for the daemon
});
