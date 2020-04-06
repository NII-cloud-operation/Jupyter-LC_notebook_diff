namespace JupyterNotebook {
	export enum RelationMatchType {
		Exact = 'exact',
		Fuzzy = 'fuzzy',
	}

	export class Relation {
		/** ノートブック(左) */
		notebookLeft: Notebook;

		/** ノートブック(右) */
		notebookRight: Notebook;

		/** JQueryノード */
		$view: JQuery;

		/** Cell IDから左側の関連するCellリストへの連想配列 */
		relatedLeftCells: { [key: string]: Cell[] };

		/** Cell IDから右側の関連するCellリストへの連想配列 */
		relatedRightCells: { [key: string]: Cell[] };

		/** Cell IDから隣の関連するCellリストを取得する */
		getRelatedCells(cellId: string): Cell[] {
			return (this.relatedLeftCells[cellId] || [])
				.concat(this.relatedRightCells[cellId] || []);
		}

		/** マッチタイプ */
		matchType: JupyterNotebook.RelationMatchType;

		/** 初期化 */
		constructor(notebookLeft: Notebook, notebookRight: Notebook,
					{matchType = RelationMatchType.Fuzzy}: {matchType?: RelationMatchType} = {}) {
			this.notebookLeft = notebookLeft;
			this.notebookRight = notebookRight;
			this.$view = $('<div class="relation"></div>');
			this.relatedLeftCells = {};
			this.relatedRightCells = {};
			this.matchType = matchType;
		}

		/** リレーション構造を更新する */
		updateRelation(): void {
			this.relatedLeftCells = {};
			this.relatedRightCells = {};

			for (const cellLeft of this.notebookLeft.cellList) {
				this.relatedRightCells[cellLeft.id] = [];
			}
			for (const cellRight of this.notebookRight.cellList) {
				this.relatedLeftCells[cellRight.id] = [];
			}

			if (this.matchType === RelationMatchType.Fuzzy) {
				const usedRightCells: { [key: string]: boolean } = {};
				for (const cellLeft of this.notebookLeft.cellList) {
					const cellRightList = this.notebookRight.getCellsByMeme(cellLeft.meme)
						.filter(cell => !usedRightCells[cell.id]);
					if (cellRightList.length) {
						const cellRight = cellRightList[0];
						this.relatedRightCells[cellLeft.id].push(cellRight);
						this.relatedLeftCells[cellRight.id].push(cellLeft);
						usedRightCells[cellRight.id] = true;
					}
				}

				for (const cellLeft of this.notebookLeft.cellList.filter(cell => !this.relatedRightCells[cell.id].length)) {
					const cellRightList = this.notebookRight.cellList
						.filter(cell => !usedRightCells[cell.id])
						.filter(cell => cellLeft.memeUuid === cell.memeUuid)
						.filter(cell => cellLeft.memeBranchNumber < cell.memeBranchNumber);
					if (cellRightList.length) {
						const cellRight = cellRightList[0];
						this.relatedRightCells[cellLeft.id].push(cellRight);
						this.relatedLeftCells[cellRight.id].push(cellLeft);
						usedRightCells[cellRight.id] = true;
					}
				}

				for (const cellLeft of this.notebookLeft.cellList.filter(cell => !this.relatedRightCells[cell.id].length)) {
					const cellRightList = this.notebookRight.cellList
						.filter(cell => !usedRightCells[cell.id])
						.filter(cell => cellLeft.memeUuid === cell.memeUuid);
					if (cellRightList.length) {
						const cellRight = cellRightList[0];
						this.relatedRightCells[cellLeft.id].push(cellRight);
						this.relatedLeftCells[cellRight.id].push(cellLeft);
						usedRightCells[cellRight.id] = true;
					}
				}
			} else if (this.matchType === RelationMatchType.Exact) {
				for (const cellLeft of this.notebookLeft.cellList) {
					const cellRightList = this.notebookRight.getCellsByMeme(cellLeft.meme);
					for (const cellRight of cellRightList) {
						this.relatedRightCells[cellLeft.id].push(cellRight);
						this.relatedLeftCells[cellRight.id].push(cellLeft);
					}
				}
			} else {
				throw new Error(`Invalid match type: ${this.matchType}`);
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
				for (const cellRight of this.relatedRightCells[cellLeft.id]) {
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
