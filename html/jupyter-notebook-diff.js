"use strict";
var JupyterNotebook;
(function (JupyterNotebook) {
    var Cell = (function () {
        function Cell(notebook, data) {
            this.notebook = notebook;
            this.cellType = data["cell_type"];
            this.metaData = data["metadata"];
            this.source = data["source"];
            this.id = (Cell.idCounter++).toString();
            this.selected = false;
            this.marked = false;
            this.$view = $(this.html());
        }
        Cell.prototype.html = function () {
            var html = '';
            html += '<div class="cell closed" data-role="cell" data-meme="' + this.meme;
            html += '" data-id="' + this.id + '">';
            html += '<div class="meme">';
            html += '<span class="open-button">+</span><span class="close-button">-</span>';
            html += '<span class="select-button">&nbsp;</span>';
            if (this.hasMeme) {
                var memeTokens = this.meme.split('-');
                html += '<b>' + memeTokens.shift() + '</b>-' + memeTokens.join('-');
            }
            html += '</div>';
            html += '<div class="source">' + this.sourceEscaped + '</div>';
            html += '</div>';
            return html;
        };
        Cell.prototype.updateStyle = function (left, right) {
            if (!this.hasMeme || left.length == 0) {
                this.$view.removeClass("changed1");
                this.$view.removeClass("changed2");
            }
            else if (left.length == 1) {
                if (this.checkChanged([this], left[0].getCellsByMeme(this.meme))) {
                    this.$view.addClass("changed1");
                    this.$view.removeClass("changed2");
                }
                else {
                    this.$view.removeClass("changed1");
                    this.$view.removeClass("changed2");
                }
            }
            else {
                var ch0 = this.checkChanged([this], left[0].getCellsByMeme(this.meme));
                var ch1 = this.checkChanged([this], left[1].getCellsByMeme(this.meme));
                var ch01 = this.checkChanged(left[0].getCellsByMeme(this.meme), left[1].getCellsByMeme(this.meme));
                if (ch01) {
                    if (ch0 == false) {
                        this.$view.removeClass("changed1");
                        this.$view.removeClass("changed2");
                    }
                    else if (ch1 == false) {
                        this.$view.addClass("changed1");
                        this.$view.removeClass("changed2");
                    }
                    else {
                        this.$view.removeClass("changed1");
                        this.$view.addClass("changed2");
                    }
                }
                else {
                    if (ch0 || ch1) {
                        this.$view.addClass("changed1");
                        this.$view.removeClass("changed2");
                    }
                    else {
                        this.$view.removeClass("changed1");
                        this.$view.removeClass("changed2");
                    }
                }
            }
        };
        Object.defineProperty(Cell.prototype, "hasMeme", {
            get: function () {
                if (this.metaData["lc_cell_meme"] === undefined) {
                    return false;
                }
                return this.metaData["lc_cell_meme"]["current"] !== undefined;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "meme", {
            get: function () {
                return this.metaData["lc_cell_meme"]["current"];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "memeUuid", {
            get: function () {
                return this.meme ? this.meme.split('-').slice(0, 5).join('-') : '';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "memeBranchNumber", {
            get: function () {
                var meme = this.meme || '';
                var numStr = meme.split('-').slice(5, 6).pop() || '';
                return numStr ? parseInt(numStr, 10) : 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "nextMeme", {
            get: function () {
                return this.metaData["lc_cell_meme"]["next"];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "prevMeme", {
            get: function () {
                return this.metaData["lc_cell_meme"]["previous"];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "sourceEscaped", {
            get: function () {
                var html = '';
                for (var i = 0; i < this.source.length; i++) {
                    html += this.source[i] + '<br>';
                }
                return html;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "sourceAll", {
            get: function () {
                return this.source.join('');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "x", {
            get: function () {
                return this.$view.offset().left;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "y", {
            get: function () {
                return this.$view.offset().top;
            },
            set: function (y) {
                this.$view.css('margin-top', y - this.y + 5);
            },
            enumerable: true,
            configurable: true
        });
        Cell.prototype.resetY = function () {
            this.$view.css('margin-top', 5);
        };
        Object.defineProperty(Cell.prototype, "width", {
            get: function () {
                return this.$view.width();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Cell.prototype, "height", {
            get: function () {
                return this.$view.height();
            },
            enumerable: true,
            configurable: true
        });
        Cell.prototype.select = function (selected) {
            if (this.selected != selected) {
                this.selected = selected;
                var $selectButton = this.$view.find('.select-button');
                $selectButton.empty();
                if (this.selected) {
                    $selectButton.prepend('&#x2714;');
                }
                else {
                    $selectButton.prepend('&nbsp;');
                }
            }
        };
        Cell.prototype.mark = function (marked) {
            if (this.marked != marked) {
                this.marked = marked;
                var $selectButton = this.$view.find('.select-button');
                if (this.marked) {
                    $selectButton.addClass('marked');
                }
                else {
                    $selectButton.removeClass('marked');
                }
            }
        };
        Cell.prototype.checkChanged = function (bases, cells) {
            for (var _i = 0, bases_1 = bases; _i < bases_1.length; _i++) {
                var base = bases_1[_i];
                for (var _a = 0, cells_1 = cells; _a < cells_1.length; _a++) {
                    var target = cells_1[_a];
                    if (target.source.join("\n") != base.source.join("\n")) {
                        return true;
                    }
                }
            }
            return false;
        };
        Cell.idCounter = 0;
        return Cell;
    }());
    JupyterNotebook.Cell = Cell;
})(JupyterNotebook || (JupyterNotebook = {}));
define(JupyterNotebook);
var JupyterNotebook;
(function (JupyterNotebook) {
    var DiffView = (function () {
        function DiffView(rootSelector, codeMirror, filenames, filecontents, errorCallback, _a) {
            var _b = (_a === void 0 ? {} : _a).matchType, matchType = _b === void 0 ? JupyterNotebook.RelationMatchType.Fuzzy : _b;
            this.rootSelector = rootSelector;
            this.codeMirror = codeMirror;
            this.$container = $(this.rootSelector);
            this.$mergeView = $('<div class="merge-view"></div>');
            this.loadingFilenames = filenames;
            this.loadingFilecontents = filecontents;
            this.notebooks = [];
            this.relations = [];
            this.matchType = matchType;
            this.loadNext(errorCallback !== undefined ? errorCallback : function (url) {
                console.error('Failed to load content', url);
            });
        }
        DiffView.prototype.loadNext = function (errorCallback) {
            var _this = this;
            if (this.loadingFilenames.length == 0) {
                this.render();
            }
            else {
                var rawFilename_1 = this.loadingFilenames.shift();
                if (this.loadingFilecontents.length == 0) {
                    var filename_1 = encodeURI(rawFilename_1);
                    $.getJSON(filename_1, function (data) {
                        _this.notebooks.push(new JupyterNotebook.Notebook(rawFilename_1, data));
                        if (_this.notebooks.length >= 2) {
                            var i = _this.notebooks.length - 2;
                            _this.relations.push(new JupyterNotebook.Relation(_this.notebooks[i], _this.notebooks[i + 1], { matchType: _this.matchType }));
                        }
                        _this.loadNext(errorCallback);
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        errorCallback(filename_1, jqXHR, textStatus, errorThrown);
                    });
                }
                else {
                    var data = this.loadingFilecontents.shift();
                    this.notebooks.push(new JupyterNotebook.Notebook(rawFilename_1, data));
                    if (this.notebooks.length >= 2) {
                        var i = this.notebooks.length - 2;
                        this.relations.push(new JupyterNotebook.Relation(this.notebooks[i], this.notebooks[i + 1]));
                    }
                    this.loadNext(errorCallback);
                }
            }
        };
        DiffView.prototype.getCellDom = function (notebookMeme, cellMeme) {
            return this.$container.find('.notebook[data-meme="' + notebookMeme + '"] > .cell[data-meme="' + cellMeme + '"]');
        };
        DiffView.prototype.getCellY = function (notebookMeme, cellMeme) {
            var offset = this.getCellDom(notebookMeme, cellMeme).offset();
            return offset == undefined ? NaN : offset.top;
        };
        DiffView.prototype.highlightCell = function (cellId) {
            this.$container.find('.cell').removeClass('highlight');
            if (cellId != null) {
                this.$container.find(".cell[data-id=\"" + cellId + "\"]").addClass('highlight');
                for (var _i = 0, _a = this.getRelatedCellsById(cellId); _i < _a.length; _i++) {
                    var cell = _a[_i];
                    this.$container.find(".cell[data-id=\"" + cell.id + "\"]").addClass('highlight');
                }
            }
        };
        DiffView.prototype.updateRelations = function () {
            for (var _i = 0, _a = this.relations; _i < _a.length; _i++) {
                var relation = _a[_i];
                relation.updateRelation();
                relation.updateView();
            }
        };
        DiffView.prototype.getSourceByMeme = function (meme, notebook) {
            if (notebook == null) {
                return null;
            }
            else {
                var cell = notebook.getCellByMeme(meme);
                return cell == null ? null : cell.sourceAll;
            }
        };
        DiffView.prototype.showMergeView = function (cellId) {
            var mergeViewElem = this.$mergeView[0];
            var notebooks = [];
            if (this.notebooks.length == 2) {
                notebooks = [null, this.notebooks[0], this.notebooks[1]];
            }
            else {
                notebooks = this.notebooks;
            }
            var relatedCells = this.getRelatedCellsById(cellId);
            var targetCell = this.cellById(cellId);
            var sources = [null, null, null];
            var _loop_1 = function (i) {
                if (!notebooks[i])
                    return "continue";
                var notebook = notebooks[i];
                if (notebook === targetCell.notebook) {
                    sources[i] = targetCell.sourceAll;
                }
                else {
                    var cell = relatedCells.filter(function (cell) { return notebook.cellList.indexOf(cell) !== -1; }).shift();
                    if (!cell)
                        return "continue";
                    sources[i] = cell.sourceAll;
                }
            };
            for (var i = 0; i < 3; i++) {
                _loop_1(i);
            }
            var self = this;
            var options = {
                value: sources[1],
                origLeft: sources[0],
                origRight: sources[2],
                lineNumbers: true,
                mode: "text/html",
                highlightDifferences: true,
                collapseIdentical: false,
                readOnly: true,
                extraKeys: {
                    Esc: function () {
                        self.hideMergeView();
                    }
                }
            };
            this.$mergeView.show();
            this.$container.find('.dark').show();
            var mv = this.codeMirror.MergeView(mergeViewElem, options);
            mv.edit.focus();
        };
        DiffView.prototype.hideMergeView = function () {
            this.$mergeView.empty();
            this.$mergeView.hide();
            this.$container.find('.dark').hide();
        };
        DiffView.prototype.maxCellY = function () {
            var y = 0;
            for (var _i = 0, _a = this.notebooks; _i < _a.length; _i++) {
                var notebook = _a[_i];
                var cell = notebook.selectedCell();
                if (cell != null) {
                    y = Math.max(y, cell.y);
                }
            }
            return y;
        };
        DiffView.prototype.resetCellY = function () {
            this.$container.find('.cell').css('margin-top', 5);
        };
        DiffView.prototype.alignCellY = function (y) {
            for (var _i = 0, _a = this.notebooks; _i < _a.length; _i++) {
                var notebook = _a[_i];
                var cell = notebook.selectedCell();
                if (cell != null) {
                    cell.y = y;
                }
            }
        };
        DiffView.prototype.alignSelected = function () {
            this.resetCellY();
            this.alignCellY(this.maxCellY());
        };
        DiffView.prototype.moveScrollY = function (deltaScrollY) {
            window.scroll(window.scrollX, window.screenY + deltaScrollY);
        };
        DiffView.prototype.cellById = function (id) {
            for (var _i = 0, _a = this.notebooks; _i < _a.length; _i++) {
                var notebook = _a[_i];
                for (var _b = 0, _c = notebook.cellList; _b < _c.length; _b++) {
                    var cell = _c[_b];
                    if (cell.id == id) {
                        return cell;
                    }
                }
            }
            return null;
        };
        DiffView.prototype.markByMeme = function (meme) {
            for (var _i = 0, _a = this.notebooks; _i < _a.length; _i++) {
                var notebook = _a[_i];
                notebook.markByMeme(meme);
            }
        };
        DiffView.prototype.select = function (cell) {
            for (var _i = 0, _a = this.notebooks; _i < _a.length; _i++) {
                var notebook = _a[_i];
                notebook.unselectAll();
                notebook.unmarkAll();
            }
            cell.select(true);
            cell.mark(true);
            for (var _b = 0, _c = this.getRelatedCellsById(cell.id); _b < _c.length; _b++) {
                var relatedCell = _c[_b];
                relatedCell.select(true);
                relatedCell.mark(true);
            }
        };
        DiffView.prototype.render = function () {
            var _this = this;
            var $wrapper = $('<div class="wrapper"></div>');
            this.$container.empty();
            this.$container.append($wrapper);
            for (var i = 0; i < this.notebooks.length; i++) {
                $wrapper.append(this.notebooks[i].$view);
                if (i != this.notebooks.length - 1) {
                    $wrapper.append(this.relations[i].$view);
                }
            }
            this.$container.append('<div class="dark"></div>');
            this.$container.append(this.$mergeView);
            this.$container.on('click', '.open-button', function (e) {
                $(e.target).parent().parent().removeClass('closed');
                _this.resetCellY();
                _this.updateRelations();
                return false;
            });
            this.$container.on('click', '.close-button', function (e) {
                $(e.target).parent().parent().addClass('closed');
                _this.resetCellY();
                _this.updateRelations();
                return false;
            });
            this.$container.on('click', '.select-button', function (e) {
                var $cell = $(e.target).parent().parent();
                var cell = _this.cellById($cell.attr('data-id'));
                if (cell != null) {
                    _this.select(cell);
                    _this.alignSelected();
                }
                return false;
            });
            this.$container.on('click', '.cell', function (e) {
                _this.showMergeView($(e.currentTarget).attr('data-id'));
            });
            this.$container.on('mouseenter', '.cell', function (e) {
                _this.highlightCell($(e.currentTarget).attr('data-id'));
            });
            this.$container.on('mouseleave', '.cell', function (e) {
                _this.highlightCell(null);
            });
            this.$container.on('click', '.dark', function (e) {
                _this.hideMergeView();
            });
            if (this.notebooks.length == 2) {
                this.notebooks[0].updateStyle([], [this.notebooks[1]]);
                this.notebooks[1].updateStyle([this.notebooks[0]], []);
            }
            else {
                this.notebooks[0].updateStyle([], this.notebooks.slice(1));
                this.notebooks[1].updateStyle([this.notebooks[0]], [this.notebooks[2]]);
                this.notebooks[2].updateStyle(this.notebooks.slice(0, 2), []);
            }
            setInterval(function () {
                _this.updateRelations();
            });
        };
        DiffView.prototype.getRelatedCellsById = function (cellId) {
            var queue = [cellId];
            var related = {};
            while (queue.length) {
                var current = queue.shift();
                for (var _i = 0, _a = this.relations; _i < _a.length; _i++) {
                    var relation = _a[_i];
                    for (var _b = 0, _c = relation.relatedCells[current] || []; _b < _c.length; _b++) {
                        var cell = _c[_b];
                        if (!related[cell.id]) {
                            related[cell.id] = cell;
                            queue.push(cell.id);
                        }
                    }
                }
            }
            return Object.keys(related).map(function (id) { return related[id]; });
        };
        return DiffView;
    }());
    JupyterNotebook.DiffView = DiffView;
})(JupyterNotebook || (JupyterNotebook = {}));
var JupyterNotebook;
(function (JupyterNotebook) {
    var Notebook = (function () {
        function Notebook(filename, data) {
            this.filename = filename;
            this.cellList = [];
            for (var i = 0; i < data["cells"].length; i++) {
                this.cellList.push(new JupyterNotebook.Cell(this, data["cells"][i]));
            }
            this.cellMap = {};
            for (var i = 0; i < this.cellList.length; i++) {
                var meme = this.cellList[i].meme;
                if (this.cellMap[meme] == undefined) {
                    this.cellMap[meme] = [];
                }
                this.cellMap[meme].push(this.cellList[i]);
            }
            this.meme = data["metadata"]["lc_notebook_meme"]["current"];
            this.$view = $(this.html());
            for (var i = 0; i < this.cellList.length; i++) {
                this.$view.append(this.cellList[i].$view);
            }
        }
        Notebook.prototype.html = function () {
            var html = '';
            html += '<div class="notebook" data-role="notebook" data-meme="' + this.meme + '">';
            html += '<div class="title">' + this.filename + '</div>';
            html += '</div>';
            return html;
        };
        Notebook.prototype.updateStyle = function (left, right) {
            for (var _i = 0, _a = this.cellList; _i < _a.length; _i++) {
                var cell = _a[_i];
                cell.updateStyle(left, right);
            }
        };
        Notebook.prototype.getCellsByMeme = function (meme) {
            var cells = this.cellMap[meme];
            return cells == undefined ? [] : cells;
        };
        Notebook.prototype.getCellByMeme = function (meme) {
            return this.getCellsByMeme(meme)[0];
        };
        Notebook.prototype.getCellAt = function (index) {
            return this.cellList[index];
        };
        Notebook.prototype.unselectAll = function () {
            for (var _i = 0, _a = this.cellList; _i < _a.length; _i++) {
                var cell = _a[_i];
                cell.select(false);
            }
        };
        Notebook.prototype.selectedMeme = function () {
            var cell = this.selectedCell();
            return cell == null ? null : cell.meme;
        };
        Notebook.prototype.selectByMeme = function (meme) {
            var cell = this.getCellByMeme(meme);
            if (cell != null) {
                cell.select(true);
            }
        };
        Notebook.prototype.selectedCell = function () {
            for (var _i = 0, _a = this.cellList; _i < _a.length; _i++) {
                var cell = _a[_i];
                if (cell.selected) {
                    return cell;
                }
            }
            return null;
        };
        Notebook.prototype.markByMeme = function (meme) {
            for (var _i = 0, _a = this.cellList; _i < _a.length; _i++) {
                var cell = _a[_i];
                cell.mark(cell.meme == meme);
            }
        };
        Notebook.prototype.unmarkAll = function () {
            for (var _i = 0, _a = this.cellList; _i < _a.length; _i++) {
                var cell = _a[_i];
                cell.mark(false);
            }
        };
        Object.defineProperty(Notebook.prototype, "count", {
            get: function () {
                return this.cellList.length;
            },
            enumerable: true,
            configurable: true
        });
        return Notebook;
    }());
    JupyterNotebook.Notebook = Notebook;
})(JupyterNotebook || (JupyterNotebook = {}));
var JupyterNotebook;
(function (JupyterNotebook) {
    var RelationMatchType;
    (function (RelationMatchType) {
        RelationMatchType["Exact"] = "exact";
        RelationMatchType["Fuzzy"] = "fuzzy";
    })(RelationMatchType = JupyterNotebook.RelationMatchType || (JupyterNotebook.RelationMatchType = {}));
    var Relation = (function () {
        function Relation(notebookLeft, notebookRight, _a) {
            var _b = (_a === void 0 ? {} : _a).matchType, matchType = _b === void 0 ? RelationMatchType.Fuzzy : _b;
            this.notebookLeft = notebookLeft;
            this.notebookRight = notebookRight;
            this.$view = $('<div class="relation"></div>');
            this.relatedCells = {};
            this.matchType = matchType;
        }
        Relation.prototype.updateRelation = function () {
            var _this = this;
            this.relatedCells = {};
            for (var _i = 0, _a = this.notebookLeft.cellList; _i < _a.length; _i++) {
                var cellLeft = _a[_i];
                this.relatedCells[cellLeft.id] = [];
            }
            for (var _b = 0, _c = this.notebookRight.cellList; _b < _c.length; _b++) {
                var cellRight = _c[_b];
                this.relatedCells[cellRight.id] = [];
            }
            if (this.matchType === RelationMatchType.Fuzzy) {
                var usedRightCells_1 = {};
                for (var _d = 0, _e = this.notebookLeft.cellList; _d < _e.length; _d++) {
                    var cellLeft = _e[_d];
                    var cellRightList = this.notebookRight.getCellsByMeme(cellLeft.meme)
                        .filter(function (cell) { return !usedRightCells_1[cell.id]; });
                    if (cellRightList.length) {
                        var cellRight = cellRightList[0];
                        this.relatedCells[cellLeft.id].push(cellRight);
                        this.relatedCells[cellRight.id].push(cellLeft);
                        usedRightCells_1[cellRight.id] = true;
                    }
                }
                var _loop_2 = function (cellLeft) {
                    var cellRightList = this_1.notebookRight.cellList
                        .filter(function (cell) { return !usedRightCells_1[cell.id]; })
                        .filter(function (cell) { return cellLeft.memeUuid === cell.memeUuid; })
                        .filter(function (cell) { return cellLeft.memeBranchNumber < cell.memeBranchNumber; });
                    if (cellRightList.length) {
                        var cellRight = cellRightList[0];
                        this_1.relatedCells[cellLeft.id].push(cellRight);
                        this_1.relatedCells[cellRight.id].push(cellLeft);
                        usedRightCells_1[cellRight.id] = true;
                    }
                };
                var this_1 = this;
                for (var _f = 0, _g = this.notebookLeft.cellList.filter(function (cell) { return !_this.relatedCells[cell.id].length; }); _f < _g.length; _f++) {
                    var cellLeft = _g[_f];
                    _loop_2(cellLeft);
                }
                var _loop_3 = function (cellLeft) {
                    var cellRightList = this_2.notebookRight.cellList
                        .filter(function (cell) { return !usedRightCells_1[cell.id]; })
                        .filter(function (cell) { return cellLeft.memeUuid === cell.memeUuid; });
                    if (cellRightList.length) {
                        var cellRight = cellRightList[0];
                        this_2.relatedCells[cellLeft.id].push(cellRight);
                        this_2.relatedCells[cellRight.id].push(cellLeft);
                        usedRightCells_1[cellRight.id] = true;
                    }
                };
                var this_2 = this;
                for (var _h = 0, _j = this.notebookLeft.cellList.filter(function (cell) { return !_this.relatedCells[cell.id].length; }); _h < _j.length; _h++) {
                    var cellLeft = _j[_h];
                    _loop_3(cellLeft);
                }
            }
            else if (this.matchType === RelationMatchType.Exact) {
                for (var _k = 0, _l = this.notebookLeft.cellList; _k < _l.length; _k++) {
                    var cellLeft = _l[_k];
                    var cellRightList = this.notebookRight.getCellsByMeme(cellLeft.meme);
                    for (var _m = 0, cellRightList_1 = cellRightList; _m < cellRightList_1.length; _m++) {
                        var cellRight = cellRightList_1[_m];
                        this.relatedCells[cellLeft.id].push(cellRight);
                        this.relatedCells[cellRight.id].push(cellLeft);
                    }
                }
            }
            else {
                throw new Error("Invalid match type: " + this.matchType);
            }
        };
        Relation.prototype.updateView = function () {
            this.$view.html(this.html());
        };
        Relation.prototype.html = function () {
            var html = '';
            var offsetY = -this.$view.offset().top + 14;
            var height = Math.max(this.notebookLeft.$view.height(), this.notebookRight.$view.height());
            html += '<div class="relation" style="height: ' + height + 'px">';
            html += '<svg width="50" height="' + height + '">';
            for (var _i = 0, _a = this.notebookLeft.cellList; _i < _a.length; _i++) {
                var cellLeft = _a[_i];
                for (var _b = 0, _c = this.relatedCells[cellLeft.id]; _b < _c.length; _b++) {
                    var cellRight = _c[_b];
                    var y0 = cellLeft.y + offsetY;
                    var y1 = cellRight.y + offsetY;
                    html += '<path d="M 0,' + y0 + ' C 25,' + y0 + ' 25,' + y1 + ' 50,' + y1;
                    html += '" fill="none" stroke="#eee" style="stroke-width:1.5px;" />';
                }
            }
            html += '</svg>';
            html += '</div>';
            return html;
        };
        return Relation;
    }());
    JupyterNotebook.Relation = Relation;
})(JupyterNotebook || (JupyterNotebook = {}));
//# sourceMappingURL=jupyter-notebook-diff.js.map