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
            var memeTokens = this.meme.split('-');
            html += '<b>' + memeTokens.shift() + '</b>-' + memeTokens.join('-');
            html += '</div>';
            html += '<div class="source">' + this.sourceEscaped + '</div>';
            html += '</div>';
            return html;
        };
        Object.defineProperty(Cell.prototype, "meme", {
            get: function () {
                return this.metaData["lc_cell_meme"]["current"];
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
        Cell.idCounter = 0;
        return Cell;
    }());
    JupyterNotebook.Cell = Cell;
})(JupyterNotebook || (JupyterNotebook = {}));
var JupyterNotebook;
(function (JupyterNotebook) {
    var DiffView = (function () {
        function DiffView(rootSelector, filenames) {
            this.rootSelector = rootSelector;
            this.$container = $(this.rootSelector);
            this.$mergeView = $('<div class="merge-view"></div>');
            this.loadingFilenames = filenames;
            this.notebooks = [];
            this.relations = [];
            this.loadNext();
        }
        DiffView.prototype.loadNext = function () {
            var _this = this;
            if (this.loadingFilenames.length == 0) {
                this.render();
            }
            else {
                var filename_1 = this.loadingFilenames.shift();
                $.getJSON(filename_1, function (data) {
                    _this.notebooks.push(new JupyterNotebook.Notebook(filename_1, data));
                    if (_this.notebooks.length >= 2) {
                        var i = _this.notebooks.length - 2;
                        _this.relations.push(new JupyterNotebook.Relation(_this.notebooks[i], _this.notebooks[i + 1]));
                    }
                    _this.loadNext();
                });
            }
        };
        DiffView.prototype.getCellDom = function (notebookMeme, cellMeme) {
            return this.$container.find('.notebook[data-meme="' + notebookMeme + '"] > .cell[data-meme="' + cellMeme + '"]');
        };
        DiffView.prototype.getCellY = function (notebookMeme, cellMeme) {
            var offset = this.getCellDom(notebookMeme, cellMeme).offset();
            return offset == undefined ? NaN : offset.top;
        };
        DiffView.prototype.highlightCell = function (meme) {
            this.$container.find('.cell').removeClass('highlight');
            if (meme != null) {
                this.$container.find('.cell[data-meme="' + meme + '"]').addClass('highlight');
            }
        };
        DiffView.prototype.updateRelations = function () {
            for (var _i = 0, _a = this.relations; _i < _a.length; _i++) {
                var relation = _a[_i];
                relation.update();
            }
        };
        DiffView.prototype.showMergeView = function (meme) {
            var mergeViewElem = this.$mergeView[0];
            var options = {
                value: this.notebooks[2].getCellByMeme(meme).sourceAll,
                origLeft: this.notebooks[0].getCellByMeme(meme).sourceAll,
                origRight: this.notebooks[1].getCellByMeme(meme).sourceAll,
                lineNumbers: true,
                mode: "text/html",
                highlightDifferences: true,
                collapseIdentical: false,
                readOnly: true
            };
            this.$mergeView.show();
            this.$container.find('.dark').show();
            CodeMirror.MergeView(mergeViewElem, options);
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
                if (notebook != cell.notebook) {
                    if (cell.meme != notebook.selectedMeme()) {
                        notebook.unselectAll();
                        notebook.selectByMeme(cell.meme);
                    }
                }
            }
            cell.notebook.unselectAll();
            cell.select(true);
            this.markByMeme(cell.meme);
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
                var meme = $(e.currentTarget).attr('data-meme');
                _this.showMergeView(meme);
            });
            this.$container.on('mouseenter', '.cell', function (e) {
                _this.highlightCell($(e.currentTarget).attr('data-meme'));
            });
            this.$container.on('mouseleave', '.cell', function (e) {
                _this.highlightCell(null);
            });
            this.$container.on('click', '.dark', function (e) {
                _this.hideMergeView();
            });
            setInterval(function () {
                _this.updateRelations();
            });
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
    var Relation = (function () {
        function Relation(notebookLeft, notebookRight) {
            this.notebookLeft = notebookLeft;
            this.notebookRight = notebookRight;
            this.$view = $('<div class="relation"></div>');
        }
        Relation.prototype.update = function () {
            this.$view.html(this.html());
        };
        Relation.prototype.html = function () {
            var html = '';
            var offsetY = -this.$view.offset().top + 14;
            var height = Math.max(this.notebookLeft.$view.height(), this.notebookRight.$view.height());
            html += '<div class="relation">';
            html += '<svg width="50" height="' + height + '">';
            for (var i = 0; i < this.notebookLeft.count; i++) {
                var cellLeft = this.notebookLeft.getCellAt(i);
                var cellRightList = this.notebookRight.getCellsByMeme(cellLeft.meme);
                for (var j = 0; j < cellRightList.length; j++) {
                    var cellRight = cellRightList[j];
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