function tUi(Dma) {
	this.Dma = Dma;
	this.eEnabled = document.querySelector('#videoDmaEnabled');
	this.eHires = document.querySelector('#videoDmaHires');
	this.eBpp = document.querySelector('#videoDmaBpp');
	this.eVideoPattern = document.querySelector('#videoDmaPattern');
	this.eApply = document.querySelector('#apply');
	this.eCopperInput = document.querySelector('#copperInput');

	// Events
	var Ui = this;
	this.eEnabled.addEventListener('change', function() {Ui.sync();});
	this.eHires.addEventListener('change', function() {Ui.sync();});
	this.eBpp.addEventListener('change', function() {Ui.sync();});
	this.eApply.addEventListener('click', function() {Ui.applyCycles();});

	window.addEventListener('resize', function() {Ui.resizeVisualizer();});

	this.resizeVisualizer();
	this.sync();
}

/**
 * Sets pattern preview on UI.
 * @param {!number[]} pPattern 8-element array with bitplane indices. -1 means always
 *            free cycle.
 */
tUi.prototype.setPattern = function(pPattern) {
	this.pPattern = pPattern;
	var eCells = this.eVideoPattern.rows[0].children;
	for(var i = 0; i < eCells.length; ++i) {
		eCells[i].innerHTML = (pPattern[i] != -1 ? pPattern[i] : '');
	}
}

tUi.prototype.isVideoEnabled = function() {
	return this.eEnabled.checked;
}

tUi.prototype.isVideoHires = function() {
	return this.eHires.checked;
}

tUi.prototype.getBpp = function() {
	if(this.isVideoEnabled()) {
		return parseInt(this.eBpp.value);
	}
	else {
		return 0;
	}
}

/**
 * Synchronizes internal options with HTML UI.
 */
tUi.prototype.sync = function() {
	if(this.isVideoHires()) {
		this.setPattern([3, 1, 2, 0, 3, 1, 2, 0]);
		// 5 & 6 BPP not available in hires
		this.eBpp.options[4].disabled = true;
		this.eBpp.options[5].disabled = true;
		if(this.eBpp.selectedIndex >= 4) {
			this.eBpp.selectedIndex = 3;
		}
	}
	else {
		this.setPattern([-1, 3, 5, 1, -1, 2, 4, 0]);
		this.eBpp.options[4].disabled = false;
		this.eBpp.options[5].disabled = false;
	}
	var nBpp = this.getBpp();

	var eCells = this.eVideoPattern.rows[0].children;
	for(var i = 0; i < eCells.length; ++i) {
		if(this.pPattern[i] != -1 && this.pPattern[i] < nBpp) {
			eCells[i].setAttribute('class', 'non-free');
		}
		else {
			eCells[i].setAttribute('class', 'free');
		}
	}
}

/**
 * Applies all selected options and fills DMA with resulting cycles.
 */
