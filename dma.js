function tCycle(isAbleBitplane, isAbleCopperWait) {
	this.isAbleBitplane = isAbleBitplane;
	this.isAbleCopperWait = isAbleCopperWait;
	this.isFree = true;
}

function tDma(nBpp) {
	// DMA may span across many frames, but let's ignore it for now
	// There are 0xE4 cycles on row, and AFAIR 312 cycle rows.
	var ddfstrt = {nX: 0x38, nY: 0x2C}; // display datafetch start - custom reg
	var ddfstop = {nX: 0xD0, nY: 0x2C + 256}; // display datafetch stop
	this.nCyclesInRow = 0xE4;
	this.nCycleRows = 312;
	this.pCycles = [];
	this.nBpp = nBpp;

	// Lores bitplane fetch scheme - 0 is free, first bitplane is 1
	var bplFetchSchemes = [0, 4, 6, 2, 0, 3, 5, 1]; // 6bpp

	for (var nCol = 0; nCol < this.nCyclesInRow; ++nCol) {
		this.pCycles[nCol] = [];
		for (var nRow = 0; nRow < this.nCycleRows; ++nRow) {
			// Determine for what given cycle may be used
			var f = bplFetchSchemes[nCol % 8];
			var isAbleBitplane = (nCol > ddfstrt.nX) &&
				(nCol < ddfstop.nX + bplFetchSchemes.length) &&
				(nRow > ddfstrt.nY) && (nRow < ddfstop.nY) &&
				f && (f <= nBpp);
			var isAbleCopperWait = !(nCol & 1);
			this.pCycles[nCol][nRow] = new tCycle(isAbleBitplane, isAbleCopperWait);
		}
	}
}

tDma.prototype.clear = function() {
	for (var nCol = 0; nCol < this.nCyclesInRow; ++nCol) {
		for (var nRow = 0; nRow < this.nCycleRows; ++nRow) {
			this.pCycles[nCol][nRow].isFree = true;
			this.pCycles[nCol][nRow].sDescription = '';
		}
	}
}

tDma.prototype.fillCycleAt = function(CyclePos, sDescription) {
	var Cycle = this.getCycleAt(CyclePos);
	if(!Cycle.isFree) {
		return false;
	}

	Cycle.isFree = false;
	Cycle.sDescription = sDescription;
	return true;
}

tDma.prototype.appendCycleAfter = function(CyclePos, sDescription) {
	for (var nRow = 0; nRow < this.nCycleRows; ++nRow) {
		for (var nCol = 0; nCol < this.nCyclesInRow; ++nCol) {
			if(nCol < CyclePos.nX || nRow < CyclePos.nY) {
				continue;
			}
			var Cycle = this.pCycles[nCol][nRow];
			if(Cycle.isFree) {
				Cycle.isFree = false;
				Cycle.sDescription = sDescription;
				return true;
			}
		}
	}
	return false;
}

tDma.prototype.getCycleAt = function(CyclePos) {
	return this.pCycles[CyclePos.nX][CyclePos.nY];
}
