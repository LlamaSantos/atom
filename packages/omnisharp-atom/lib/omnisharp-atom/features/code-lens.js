var _ = require('lodash');
var rx_1 = require("rx");
var Omni = require('../../omni-sharp-server/omni');
var CodeLens = (function () {
    function CodeLens() {
        this.decorations = new WeakMap();
        this.required = false;
        this.title = 'Code Lens';
        this.description = 'Adds support for displaying references in the editor.';
    }
    CodeLens.prototype.activate = function () {
        var _this = this;
        this.disposable = new rx_1.CompositeDisposable();
        this.disposable.add(Omni.editors.subscribe(function (editor) {
            var ad = Omni.activeEditor
                .where(function (active) { return active === editor; })
                .subscribe(function () {
                var cd = new rx_1.CompositeDisposable();
                _this.disposable.add(cd);
                cd.add(editor.onDidDestroy(function () {
                    _this.disposable.remove(cd);
                    cd.dispose();
                }));
                cd.add(rx_1.Disposable.create(function () {
                    var markers = _this.decorations.get(editor);
                    _.each(markers, function (marker) { return marker && marker.dispose(); });
                    _this.decorations.set(editor, []);
                }));
                cd.add(atom.config.observe('editor.fontSize', function (size) {
                    var decorations = _this.decorations.get(editor);
                    var lineHeight = editor.getLineHeightInPixels();
                    if (decorations && lineHeight) {
                        _.each(decorations, function (lens) {
                            lens.updateTop(lineHeight);
                        });
                    }
                }));
                _.defer(function () {
                    _this.disposable.remove(ad);
                    ad.dispose();
                });
            });
            _this.disposable.add(ad);
        }));
        this.disposable.add(Omni.switchActiveEditor(function (editor, cd) {
            var items = _this.decorations.get(editor);
            if (!items)
                _this.decorations.set(editor, []);
            var subject = new rx_1.Subject();
            cd.add(subject);
            cd.add(subject
                .debounce(500)
                .flatMapLatest(function () { return _this.updateCodeLens(editor); })
                .subscribe(function () { }));
            cd.add(editor.getBuffer().onDidStopChanging(function () { return subject.onNext(null); }));
            cd.add(editor.getBuffer().onDidSave(function () { return subject.onNext(null); }));
            cd.add(editor.getBuffer().onDidReload(function () { return subject.onNext(null); }));
            cd.add(Omni.whenEditorConnected(editor).subscribe(function () { return subject.onNext(null); }));
            cd.add(editor.onDidChangeScrollTop(function () {
                _this.updateDecoratorVisiblility(editor);
            }));
            cd.add(atom.commands.onWillDispatch(function (event) {
                if (_.contains(["omnisharp-atom:toggle-dock", "omnisharp-atom:show-dock", "omnisharp-atom:hide-dock"], event.type)) {
                    _this.updateDecoratorVisiblility(editor);
                }
            }));
            _this.updateDecoratorVisiblility(editor);
        }));
    };
    CodeLens.prototype.updateDecoratorVisiblility = function (editor) {
        var decorations = this.decorations.get(editor);
        _.each(decorations, function (decoration) {
            decoration.updateVisible();
        });
    };
    CodeLens.prototype.dispose = function () {
        this.disposable.dispose();
    };
    CodeLens.prototype.updateCodeLens = function (editor) {
        if (!this.decorations.has(editor))
            this.decorations.set(editor, []);
        var decorations = this.decorations.get(editor);
        var lineHeight = editor.getLineHeightInPixels();
        var updated = new WeakSet();
        _.each(decorations, function (x) { return x.invalidate(); });
        return Omni.request(editor, function (solution) {
            return solution.currentfilemembersasflat(solution.makeRequest(editor));
        })
            .concatMap(function (fileMembers) { return rx_1.Observable.from(fileMembers)
            .flatMap(function (x) { return rx_1.Observable.just(x).delay(100); }); })
            .map(function (fileMember) {
            var range = editor.getBuffer().rangeForRow(fileMember.Line, false);
            var marker = editor.markBufferRange(range, { invalidate: 'inside' });
            var lens = _.find(decorations, function (d) { return d.isEqual(marker); });
            if (lens) {
                updated.add(lens);
            }
            else {
                lens = new Lens(editor, fileMember, marker, range, rx_1.Disposable.create(function () {
                    _.pull(decorations, lens);
                }));
                updated.add(lens);
                decorations.push(lens);
            }
            return lens;
        })
            .tapOnCompleted(function () {
            // Remove all old/missing decorations
            _.each(decorations, function (d) {
                if (d && !updated.has(d)) {
                    d.dispose();
                }
            });
        })
            .tapOnNext(function (lens) { return lens.updateVisible(); });
    };
    return CodeLens;
})();
function isLineVisible(editor, line) {
    var element = atom.views.getView(editor);
    var top = element.getFirstVisibleScreenRow();
    var bottom = element.getLastVisibleScreenRow();
    if (line <= top || line >= bottom)
        return false;
    return true;
}
var Lens = (function () {
    function Lens(_editor, _member, _marker, _range, disposer) {
        var _this = this;
        this._editor = _editor;
        this._member = _member;
        this._marker = _marker;
        this._range = _range;
        this._disposable = new rx_1.CompositeDisposable();
        this.loaded = false;
        this._row = _range.getRows()[0];
        this._update = new rx_1.Subject();
        this._disposable.add(this._update);
        this._path = _editor.getPath();
        this._updateObservable = this._update
            .where(function (x) { return !!x; })
            .flatMap(function () { return Omni.request(_this._editor, function (solution) {
            return solution.findusages({ FileName: _this._path, Column: _this._member.Column + 1, Line: _this._member.Line }, { silent: true });
        }); })
            .map(function (x) { return x.QuickFixes.length - 1; })
            .publish()
            .refCount();
        this._disposable.add(this._updateObservable
            .take(1)
            .where(function (x) { return x > 0; })
            .tapOnNext(function () { return _this.loaded = true; })
            .subscribe(function (x) { return _this._decorate(x); }));
        this._disposable.add(this._marker.onDidDestroy(function () {
            _this.dispose();
        }));
        this._disposable.add(disposer);
    }
    Lens.prototype.updateVisible = function () {
        var isVisible = this._isVisible();
        this._updateDecoration(isVisible);
        this._update.onNext(isVisible);
    };
    Lens.prototype.updateTop = function (lineHeight) {
        if (this._element)
            this._element.style.top = "-" + lineHeight + "px";
    };
    Lens.prototype.invalidate = function () {
        var _this = this;
        this._updateObservable
            .take(1)
            .subscribe(function (x) {
            if (x === 0) {
                _this.dispose();
            }
            else {
                _this._element && (_this._element.textContent = x.toString());
            }
        });
    };
    Lens.prototype.isEqual = function (marker) {
        return this._marker.isEqual(marker);
    };
    Lens.prototype._isVisible = function () {
        return isLineVisible(this._editor, this._row);
    };
    Lens.prototype._updateDecoration = function (isVisible) {
        if (this._decoration && this._element) {
            if (isVisible && this._element.style.display === 'none') {
                this._element.style.display = '';
            }
            else if (!isVisible && this._element.style.display !== 'none') {
                this._element.style.display = 'none';
            }
        }
    };
    Lens.prototype._decorate = function (count) {
        var _this = this;
        var lineHeight = this._editor.getLineHeightInPixels();
        var element = this._element = document.createElement('div');
        element.style.position = 'relative';
        element.style.top = "-" + lineHeight + "px";
        element.style.left = '16px';
        element.classList.add('highlight-info', 'badge', 'badge-small');
        element.textContent = count.toString();
        element.onclick = function () {
            var _this = this;
            Omni.request(this._editor, function (s) { return s.findusages({ FileName: _this._path, Column: _this._member.Column + 1, Line: _this._member.Line }); });
        };
        this._decoration = this._editor.decorateMarker(this._marker, { type: "overlay", class: "codelens", item: element, position: 'head' });
        this._disposable.add(rx_1.Disposable.create(function () {
            _this._decoration.destroy();
            _this._element = null;
        }));
        var isVisible = isLineVisible(this._editor, this._row);
        if (!isVisible) {
            element.style.display = 'none';
        }
        return this._decoration;
    };
    Lens.prototype.dispose = function () { return this._disposable.dispose(); };
    return Lens;
})();
exports.Lens = Lens;
exports.codeLens = new CodeLens();
