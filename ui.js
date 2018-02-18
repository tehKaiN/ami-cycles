function tUi(Dma) {
	this.Dma = Dma;
	this.eEnabled = document.querySelector('#videoDmaEnabled');
	this.eHires = document.querySelector('#videoDmaHires');
	this.eBpp = document.querySelector('#videoDmaBpp');
	this.eVideoPattern = document.querySelector('#videoDmaPattern');
	this.eApply = document.querySelector('#apply');

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
	for(var nY = Ddfstrt.nY; nY < Ddfstop.nY; ++nY) {
		var nPatternIdx = 0;
		for(var nX = Ddfstrt.nX; nX < Ddfstop.nX; ++nX) {
			if(this.pPattern[nPatternIdx] != -1 && this.pPattern[nPatternIdx] < nBpp) {
				this.Dma.fillCycleAt({nX: nX, nY: nY});
			}
			nPatternIdx = (nPatternIdx+1) % 8;
		}
	}
}

tUi.prototype.resizeVisualizer = function() {
	var eBody = document.documentElement;
	var eRight = document.querySelector('#rightPanel');
	document.querySelector('#dmaVisualizer').visualizer.resize(
		eBody.clientWidth - eRight.offsetWidth,
		eBody.clientHeight - 3
	);
}
