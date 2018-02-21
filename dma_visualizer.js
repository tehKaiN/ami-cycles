function tDmaVisualizer(eCanvas, Dma) {
	this.Tooltip = new tTooltip();
	this.eCanvas = eCanvas;
	this.nPixelSize = 3;
	this.nDmaSpacing = 1;
	this.Dma = Dma;

	this.eOverlay = document.createElement('div');
	document.body.appendChild(this.eOverlay);
	this.eOverlay.style.position = 'absolute';
	this.eOverlay.style.top = this.eCanvas.offsetTop;
	this.eOverlay.style.left = this.eCanvas.offsetLeft;
	this.eOverlay.style.zIndex = 999;

	this.Ctx = eCanvas.getContext('2d');

	this.eCanvas.visualizer = this;
	this.eOverlay.visualizer = this;
	this.eOverlay.BeginPos = {nX: 0, nY: 0};
	this.eOverlay.nScale = 1.0;
	this.resize(640, 256);

	this.Tooltip.setBody('<b>Dupa</b>');

	this.eOverlay.onmouseup = this.eOverlay.onmouseout = function(Evt) {
		this.visualizer.setDragging(false);
		this.visualizer.Tooltip.hide();
	}

	this.eOverlay.onmousedown = function(Evt) {
		this.visualizer.setDragging(true);
		this.visualizer.Tooltip.hide();
		this.DragStart = {
			nX: Evt.offsetX, nY: Evt.offsetY
		};
	}

	this.eOverlay.onmousemove = function(Evt) {
		if(this.visualizer.isDragged) {
			this.BeginPos.nX += Evt.offsetX - this.DragStart.nX;
			this.BeginPos.nY += Evt.offsetY - this.DragStart.nY;

			this.DragStart.nX = Evt.offsetX;
			this.DragStart.nY = Evt.offsetY;
		}
		else {
			var nX = Evt.offsetX;
			var nY = Evt.offsetY;
			var CyclePos = this.visualizer.getCycleXyFromScreenPos({nX: nX, nY: nY});
			CyclePos = {nX: Math.floor(CyclePos.nX), nY: Math.floor(CyclePos.nY)};
			if(CyclePos.nX >= 0 && CyclePos.nY >= 0) {
				var CycleScreenPos = this.visualizer.getScreenPosFromCycleXy(CyclePos);
				var nDmaSize = this.visualizer.nPixelSize*2;
				nX = CycleScreenPos.nX  + Math.round(nDmaSize/2);
				nY = CycleScreenPos.nY;
				var sWhere;
				if(nY < 100) {
					sWhere = 'bottom';
				}
				else {
					sWhere = 'top';
					nY -= this.visualizer.nPixelSize + this.visualizer.nDmaSpacing;
				}
				var Cycle = this.visualizer.Dma.getCycleAt(CyclePos);
				var toHex = function(nVal, nDigitCnt) {
					if(void 0 == nDigitCnt) {
						return (nVal).toString(16).toUpperCase();
					}
					else {
						return ('00000000' + (nVal).toString(16).toUpperCase()).substr(-nDigitCnt);
					}
				}
				var sTooltipText = `Cycle: ${toHex(CyclePos.nX)},${toHex(CyclePos.nY)}`;
				if(!Cycle.isFree) {
					sTooltipText += `<br>${Cycle.sDescription}`;
				}
				else {
					var NextNonFree = this.visualizer.Dma.findNextFreeCycle(
						{nX: CyclePos.nX + 1, nY: CyclePos.nY}, false
					);
					if(NextNonFree != false) {
						var nFreeSpace = this.visualizer.Dma.getCyclesBetweenPositions(
							CyclePos, NextNonFree
						);
						sTooltipText += `<br>${nFreeSpace} free until filled`;
					}
				}

				this.visualizer.Tooltip.setBody(sTooltipText).showAt(
					{nX: nX, nY: nY + this.visualizer.nPixelSize}, sWhere
				);
			}
			else {
				this.visualizer.Tooltip.hide();
			}
		}
	}

	this.eOverlay.onwheel = function(Evt) {
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

tDmaVisualizer.prototype.setDragging = function(isDragged) {
	this.isDragged = isDragged;
	if(isDragged) {
		this.eOverlay.setAttribute('class', 'dragging');
	}
	else {
		this.eOverlay.setAttribute('class', '');
	}
}

tDmaVisualizer.prototype.getCycleXyFromScreenPos = function(Pos) {
	return this.getCycleXyFromAbsPos({
		nX: Pos.nX - this.eOverlay.BeginPos.nX,
		nY: Pos.nY - this.eOverlay.BeginPos.nY
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

tDmaVisualizer.prototype.getScreenPosFromCycleXy = function(CyclePos) {
	var AbsPos =  this.getAbsPosFromCycleXy(CyclePos);
	return {
		nX: AbsPos.nX + this.eOverlay.BeginPos.nX,
		nY: AbsPos.nY + this.eOverlay.BeginPos.nY
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
		var nOffsetY = this.eOverlay.BeginPos.nY + this.nDmaSpacing + (this.nDmaSpacing + this.nPixelSize) * nY;
		if(nOffsetY + (2 * this.nDmaSpacing + this.nPixelSize) < 0) {
			continue;
		}
		if(nOffsetY > this.eCanvas.height) {
			break;
		}
		for (var nX = 0; nX < this.Dma.nCyclesInRow; ++nX) {
			var nOffsetX = this.eOverlay.BeginPos.nX + this.nDmaSpacing + (this.nDmaSpacing + nDmaSize) * nX;
			if(nOffsetX + (2 * this.nDmaSpacing + nDmaSize) < 0) {
				continue;
			}
			if(nOffsetX > this.eCanvas.width) {
				break;
			}
			var Cycle = this.Dma.getCycleAt({nX: nX, nY: nY});
			var nR = 128, nG = 128, nB = 128, nA;
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

/**
 * Resizes DMA visualization to given dimensions.
 * @param {!number} nWidth Width.
 * @param {!number} nHeight Height.
 */
tDmaVisualizer.prototype.resize = function(nWidth, nHeight) {
	this.eCanvas.width = nWidth;
	this.eCanvas.height = nHeight;
	this.eOverlay.style.width = nWidth+'px';
	this.eOverlay.style.height = nHeight+'px';
}
