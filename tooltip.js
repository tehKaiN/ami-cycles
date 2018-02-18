function tTooltip() {
	this.eContainer = document.createElement('div');
	document.body.appendChild(this.eContainer);

	this.eArrow = document.createElement('div');
	this.eArrow.setAttribute('class', 'arrow bottom');
	this.eContainer.appendChild(this.eArrow);

	this.eContent = document.createElement('div');
	this.eContent.setAttribute('class', 'content');
	this.eContainer.appendChild(this.eContent);

	this.visible = true; // Enforce hiding
	this.hide();
}

tTooltip.prototype.setBody = function(sBody) {
	this.eContent.innerHTML = sBody;

	return this;
}

tTooltip.prototype.showAt = function(Pos, sOrientation) {
	if(!this.visible) {
		this.visible = true;
		this.eContainer.setAttribute('class', 'tooltip visible');
	}
	if(sOrientation == 'bottom') {
		// Tooltip at bottom - arrow on top of tooltip
		this.eContainer.style.left = (Pos.nX-8) + 'px';
		this.eContainer.style.top = (Pos.nY+8) + 'px';
		this.eArrow.setAttribute('class', 'arrow top');
	}
	else if(sOrientation == 'top') {
		// Tooltip on top - arrow at bottom of tooltip
		this.eContainer.style.left = (Pos.nX-8) + 'px';
		this.eContainer.style.top = (Pos.nY - this.eContainer.offsetHeight-8) + 'px';
		this.eArrow.setAttribute('class', 'arrow bottom');
	}

	return this;
}

tTooltip.prototype.hide = function() {
	if(this.visible) {
		this.visible = false;
		this.eContainer.setAttribute('class', 'tooltip hidden');
	}
	return this;
}
