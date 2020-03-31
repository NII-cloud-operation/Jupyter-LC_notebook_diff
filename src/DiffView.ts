/// <reference path="../typings/index.d.ts" />
declare var define:any;
define(JupyterNotebook);

namespace JupyterNotebook {

	export class DiffView {
		/** セレクタ */
		rootSelector: string;

		codeMirror: any;

		/** コンテナ */
		$container: JQuery;

		/** マージするためのビュー */
		$mergeView: JQuery;

		/** ファイル名の配列 */
		loadingFilenames: string[];

		/** ファイルデータの配列 */
		loadingFilecontents: string[];

		/** ロードされたノートブック */
		notebooks: Notebook[];

		/** リレーション */
		relations: Relation[];

		/** マッチタイプ */
		matchType: RelationMatchType;

		/** 初期化 */
		constructor(rootSelector: string, codeMirror: any, filenames: string[],
					filecontents: string[],
					errorCallback?: (url: string, jqXHR: any, textStatus: string, errorThrown: any) => void,
					{matchType = RelationMatchType.Fuzzy}: { matchType?: RelationMatchType } = {}) {
			this.rootSelector = rootSelector;
			this.codeMirror = codeMirror;
			this.$container = $(this.rootSelector);
			this.$mergeView = $('<div class="merge-view"></div>');
			this.loadingFilenames = filenames;
			this.loadingFilecontents = filecontents;
			this.notebooks = [];
			this.relations = [];
			this.matchType = matchType;
			this.loadNext(errorCallback !== undefined ? errorCallback : url => {
				console.error('Failed to load content', url);
			});
		}

		/** 次のNotebookをロードする */
		private loadNext(errorCallback: (url: string, jqXHR: any, textStatus: string, errorThrown: any) => void): void {
			if (this.loadingFilenames.length == 0) {
				// 描画
				this.render();
			} else {
				// ロード
				let rawFilename = this.loadingFilenames.shift() as string;
				if (this.loadingFilecontents.length == 0) {
					let filename = encodeURI(rawFilename);
					$.getJSON(filename, data => {
					        this.notebooks.push(new Notebook(rawFilename, data));
									if (this.notebooks.length >= 2) {
										let i = this.notebooks.length - 2;
										this.relations.push(new Relation(this.notebooks[i], this.notebooks[i + 1],
											{matchType: this.matchType}));
									}
									this.loadNext(errorCallback);
					}).fail((jqXHR, textStatus, errorThrown) => {
						errorCallback(filename, jqXHR, textStatus, errorThrown);
					});
				} else {
					var data = this.loadingFilecontents.shift() as string;
					this.notebooks.push(new Notebook(rawFilename, data));
					if (this.notebooks.length >= 2) {
						let i = this.notebooks.length - 2;
						this.relations.push(new Relation(this.notebooks[i],
							                               this.notebooks[i + 1]));
					}
					this.loadNext(errorCallback);
				}
			}
		}

		/**
		 * セルのJQueryオブジェクトを取得する。
		 */
		private getCellDom(notebookMeme: string, cellMeme: string): JQuery {
			return this.$container.find('.notebook[data-meme="' + notebookMeme + '"] > .cell[data-meme="' + cellMeme + '"]');
		}

		/**
		 * セルが表示されている矩形を取得する。
		 */
		private getCellY(notebookMeme: string, cellMeme: string): number {
			let offset = this.getCellDom(notebookMeme, cellMeme).offset();
			return offset == undefined ? NaN : offset.top;
		}

		/** セルをハイライトする */
		private highlightCell(cellId: string | null): void {
			this.$container.find('.cell').removeClass('highlight');
			if (cellId != null) {
				this.$container.find(`.cell[data-id="${cellId}"]`).addClass('highlight');
				for (const cell of this.getRelatedCellsById(cellId)) {
					this.$container.find(`.cell[data-id="${cell.id}"]`).addClass('highlight');
				}
			}
		}

		/** リレーションを更新する */
		private updateRelations(): void {
			for (let relation of this.relations) {
				relation.updateRelation();
				relation.updateView();
			}
		}

		private getSourceByMeme(meme: string, notebook: Notebook | null): string | null {
			if (notebook == null) {
				return null;
			} else {
				let cell = notebook.getCellByMeme(meme);
				return cell == null ? null : cell.sourceAll;
			}
		}

		/** マージビューを表示する */
		private showMergeView(cellId: string): void {
			let mergeViewElem = this.$mergeView[0];
			let notebooks: Array<Notebook | null> = [];
			if (this.notebooks.length == 2) {
				notebooks = [null, this.notebooks[0], this.notebooks[1]];
			} else {
				notebooks = this.notebooks;
			}

			const relatedCells = this.getRelatedCellsById(cellId);
			const targetCell = this.cellById(cellId) as Cell;
			const sources: Array<string | null> = [null, null, null];
			for (let i = 0; i < 3; i++) {
				if (!notebooks[i]) continue;
				const notebook = notebooks[i] as Notebook;
				if (notebook === targetCell.notebook) {
					sources[i] = targetCell.sourceAll;
				} else {
					const cell = relatedCells.filter(cell => notebook.cellList.indexOf(cell) !== -1).shift();
					if (!cell) continue;
					sources[i] = cell.sourceAll;
				}
			}

			let self = this;
			let options = {
				value: sources[1],
				origLeft: sources[0],
				origRight: sources[2],
				lineNumbers: true,
				mode: "text/html",
				highlightDifferences: true,
				collapseIdentical: false,
				readOnly: true,
				extraKeys: {
					Esc: function(){
						self.hideMergeView();
					}
				}
			};
			this.$mergeView.show();
			this.$container.find('.dark').show();
			let mv = this.codeMirror.MergeView(mergeViewElem, options);
			mv.edit.focus();
		}

