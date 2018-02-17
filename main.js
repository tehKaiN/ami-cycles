function tCycle(isAbleBitplane, isAbleCopperWait) {
	this.isAbleBitplane = isAbleBitplane;
	this.isAbleCopperWait = isAbleCopperWait;
}

function tDma(nBpp) {
	// DMA may span across many frames, but let's ignore it for now
	// There are 0xE4 cycles on row, and AFAIR 312 cycle rows.
	var ddfstrt = {nX: 0x38, nY: 0x2C}; // display datafetch start - custom reg
	var ddfstop = {nX: 0xD0, nY: 0x2C + 256}; // display datafetch stop
	this.cyclesInRow = 0xE4;
	this.nCycleRows = 312;
	this.pSlots = [];
	this.nBpp = nBpp;

	// Lores bitplane fetch scheme - 0 is free, first bitplane is 1
	var bplFetchSchemes = [0, 4, 6, 2, 0, 3, 5, 1]; // 6bpp

	for (var c = 0; c < this.cyclesInRow; ++c) {
		this.pSlots[c] = [];
		for (var r = 0; r < this.nCycleRows; ++r) {
			// Determine for what given cycle may be used
			var f = bplFetchSchemes[c % 8];
			var isAbleBitplane = (c > ddfstrt.nX) &&
				(c < ddfstop.nX + bplFetchSchemes.length) &&
				(r > ddfstrt.nY) && (r < ddfstop.nY) &&
				f && (f <= nBpp);
			var isAbleCopperWait = !(c & 1);
			this.pSlots[c][r] = new tCycle(isAbleBitplane, isAbleCopperWait);
		}
	}
}

function tDmaVisualizer(eCanvas, Dma) {
	this.eCanvas = eCanvas;
	this.nPixelSize = 3;
	this.nDmaSpacing = 1;
	this.Dma = Dma;

	this.Ctx = eCanvas.getContext('2d');

	eCanvas.visualizer = this;
	eCanvas.BeginPos = {nX: 0, nY: 0};
	eCanvas.nScale = 1.0;
	eCanvas.width = 640;
	eCanvas.height = 256;

	eCanvas.onmouseup = eCanvas.onmouseout = function(Evt) {
		this.isDragged = false;
	}

	eCanvas.onmousedown = function(Evt) {
		this.isDragged = true;
		this.DragStart = {
			nX: Evt.offsetX, nY: Evt.offsetY
		};
	}

	eCanvas.onmousemove = function(Evt) {
		if(this.isDragged) {
			this.BeginPos.nX += Evt.offsetX - this.DragStart.nX;
			this.BeginPos.nY += Evt.offsetY - this.DragStart.nY;

			this.DragStart.nX = Evt.offsetX;
			this.DragStart.nY = Evt.offsetY;
		}
	}

	eCanvas.onwheel = function(Evt) {
		// Get new scale
		var clamp = function(nX, bottom, top) {return Math.min(Math.max(nX, bottom), top);};
		this.nScale = clamp(this.nScale - Math.sign(Evt.deltaY), 1, 20);

		// Get currently hovered cycle
		var mousePos = {nX: Evt.offsetX, nY: Evt.offsetY};
		var Cycle = this.visualizer.getCycleXyFromScreenPos(mousePos);

		// Scale view
		this.visualizer.nPixelSize = this.nScale;

		// Adjust scroll offsets so that hover will be on same cycle
		var AbsPos = this.visualizer.getAbsPosFromCycleXy(Cycle);
		this.BeginPos.nX = Math.round(mousePos.nX - AbsPos.nX);
		this.BeginPos.nY = Math.round(mousePos.nY - AbsPos.nY);

		return false;
	}
}

tDmaVisualizer.prototype.getCycleXyFromScreenPos = function(Pos) {
	return this.getCycleXyFromAbsPos({
		nX: Pos.nX - this.eCanvas.BeginPos.nX,
		nY: Pos.nY - this.eCanvas.BeginPos.nY
	});
}
tDmaVisualizer.prototype.getCycleXyFromAbsPos = function(Pos) {
	var nDmaSize = this.nPixelSize * 2;
	return {
		nX: (Pos.nX - this.nDmaSpacing) / (this.nDmaSpacing + nDmaSize),
		nY: (Pos.nY - this.nDmaSpacing) / (this.nDmaSpacing + this.nPixelSize)
	};
}

tDmaVisualizer.prototype.getAbsPosFromCycleXy = function(CyclePos) {
	var nDmaSize = this.nPixelSize * 2;
	return {
		nX: this.nDmaSpacing + (this.nDmaSpacing + nDmaSize) * CyclePos.nX,
		nY: this.nDmaSpacing + (this.nDmaSpacing + this.nPixelSize) * CyclePos.nY
	};
}

tDmaVisualizer.prototype.drawGrid = function () {
	if(this.isDrawing) {
		return;
	}
	var nDmaSize = this.nPixelSize * 2;
	this.isDrawing = true;

	// BG
	this.Ctx.fillStyle = '#000';
	this.Ctx.fillRect(0, 0, this.eCanvas.width, this.eCanvas.height);

	// Draw cycle grid
	for (var nY = 0; nY < this.Dma.nCycleRows; ++nY) {
		var nOffsetY = this.eCanvas.BeginPos.nY + this.nDmaSpacing + (this.nDmaSpacing + this.nPixelSize) * nY;
		if(nOffsetY + (2 * this.nDmaSpacing + this.nPixelSize) < 0) {
			continue;
		}
		if(nOffsetY > this.eCanvas.height) {
			break;
		}
		for (var nX = 0; nX < this.Dma.cyclesInRow; ++nX) {
			var nOffsetX = this.eCanvas.BeginPos.nX + this.nDmaSpacing + (this.nDmaSpacing + nDmaSize) * nX;
			if(nOffsetX + (2 * this.nDmaSpacing + nDmaSize) < 0) {
				continue;
			}
			if(nOffsetX > this.eCanvas.width) {
				break;
			}
			if(this.Dma.pSlots[nX][nY].isAbleBitplane) {
				// Bitplane DMA
				this.Ctx.fillStyle = '#00F';
			}
			else if(this.Dma.pSlots[nX][nY].isAbleCopperWait){
				this.Ctx.fillStyle = '#F80';
			}
			else {
				this.Ctx.fillStyle = '#FFF';
			}
			this.Ctx.fillRect(nOffsetX, nOffsetY, nDmaSize, this.nPixelSize);
		}
	}
	this.isDrawing = false;
}

/**
 * Prefixes:
 * tName - class
 * nName - number
 * sName - string
 * eName - element
 * isName - bool
 * pName - array
 * Name - other object
 */

window.addEventListener('load', function() {
	var nBpp = 3;

	var eCanvas = document.querySelector('#dmaVisualizer');
	var Dma = new tDma(nBpp);
	var DmaVisualizer = new tDmaVisualizer(eCanvas, Dma);
	setInterval(function() {DmaVisualizer.drawGrid()}, 1/30);
});
