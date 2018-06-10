namespace JupyterNotebook {
	export class Notebook {
		/** ファイル名 */
		filename: string;

		/** meme */
		meme: string;

		/** セル */
		cellList: Cell[];

		/** memeからセルへの連想配列 */
		cellMap: { [key: string]: Cell[]; };

		/** JQueryノード */
		$view: JQuery;

		/** 初期化する */
		constructor(filename: string, data: any) {
			// ファイル名
			this.filename = filename;

			// Cellの配列を初期化
			this.cellList = [];
			for (let i = 0; i < data["cells"].length; i++) {
				this.cellList.push(new Cell(this, data["cells"][i]));
			}

			// memeからセルへの連想配列を初期化
			this.cellMap = {};
			for (let i = 0; i < this.cellList.length; i++) {
				let meme = this.cellList[i].meme;
				if (this.cellMap[meme] == undefined) {
					this.cellMap[meme] = [];
				}
				this.cellMap[meme].push(this.cellList[i]);
			}

			// 現在のmeme
			this.meme = data["metadata"]["lc_notebook_meme"]["current"];

			// 描画
			this.$view = $(this.html());
			for (let i = 0; i < this.cellList.length; i++) {
				this.$view.append(this.cellList[i].$view);
			}
		}

		/** HTMLを生成する */
		private html(): string {
			let html = '';
			html += '<div class="notebook" data-role="notebook" data-meme="' + this.meme + '">';
			html += '<div class="title">' + this.filename + '</div>';
			html += '</div>';
			return html;
		}

		updateStyle(left: Notebook[], right: Notebook[]): void {
			for (let cell of this.cellList) {
				cell.updateStyle(left, right);
			}
		}

		/** memeを指定してセルを取得する */
		getCellsByMeme(meme: string): Cell[] {
			let cells = this.cellMap[meme];
			return cells == undefined ? [] : cells;
		}

		/** memeを指定してセルを取得する */
		getCellByMeme(meme: string): Cell | null {
			return this.getCellsByMeme(meme)[0];
		}

		/** セルを取得する */
		getCellAt(index: number): Cell {
			return this.cellList[index];
		}

		/** セルを非選択にする */
		unselectAll(): void {
			for (let cell of this.cellList) {
				cell.select(false);
			}
		}

		/** 選択中のセルのmemeを取得する */
		selectedMeme(): string | null {
			let cell = this.selectedCell();
			return cell == null ? null : cell.meme;
		}

		/** memeを指定して最初のcellを選択する */
		selectByMeme(meme: string): void {
			let cell = this.getCellByMeme(meme);
			if (cell != null) {
				cell.select(true);
			}
		}

		/** 選択中のセルを取得する */
		selectedCell(): Cell | null {
			for (let cell of this.cellList) {
				if (cell.selected) {
					return cell;
				}
			}
			return null;
		}

		/** memeを指定してマークする */
		markByMeme(meme: string): void {
			for (let cell of this.cellList) {
				cell.mark(cell.meme == meme);
			}
		}

		/** セルの数を取得する */
		get count(): number {
			return this.cellList.length;
		}
	}
}
