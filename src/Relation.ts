namespace JupyterNotebook {
	export class Relation {
		/** ノートブック(左) */
		notebookLeft: Notebook;

		/** ノートブック(右) */
		notebookRight: Notebook;

		/** JQueryノード */
		$view: JQuery;

		/** 初期化 */
		constructor(notebookLeft: Notebook, notebookRight: Notebook) {
			this.notebookLeft = notebookLeft;
			this.notebookRight = notebookRight;
			this.$view = $('<div class="relation"></div>');
		}

		/** 描画を更新する */
		update(): void {
			this.$view.html(this.html());
		}

		/** HTMLを生成する */
		private html(): string {
			let html = '';
			let offsetY = -this.$view.offset().top + 14;
			let height = Math.max(this.notebookLeft.$view.height(), this.notebookRight.$view.height());
			html += '<div class="relation" style="height: ' + height + 'px">';
			html += '<svg width="50" height="' + height + '">';
			for (let i = 0; i < this.notebookLeft.count; i++) {
				let cellLeft = this.notebookLeft.getCellAt(i);
				let cellRightList = this.notebookRight.getCellsByMeme(cellLeft.meme);
				for (let j = 0;j < cellRightList.length;j ++) {
					let cellRight = cellRightList[j];
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
