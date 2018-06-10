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

		/** 初期化 */
		constructor(rootSelector: string, codeMirror: any, filenames: string[],
			          filecontents: string[]) {
			this.rootSelector = rootSelector;
			this.codeMirror = codeMirror;
			this.$container = $(this.rootSelector);
			this.$mergeView = $('<div class="merge-view"></div>');
			this.loadingFilenames = filenames;
			this.loadingFilecontents = filecontents;
			this.notebooks = [];
			this.relations = [];
			this.loadNext();
		}

		/** 次のNotebookをロードする */
		private loadNext(): void {
			if (this.loadingFilenames.length == 0) {
				// 描画
				this.render();
			} else {
				// ロード
				let filename = this.loadingFilenames.shift() as string;
				if (this.loadingFilecontents.length == 0) {
					$.getJSON(filename, data => {
					        this.notebooks.push(new Notebook(filename, data));
									if (this.notebooks.length >= 2) {
										let i = this.notebooks.length - 2;
										this.relations.push(new Relation(this.notebooks[i],
											                               this.notebooks[i + 1]));
									}
									this.loadNext();
					});
				} else {
					var data = this.loadingFilecontents.shift() as string;
					this.notebooks.push(new Notebook(filename, data));
					if (this.notebooks.length >= 2) {
						let i = this.notebooks.length - 2;
						this.relations.push(new Relation(this.notebooks[i],
							                               this.notebooks[i + 1]));
					}
					this.loadNext();
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
		private highlightCell(meme: string | null): void {
			this.$container.find('.cell').removeClass('highlight');
			if (meme != null) {
				this.$container.find('.cell[data-meme="' + meme + '"]').addClass('highlight');
			}
		}

		/** リレーションを更新する */
		private updateRelations(): void {
			for (let relation of this.relations) {
				relation.update();
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
		private showMergeView(meme: string): void {
			let mergeViewElem = this.$mergeView[0];
			let notebooks: Array<Notebook | null> = [];
			if (this.notebooks.length == 2) {
				notebooks = [null, this.notebooks[0], this.notebooks[1]];
			} else {
				notebooks = this.notebooks;
			}
			let options = {
				value: this.getSourceByMeme(meme, notebooks[1]),
				origLeft: this.getSourceByMeme(meme, notebooks[0]),
				origRight: this.getSourceByMeme(meme, notebooks[2]),
				lineNumbers: true,
				mode: "text/html",
				highlightDifferences: true,
				collapseIdentical: false,
				readOnly: true
			};
			this.$mergeView.show();
			this.$container.find('.dark').show();
			this.codeMirror.MergeView(mergeViewElem, options);
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
			// 選択中以外のノートブックに対する処理
			for (let notebook of this.notebooks) {
				if (notebook != cell.notebook) {
					if (cell.meme != notebook.selectedMeme()) {
						notebook.unselectAll();
						notebook.selectByMeme(cell.meme);
					}
				}
			}

			// 選択中のノートブックに対する処理
			cell.notebook.unselectAll();
			cell.select(true);

			// マーク
			this.markByMeme(cell.meme);
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
				let meme = $(e.currentTarget).attr('data-meme');
				this.showMergeView(meme);
			});
			this.$container.on('mouseenter', '.cell', (e) => {
				this.highlightCell($(e.currentTarget).attr('data-meme'));
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
	}
}
