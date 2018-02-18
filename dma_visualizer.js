function tDmaVisualizer(eCanvas, Dma) {
	this.eCanvas = eCanvas;
	this.nPixelSize = 3;
	this.nDmaSpacing = 1;
	this.Dma = Dma;

	this.Ctx = eCanvas.getContext('2d');

	eCanvas.visualizer = this;
	eCanvas.BeginPos = {nX: 0, nY: 0};
	eCanvas.nScale = 1.0;
	this.resize(640, 256);

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
		for (var nX = 0; nX < this.Dma.nCyclesInRow; ++nX) {
			var nOffsetX = this.eCanvas.BeginPos.nX + this.nDmaSpacing + (this.nDmaSpacing + nDmaSize) * nX;
			if(nOffsetX + (2 * this.nDmaSpacing + nDmaSize) < 0) {
				continue;
			}
			if(nOffsetX > this.eCanvas.width) {
				break;
			}
			var Cycle = this.Dma.pSlots[nX][nY];
			var nR = 255, nG = 255, nB = 255, nA;
			if(Cycle.isFree) {
				nA = 1.0;
			}
			else {
				nA = .5;
			}

			// if(Cycle.isAbleBitplane) {
			// 	// Bitplane DMA
			// 	nB = 255;
			// }
			// if(Cycle.isAbleCopperWait){
			// 	nG = 136;
			// }
			// nR = 255;
			this.Ctx.fillStyle = `rgba(${nR}, ${nG}, ${nB}, ${nA})`;
			// console.log(this.Ctx.fillStyle);
			this.Ctx.fillRect(nOffsetX, nOffsetY, nDmaSize, this.nPixelSize);
		}
	}
	this.isDrawing = false;
}

tDmaVisualizer.prototype.resize = function(nWidth, nHeight) {
	this.eCanvas.width = nWidth;
	this.eCanvas.height = nHeight;
}