tUi.prototype.applyCycles = function() {
	var Ddfstrt = {nX: 0x38, nY: 0x2C};
	var Ddfstop = {nX: 0xD0, nY: 0x2C + 256};
	var nBpp = this.getBpp();

	this.Dma.clear();

	// Stuff of top priority
	for(var nY = 0; nY < this.Dma.nCycleRows; ++nY) {
		// Memory refresh
		this.Dma.fillCycleAt({nX: 0xE3, nY: nY}, "Mem refresh: 1/4");
		this.Dma.fillCycleAt({nX: 0x01, nY: nY}, "Mem refresh: 2/4");
		this.Dma.fillCycleAt({nX: 0x03, nY: nY}, "Mem refresh: 3/4");
		this.Dma.fillCycleAt({nX: 0x05, nY: nY}, "Mem refresh: 4/4");

		// Disk
		this.Dma.fillCycleAt({nX: 0x07, nY: nY}, "Disk: 1/3");
		this.Dma.fillCycleAt({nX: 0x09, nY: nY}, "Disk: 2/3");
		this.Dma.fillCycleAt({nX: 0x0B, nY: nY}, "Disk: 3/3");

		// Audio
		this.Dma.fillCycleAt({nX: 0x0D, nY: nY}, "Audio: 1/4");
		this.Dma.fillCycleAt({nX: 0x0F, nY: nY}, "Audio: 2/4");
		this.Dma.fillCycleAt({nX: 0x11, nY: nY}, "Audio: 3/4");
		this.Dma.fillCycleAt({nX: 0x13, nY: nY}, "Audio: 4/4");

		// Sprites
		this.Dma.fillCycleAt({nX: 0x15, nY: nY}, "Sprite 1: 1/2");
		this.Dma.fillCycleAt({nX: 0x17, nY: nY}, "Sprite 1: 2/2");
		this.Dma.fillCycleAt({nX: 0x19, nY: nY}, "Sprite 2: 1/2");
		this.Dma.fillCycleAt({nX: 0x1B, nY: nY}, "Sprite 2: 2/2");
		this.Dma.fillCycleAt({nX: 0x1D, nY: nY}, "Sprite 3: 1/2");
		this.Dma.fillCycleAt({nX: 0x1F, nY: nY}, "Sprite 3: 2/2");
		this.Dma.fillCycleAt({nX: 0x21, nY: nY}, "Sprite 4: 1/2");
		this.Dma.fillCycleAt({nX: 0x23, nY: nY}, "Sprite 4: 2/2");
		this.Dma.fillCycleAt({nX: 0x25, nY: nY}, "Sprite 5: 1/2");
		this.Dma.fillCycleAt({nX: 0x27, nY: nY}, "Sprite 5: 2/2");
		this.Dma.fillCycleAt({nX: 0x29, nY: nY}, "Sprite 6: 1/2");
		this.Dma.fillCycleAt({nX: 0x2B, nY: nY}, "Sprite 6: 2/2");
		this.Dma.fillCycleAt({nX: 0x2D, nY: nY}, "Sprite 7: 1/2");
		this.Dma.fillCycleAt({nX: 0x2F, nY: nY}, "Sprite 7: 2/2");
		this.Dma.fillCycleAt({nX: 0x31, nY: nY}, "Sprite 8: 1/2");
		this.Dma.fillCycleAt({nX: 0x33, nY: nY}, "Sprite 8: 2/2");
	}

	// Then goes Bitplanes
	for(var nY = Ddfstrt.nY; nY < Ddfstop.nY; ++nY) {
		var nPatternIdx = 0;
		for(var nX = Ddfstrt.nX; nX < Ddfstop.nX; ++nX) {
			if(this.pPattern[nPatternIdx] != -1 && this.pPattern[nPatternIdx] < nBpp) {
				this.Dma.fillCycleAt({nX: nX, nY: nY}, `Bitplane ${this.pPattern[nPatternIdx]}`);
			}
			nPatternIdx = (nPatternIdx+1) % 8;
		}
	}

	// Copper uses what's left for him
	var pCopCmds = copListParseList(this.eCopperInput.value);
	if(pCopCmds) {
		var CopMovePos = {nX: 0, nY: 0};
		for(var i = 0; i < pCopCmds.length; ++i) {
			if(!pCopCmds[i].isValid) {
				break;
			}
			if(pCopCmds[i].sCmdType == 'wait') {
				this.Dma.appendCycleAfter(CopMovePos, `WAIT 1/3: ${pCopCmds[i].Pos.nX},${pCopCmds[i].Pos.nY}`);
				this.Dma.appendCycleAfter(CopMovePos, `WAIT 2/3: ${pCopCmds[i].Pos.nX},${pCopCmds[i].Pos.nY}`);
				CopMovePos = {nX: pCopCmds[i].Pos.nX, nY: pCopCmds[i].Pos.nY};
				this.Dma.appendCycleAfter(CopMovePos, `WAIT 3/3: ${pCopCmds[i].Pos.nX},${pCopCmds[i].Pos.nY}`);
			}
			else if(pCopCmds[i].sCmdType == 'move') {
				this.Dma.appendCycleAfter(CopMovePos, `MOVE 1/2: ${pCopCmds[i].sLine}`);
				this.Dma.appendCycleAfter(CopMovePos, `MOVE 2/2: ${pCopCmds[i].sLine}`);
			}
			// Add cycles
		}
	}

	// Blitter and CPU take rest of cycles alternating between each other.
	// CPU is working on even cycles. If BLITHOG is enabled, blitter is able to
	// steal one odd cycle from CPU, making them work in 3:1 ratio
	// (blitter: odd-even-odd, CPU: even).
}

tUi.prototype.resizeVisualizer = function() {
	var eBody = document.documentElement;
	var eRight = document.querySelector('#rightPanel');
	document.querySelector('#dmaVisualizer').visualizer.resize(
		eBody.clientWidth - eRight.offsetWidth,
		eBody.clientHeight - 3
	);
}
