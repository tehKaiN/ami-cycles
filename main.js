function cycle(isAbleBitplane, isAbleCopperWait, isAbleCopperSet) {
	this.isAbleBitplane = isAbleBitplane;
	this.isAbleCopperWait = isAbleCopperWait;
	this.isAbleCopperSet = isAbleCopperSet;
}

function dma(bpp) {
	// DMA may span across many frames, but let's ignore it for now
	// There are 0xE4 cycles on row, and AFAIR 312 cycle rows.
	var ddfstrt = {x: 0x38, y: 0x2C}; // display datafetch start - custom reg
	var ddfstop = {x: 0xD0, y: 0x2C + 256}; // display datafetch stop
	this.cyclesInRow = 0xE4;
	this.cycleRows = 312;
	this.slots = [];
	this.bpp = bpp;

	// Lores bitplane fetch scheme - 0 is free, first bitplane is 1
	var bplFetchSchemes = [0, 4, 6, 2, 0, 3, 5, 1]; // 6bpp

	for (var c = 0; c < this.cyclesInRow; ++c) {
		this.slots[c] = [];
		for (var r = 0; r < this.cycleRows; ++r) {
			// Determine for what given cycle may be used
			var f = bplFetchSchemes[c % 8];
			var isAbleBitplane = (c > ddfstrt.x) &&
				(c < ddfstop.x + bplFetchSchemes.length) &&
				(r > ddfstrt.y) && (r < ddfstop.y) &&
				f && (f <= bpp);
			var isAbleCopperWait = !(c & 1);
			var isAbleCopperSet = isAbleCopperWait && !isAbleBitplane;
			this.slots[c][r] = new cycle(
				isAbleBitplane, isAbleCopperWait, isAbleCopperSet
			);
		}
	}
}

function dmaVisualizer(canvas, dma) {
	this.canvas = canvas;
	this.pixelSize = 3;
	this.dmaSpacing = 2;
	this.dma = dma;

	var dmaWidth = 2 * this.pixelSize;
	canvas.width = this.dmaSpacing
		+ this.dma.cyclesInRow * (this.dmaSpacing + dmaWidth);
	canvas.height = this.dmaSpacing
		+ this.dma.cycleRows * (this.dmaSpacing + this.pixelSize);
	this.ctx = canvas.getContext('2d');
}

dmaVisualizer.prototype.generateGrid = function () {
	var dmaSize = this.pixelSize * 2;

	// BG
	this.ctx.fillStyle = '#000';
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	// Draw cycle grid
	for (var y = 0; y < this.dma.cycleRows; ++y) {
		for (var x = 0; x < this.dma.cyclesInRow; ++x) {
			if(this.dma.slots[x][y].isAbleBitplane) {
				// Bitplane DMA
				this.ctx.fillStyle = '#00F';
			}
			else if(this.dma.slots[x][y].isAbleCopperSet){
				this.ctx.fillStyle = '#F80';
			}
			else {
				this.ctx.fillStyle = '#FFF';
			}
			this.ctx.fillRect(
				this.dmaSpacing + (this.dmaSpacing + dmaSize) * x,
				this.dmaSpacing + (this.dmaSpacing + this.pixelSize) * y,
				dmaSize, this.pixelSize
			);
		}
	}
}

function main() {
	var bpp = 3;

	var canvas = document.querySelector('#dmaVisualizer');
	var cDma = new dma(bpp);
	var cDmaVisualizer = new dmaVisualizer(canvas, cDma);
	cDmaVisualizer.generateGrid();
}

window.addEventListener('load', main);
