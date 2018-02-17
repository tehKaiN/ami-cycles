function tCycle(isAbleBitplane, isAbleCopperWait, isAbleCopperSet) {
	this.isAbleBitplane = isAbleBitplane;
	this.isAbleCopperWait = isAbleCopperWait;
	this.isAbleCopperSet = isAbleCopperSet;
}

function tDma(bpp) {
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
			this.slots[c][r] = new tCycle(
				isAbleBitplane, isAbleCopperWait, isAbleCopperSet
			);
		}
	}
}

function tDmaVisualizer(canvas, dma) {
	this.canvas = canvas;
	this.pixelSize = 3;
	this.dmaSpacing = 1;
	this.dma = dma;

	var dmaWidth = 2 * this.pixelSize;
	this.canvasLimits = {
		w: this.dmaSpacing
			+ this.dma.cyclesInRow * (this.dmaSpacing + dmaWidth),
		h: this.dmaSpacing
			+ this.dma.cycleRows * (this.dmaSpacing + this.pixelSize)
	}
	this.ctx = canvas.getContext('2d');

	canvas.visualizer = this;
	canvas.beginPos = {x: 0, y: 0};
	canvas.scale = 1.0;
	canvas.width = 640;
	canvas.height = 256;

	canvas.onmouseup = canvas.onmouseout = function(e) {
		this.isDragged = false;
	}

	canvas.onmousedown = function(e) {
		this.isDragged = true;
		this.dragStart = {
			x: e.offsetX, y: e.offsetY
		};
	}

	canvas.onmousemove = function(e) {
		if(this.isDragged) {
			this.beginPos.x += e.offsetX - this.dragStart.x;
			this.beginPos.y += e.offsetY - this.dragStart.y;

			this.dragStart.x = e.offsetX;
			this.dragStart.y = e.offsetY;
		}
	}

	canvas.onwheel = function(e) {
		// Get new scale
		var clamp = function(x, bottom, top) {return Math.min(Math.max(x, bottom), top);};
		this.scale = clamp(this.scale - Math.sign(e.deltaY), 1, 20);

		// Get currently hovered cycle
		var mousePos = {x: e.offsetX, y: e.offsetY};
		var cycle = this.visualizer.getCycleXyFromScreenPos(mousePos);

		// Scale view
		this.visualizer.pixelSize = this.scale;

		// Adjust scroll offsets so that hover will be on same cycle
		var absPos = this.visualizer.getAbsPosFromCycleXy(cycle);
		this.beginPos.x = Math.round(mousePos.x - absPos.x);
		this.beginPos.y = Math.round(mousePos.y - absPos.y);

		return false;
	}
}

tDmaVisualizer.prototype.getCycleXyFromScreenPos = function(pos) {
	return this.getCycleXyFromAbsPos({
		x: pos.x - this.canvas.beginPos.x,
		y: pos.y - this.canvas.beginPos.y
	});
}
tDmaVisualizer.prototype.getCycleXyFromAbsPos = function(pos) {
	var dmaSize = this.pixelSize * 2;
	return {
		x: (pos.x - this.dmaSpacing) / (this.dmaSpacing + dmaSize),
		y: (pos.y - this.dmaSpacing) / (this.dmaSpacing + this.pixelSize)
	};
}

tDmaVisualizer.prototype.getAbsPosFromCycleXy = function(cycle) {
	var dmaSize = this.pixelSize * 2;
	return {
		x: this.dmaSpacing + (this.dmaSpacing + dmaSize) * cycle.x,
		y: this.dmaSpacing + (this.dmaSpacing + this.pixelSize) * cycle.y
	};
}

tDmaVisualizer.prototype.drawGrid = function () {
	if(this.isDrawing) {
		return;
	}
	var dmaSize = this.pixelSize * 2;
	this.isDrawing = true;

	// BG
	this.ctx.fillStyle = '#000';
	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

	// Draw cycle grid
	for (var y = 0; y < this.dma.cycleRows; ++y) {
		var offsetY = this.canvas.beginPos.y + this.dmaSpacing + (this.dmaSpacing + this.pixelSize) * y;
		if(offsetY + (2 * this.dmaSpacing + this.pixelSize) < 0) {
			continue;
		}
		if(offsetY > this.canvas.height) {
			break;
		}
		for (var x = 0; x < this.dma.cyclesInRow; ++x) {
			var offsetX = this.canvas.beginPos.x + this.dmaSpacing + (this.dmaSpacing + dmaSize) * x;
			if(offsetX + (2 * this.dmaSpacing + dmaSize) < 0) {
				continue;
			}
			if(offsetX > this.canvas.width) {
				break;
			}
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
			this.ctx.fillRect(offsetX, offsetY, dmaSize, this.pixelSize);
		}
	}
	this.isDrawing = false;
}

function main() {
	var bpp = 3;

	var canvas = document.querySelector('#dmaVisualizer');
	var dma = new tDma(bpp);
	var dmaVisualizer = new tDmaVisualizer(canvas, dma);
	setInterval(function() {dmaVisualizer.drawGrid()}, 1/30);
}

window.addEventListener('load', main);
