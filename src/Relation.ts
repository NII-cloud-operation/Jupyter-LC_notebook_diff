namespace JupyterNotebook {
	export class Relation {
		/** ノートブック(左) */
		notebookLeft: Notebook;

		/** ノートブック(右) */
		notebookRight: Notebook;

		/** JQueryノード */
		$view: JQuery;

		/** Cell IDから隣の関連するCellリストへの連想配列 */
		relatedCells: { [key: string]: Cell[] };

		/** 初期化 */
		constructor(notebookLeft: Notebook, notebookRight: Notebook) {
			this.notebookLeft = notebookLeft;
			this.notebookRight = notebookRight;
			this.$view = $('<div class="relation"></div>');
			this.relatedCells = {};
		}

		/** リレーション構造を更新する */
		updateRelation(): void {
			this.relatedCells = {};
			const usedRightCells: { [key: string]: boolean } = {};

			for (const cellLeft of this.notebookLeft.cellList) {
				this.relatedCells[cellLeft.id] = [];
			}
			for (const cellRight of this.notebookRight.cellList) {
				this.relatedCells[cellRight.id] = [];
			}

			for (const cellLeft of this.notebookLeft.cellList) {
				const cellRightList = this.notebookRight.getCellsByMeme(cellLeft.meme)
					.filter(cell => !usedRightCells[cell.id]);
				for (const cellRight of cellRightList) {
					this.relatedCells[cellLeft.id].push(cellRight);
					this.relatedCells[cellRight.id].push(cellLeft);
					usedRightCells[cellRight.id] = true;
				}
			}

			for (const cellLeft of this.notebookLeft.cellList.filter(cell => !this.relatedCells[cell.id].length)) {
				const cellRightList = this.notebookRight.cellList
					.filter(cell => !usedRightCells[cell.id])
					.filter(cell => cellLeft.memeUuid === cell.memeUuid)
					.filter(cell => cellLeft.memeBranchNumber < cell.memeBranchNumber);
				for (const cellRight of cellRightList) {
					this.relatedCells[cellLeft.id].push(cellRight);
					this.relatedCells[cellRight.id].push(cellLeft);
					usedRightCells[cellRight.id] = true;
				}
			}
		}

		/** 描画を更新する */
		updateView(): void {
			this.$view.html(this.html());
		}

		/** HTMLを生成する */
		private html(): string {
			let html = '';
			let offsetY = -this.$view.offset().top + 14;
			let height = Math.max(this.notebookLeft.$view.height(), this.notebookRight.$view.height());
			html += '<div class="relation" style="height: ' + height + 'px">';
			html += '<svg width="50" height="' + height + '">';
			for (const cellLeft of this.notebookLeft.cellList) {
				for (const cellRight of this.relatedCells[cellLeft.id]) {
					let y0 = cellLeft.y + offsetY;
					let y1 = cellRight.y + offsetY;
					html += '<path d="M 0,' + y0 + ' C 25,' + y0 + ' 25,' + y1 + ' 50,' + y1;
					html += '" fill="none" stroke="#eee" style="stroke-width:1.5px;" />';
				}
			}
			html += '</svg>';
			html += '</div>';
			return html;
		}
	}
}