		/** マージビューを閉じる */
		private hideMergeView(): void {
			this.$mergeView.empty();
			this.$mergeView.hide();
			this.$container.find('.dark').hide();
		}

		/** 選択中の揃えるべきY座標を求める */
		private maxCellY(): number {
			let y: number = 0;
			for (let notebook of this.notebooks) {
				let cell = notebook.selectedCell();
				if (cell != null) {
					y = Math.max(y, cell.y);
				}
			}
			return y;
		}

		/** セルの揃えをリセットする */
		private resetCellY() {
			this.$container.find('.cell').css('margin-top', 5);
		}

		/** 指定したセルを揃える */
		private alignCellY(y: number) {
			for (let notebook of this.notebooks) {
				let cell = notebook.selectedCell();
				if (cell != null) {
					cell.y = y;
				}
			}
		}

		/** セルを揃える */
		private alignSelected(): void {
			this.resetCellY();
			this.alignCellY(this.maxCellY());
		}

		/** スクロール位置を調節 */
		private moveScrollY(deltaScrollY: number): void {
			window.scroll(window.scrollX, window.screenY + deltaScrollY);
		}

		/** idからセルを検索する */
		private cellById(id: string): Cell | null {
			for (let notebook of this.notebooks) {
				for (let cell of notebook.cellList) {
					if (cell.id == id) {
						return cell;
					}
				}
			}
			return null;
		}

		/** memeを指定してマークする */
		private markByMeme(meme: string): void {
			for (let notebook of this.notebooks) {
				notebook.markByMeme(meme);
			}
		}

		/** セルを選択する */
		private select(cell: Cell): void {
			for (let notebook of this.notebooks) {
				notebook.unselectAll();
				notebook.unmarkAll();
			}

			cell.select(true);
			cell.mark(true);
			for (const relatedCell of this.getRelatedCellsById(cell.id)) {
				relatedCell.select(true);
				relatedCell.mark(true);
			}
		}

		/** 描画を行う */
		private render(): void {
			// HTMLを生成する
			let $wrapper = $('<div class="wrapper"></div>');
			this.$container.empty();
			this.$container.append($wrapper);
			for (let i = 0; i < this.notebooks.length; i++) {
				$wrapper.append(this.notebooks[i].$view);
				if (i != this.notebooks.length - 1) {
					$wrapper.append(this.relations[i].$view);
				}
			}
			this.$container.append('<div class="dark"></div>');
			this.$container.append(this.$mergeView);

			// イベントを設定する
			this.$container.on('click', '.open-button', (e) => {
				$(e.target).parent().parent().removeClass('closed');
				this.resetCellY();
				this.updateRelations();
				return false;
			});
			this.$container.on('click', '.close-button', (e) => {
				$(e.target).parent().parent().addClass('closed');
				this.resetCellY();
				this.updateRelations();
				return false;
			});
			this.$container.on('click', '.select-button', (e) => {
				let $cell = $(e.target).parent().parent();
				let cell = this.cellById($cell.attr('data-id'));
				if (cell != null) {
					this.select(cell);
					this.alignSelected();
				}
				return false;
			});
			this.$container.on('click', '.cell', (e) => {
				this.showMergeView($(e.currentTarget).attr('data-id'));
			});
			this.$container.on('mouseenter', '.cell', (e) => {
				this.highlightCell($(e.currentTarget).attr('data-id'));
			});
			this.$container.on('mouseleave', '.cell', (e) => {
				this.highlightCell(null);
			});
			this.$container.on('click', '.dark', (e) => {
				this.hideMergeView();
			});
			if (this.notebooks.length == 2) {
				this.notebooks[0].updateStyle([], [this.notebooks[1]]);
				this.notebooks[1].updateStyle([this.notebooks[0]], []);
			} else {
				this.notebooks[0].updateStyle([], this.notebooks.slice(1));
				this.notebooks[1].updateStyle([this.notebooks[0]], [this.notebooks[2]]);
				this.notebooks[2].updateStyle(this.notebooks.slice(0, 2), []);
			}

			setInterval(() => {
				this.updateRelations();
			});
		}

		/** 指定したCellに関連するCellを関連度順にすべて取得する */
		private getRelatedCellsById(cellId: string): Cell[] {
			const queue: string[] = [cellId];
			const related: { [key: string]: Cell } = {};
			while (queue.length) {
				const current = queue.shift() as string;
				for (const relation of this.relations) {
					for (const cell of relation.relatedCells[current] || []) {
						if (!related[cell.id]) {
							related[cell.id] = cell;
							queue.push(cell.id);
						}
					}
				}
			}
			return Object.keys(related).map(id => related[id]);
		}
	}
}