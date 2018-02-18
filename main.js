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

	var Ui = new tUi(Dma);
});
