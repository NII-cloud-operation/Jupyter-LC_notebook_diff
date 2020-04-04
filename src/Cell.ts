namespace JupyterNotebook {
	export class Cell {
		/** セルの種類 */
		cellType: string;

		/** メタデータ */
		metaData: any;

		/** ソースコード */
		source: string[];

		/** ノートブック */
		notebook: Notebook;

		/** 描画されたJQueryノード */
		$view: JQuery;

		/** ID */
		id: string;

		/** 選択中か？ */
		selected: boolean;

		/** マーク済みか */
		marked: boolean;

		/** IDのカウンタ */
		static idCounter: number = 0;

		/**
		 * 初期化
		 */
		constructor(notebook: Notebook, data: any) {
			this.notebook = notebook;
			this.cellType = data["cell_type"];
			this.metaData = data["metadata"];
			this.source = data["source"];
			this.id = (Cell.idCounter++).toString();
			this.selected = false;
			this.marked = false;
			this.$view = $(this.html());
		}

		/**
		 * HTMLを生成する
		 */
		private html(): string {
			let html = '';
			html += '<div class="cell closed" data-role="cell" data-meme="' + this.meme;
			html += '" data-id="' + this.id + '">';
			html += '<div class="meme">';
			html += '<span class="open-button">+</span><span class="close-button">-</span>';
			html += '<span class="select-button">&nbsp;</span>';
			if (this.hasMeme) {
				let memeTokens = this.meme.split('-');
				html += '<b>' + memeTokens.shift() + '</b>-' + memeTokens.join('-');
			}
			html += '</div>';
			html += '<div class="source">' + this.sourceEscaped + '</div>';
			html += '</div>';
			return html;
		}

		/**
		 * スタイルを更新する
		 * 関連するCellと異なるソースであれば色を変える
		 */
		updateStyle(leftCellsList: Cell[][]): void {
			if (!this.hasMeme || !leftCellsList.length) {
				this.$view.removeClass("changed1");
				this.$view.removeClass("changed2");
			} else if (leftCellsList.length == 1) {
				if (this.checkChanged([this], leftCellsList[0])) {
					this.$view.addClass("changed1");
					this.$view.removeClass("changed2");
				} else {
					this.$view.removeClass("changed1");
					this.$view.removeClass("changed2");
				}
			} else {
				let ch0 = this.checkChanged([this], leftCellsList[0]);
				let ch1 = this.checkChanged([this], leftCellsList[1]);
				let ch01 = this.checkChanged(leftCellsList[0], leftCellsList[1]);
				if (ch01) {
					if (!ch0) {
						this.$view.removeClass("changed1");
						this.$view.removeClass("changed2");
					} else if (!ch1) {
						this.$view.addClass("changed1");
						this.$view.removeClass("changed2");
					} else {
						this.$view.removeClass("changed1");
						this.$view.addClass("changed2");
					}
				} else {
					if (ch0 || ch1) {
						this.$view.addClass("changed1");
						this.$view.removeClass("changed2");
					} else {
						this.$view.removeClass("changed1");
						this.$view.removeClass("changed2");
					}
				}
			}
		}

		get hasMeme(): boolean {
			if (this.metaData["lc_cell_meme"] === undefined) {
				return false;
			}
			return this.metaData["lc_cell_meme"]["current"] !== undefined;
		}

		/** このmemeを取得する */
		get meme(): string {
			return this.metaData["lc_cell_meme"]["current"];
		}

		/** このmemeのUUIDを取得する */
		get memeUuid(): string {
			return this.meme ? this.meme.split('-').slice(0, 5).join('-') : '';
		}

		/** このmemeの枝番数を取得する */
		get memeBranchNumber(): number {
			const meme = this.meme || '';
			const numStr = meme.split('-').slice(5, 6).pop() || '';
			return numStr ? parseInt(numStr, 10) : 0;
		}

		/** 次のmemeを取得する */
		get nextMeme(): string {
			return this.metaData["lc_cell_meme"]["next"];
		}

		/** 前のmemeを取得する */
		get prevMeme(): string {
			return this.metaData["lc_cell_meme"]["previous"];
		}

		/** ソースを結合して取得する */
		get sourceEscaped(): string {
			let html = '';
			for (let i = 0; i < this.source.length; i++) {
				html += this.source[i] + '<br>';
			}
			return html;
		}

		/** ソースを結合して取得する */
		get sourceAll(): string {
			return this.source.join('');
		}

		/** x座標を取得する */
		get x(): number {
			return this.$view.offset().left;
		}

		/** y座標を取得する */
		get y(): number {
			return this.$view.offset().top;
		}

		/** y座標を設定する */
		set y(y: number) {
			this.$view.css('margin-top', y - this.y + 5);
		}

		/** y座標をリセットする */
		resetY() {
			this.$view.css('margin-top', 5);
		}

		/** 幅を取得する */
		get width(): number {
			return this.$view.width();
		}

		/** 高さを取得する */
		get height(): number {
			return this.$view.height();
		}

		/** 選択を行う */
		public select(selected: boolean): void {
			if (this.selected != selected) {
				this.selected = selected;
				let $selectButton = this.$view.find('.select-button');
				$selectButton.empty();
				if (this.selected) {
					$selectButton.prepend('&#x2714;');
				} else {
					$selectButton.prepend('&nbsp;');
				}
			}
		}

		/** マークする */
		public mark(marked: boolean): void {
			if (this.marked != marked) {
				this.marked = marked;
				let $selectButton = this.$view.find('.select-button');
				if (this.marked) {
					$selectButton.addClass('marked');
				} else {
					$selectButton.removeClass('marked');
				}
			}
		}

		private checkChanged(bases: Cell[], cells: Cell[]): boolean {
			for (let base of bases) {
				for (let target of cells) {
					if (target.source.join("\n") != base.source.join("\n")) {
						return true;
					}
				}
			}
			return false;
		}
	}
}
