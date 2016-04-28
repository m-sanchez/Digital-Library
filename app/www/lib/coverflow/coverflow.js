'use strict';

angular.module('angular-coverflow', [])
.directive('coverflow', function() {
	return {
		restrict: 'E',
		replace: true,
		template: '<div class="coverflow-container"></div>',
		scope: {
			images: "=",
			onCoverClick: "&",
			onCoverChange: "&"
		},
		link: function(scope, element, attributes) {
			scope.onCoverClick = scope.onCoverClick || function(){};
			scope.onCoverChange = scope.onCoverChange || function(){}

			// Initialize
			var coverflow = new Coverflow({
				width: element[0].offsetWidth,
				height: 320,
				element: element,
				scope: scope,
				onclick: function(cover){
					scope.onCoverClick({
						"$cover": scope.images[cover.index]
					});
				},
				onchange: function(index){
					scope.onCoverChange({
						"$cover": scope.images[index]
					});
				}
			});

			scope.$watch("images", function(_new) {
				if (_new) {
					coverflow.init(_new);
				}
			});

			// Setup touch listeners
			element.bind('touchstart', function(evt){
				var pageX = evt.changedTouches[0].pageX;
				coverflow.touchStart({
					pageX: pageX,
					preventDefault: evt.preventDefault.bind(evt),
					stopPropagation: evt.stopPropagation.bind(evt)
				});
			});
			element.bind('touchmove', function(evt){
				coverflow.touchMove({
					pageX: evt.changedTouches[0].pageX,
					preventDefault: evt.preventDefault.bind(evt),
					stopPropagation: evt.stopPropagation.bind(evt)
				});
			});
			element.bind('touchend', function(evt){
				coverflow.touchEnd({
					pageX: evt.changedTouches[0].pageX,
					preventDefault: evt.preventDefault.bind(evt),
					stopPropagation: evt.stopPropagation.bind(evt)
				});
			});

			// Setup mouse listeners
			element.bind('mousedown', coverflow.touchStart.bind(coverflow));
			element.bind('mousemove', coverflow.touchMove.bind(coverflow));
			element.bind('mouseup', coverflow.touchEnd.bind(coverflow));
			element.bind('mouseout', function(evt){
				// Skip if we're hovering a child

				var elm = evt.toElement || evt.relatedTarget;
				while(elm){
					if(elm == this || elm.parentNode == this){
						return;
					}

					elm = elm.parentElement;
				}

				coverflow.touchEnd(evt);
			});
		}
	};
});


// Request Animation Frame Shim
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();


/*************************** Coverflow Object ***************************/
var VELOCITIES_CACHE = 5;
var MIN_SPEED = 0.1; // px/ms
var GRAVITY_EFFECT = 0.005; // [0,1], 0 = no effect, 1 = max effect. Affected by framerate (* delta)
var DRAG_EFFECT = 0.1; // [0,1], 0 = no effect, 1 = max effect
var Coverflow = function(params) {
	this.width = params.width;
	this.height = params.height;
	this.element = params.element;
	this.center = this.width / 2;
	this.coverWidth = params.coverWidth || 200;
	this.coverHeight = params.coverHeight || 200;
	this.coverFrameWidth = this.coverWidth * 1.1; // How much space takes each cover, counting margins.
	this.p = undefined;
	this.visibleCovers = undefined;
	this.totalCovers = undefined;
	this.covers = [];
	this.cache = [];
	this.velocity = 0.0; // px/ms
	this.easing = 1.05;
	this.position = 0.0;
	this.maxScroll = Infinity;
	this.lastPositionIndex = null;
	this.positionIndex = 0;
	this.animating = false; // Whether is requesting more frames.
	this.lastTime = null; // Last time rendered.
	this.touch = {
		start: undefined,
		startingPosition: undefined,
		last: undefined, // Position
		lastTime: undefined,
		velocities: [], // px / ms
		iv: 0
	}
	this.onclick = params.onclick || function(){};
	this.onchange = params.onchange || function(){};

	this.coversElement = angular.element("<div></div>");
	this.coversElement.addClass("covers");
	this.element.append(this.coversElement);
};

// Create covers
Coverflow.prototype.init = function(images) {
	this.images = images;

	// Images
	if (this.images && this.images.length) {
		this.visibleCovers = Math.round(this.width / this.coverFrameWidth); // How many covers are shown in the screen
		this.visibleCovers = Math.min(this.visibleCovers, this.images.length); // No more than images we have
		this.totalCovers = Math.min(this.visibleCovers + 1, this.images.length); // How many covers are displayed and animated. No more than images we have.

		// Create covers
		for (var i = this.covers.length; i < this.totalCovers; i++) {
			this.covers[i] = new Cover({
				id: i,
				width: this.coverWidth,
				height: this.coverHeight,
				y: (this.height - this.coverHeight) / 2,
				frameWidth: this.coverFrameWidth,
				onclick: function(cover){
					if(cover.index == this.lastPositionIndex){
						this.onclick(cover);
					}
				}.bind(this)
			}).init(this.coversElement)

			// Set his image
			if(i < this.images.length){
				this.covers[i].setCover({
					index: i,
					imageURL: this.images[i].cover,
					aspectRatio: this.images[i].width / this.images[i].height
				});
			}
		}
		// TODO: Remove 'em from DOM if there are too many.

		var totalImages = this.images.length;
		this.maxScroll = this.coverFrameWidth * (totalImages - 1);

		// Preload
		// We assume they are already preloaded, because they need to know the width/height of each image
		/*for (var i = 0; i < totalImages; i++) {
			var cachedImage = new Image();
			cachedImage.src = this.images[i].cover;
		}*/

		// Animate
		this.startAnimation(true);
	}

	return this;
};

// Animate Frame
Coverflow.prototype.startAnimation = function(force){
	if(this.animating) return;
	this.animateFrame(null, force);
}
Coverflow.prototype.animateFrame = function(time, force) {
	var self = this;

	function checkCoverChange(){
		var aux = self.currentPositionIndex();
		if(self.lastPositionIndex == null || self.lastPositionIndex != aux){
			self.lastPositionIndex = aux;
			self.onchange(self.lastPositionIndex);
		}
	}

	var delta = (time && this.lastTime) ? time - this.lastTime : 0;

	// Velocity
	if(!this.mouseIsDown && !force){
		// Only calculate velocity if we're not dragging and it's not a forced animation (just 1 frame).
		this.velocity = this.nextVelocity(delta);

		if (this.velocity === 0 && this.getGravity(this.position) < 0.1) {
			// skip animations to save power on idle. Will resume with a touch event.
			this.animating = false;
			this.lastTime = null;

			if(GRAVITY_EFFECT){
				// We will just do one more run to ensure the position is correct.
				this.position = Math.round(this.position / this.coverFrameWidth) * this.coverFrameWidth;
				for (var i = 0; i < this.totalCovers; i++) {
					this.covers[i].animateFrame(this.position);
				}
			}
			// console.log("Stop animation");
			return;
		}
		this.animating = true;
		requestAnimFrame(self.animateFrame.bind(self));
	}else{
		this.animating = false;
	}

	checkCoverChange.apply(this);	

	// Position & Index
	this.lastTime = time;
	this.position = this.nextPosition(delta);
	this.positionIndex = this.currentPositionIndex();

	// Animate Cover Frame
	for (var i = 0; i < this.totalCovers; i++) {
		this.covers[i].animateFrame(this.position);
	}

	this.overflows();
};
Coverflow.prototype.overflows = function(){
	var sobranIzq = [];
	var sobranDer = [];
	var minIndex = Number.MAX_VALUE;
	var maxIndex = 0;
	for (var i = 0; i < this.totalCovers; i++) {
		minIndex = Math.min(minIndex, this.covers[i].cover.index);
		maxIndex = Math.max(maxIndex, this.covers[i].cover.index);

		if(this.covers[i].x+this.coverWidth/2 > this.width/2){
			sobranDer.push(this.covers[i]);
		}else if(this.covers[i].x-this.coverWidth/2 < -this.width/2){
			sobranIzq.push(this.covers[i]);
		}
	}

	sobranIzq.sort(function(a,b){
		return a.x - b.x;
	});
	sobranDer.sort(function(a,b){
		return a.x - b.x;
	});

	if(sobranDer.length > sobranIzq.length && minIndex > 0){
		while(sobranDer.length > sobranIzq.length && minIndex > 0){
			// Hay mas que sobran en la derecha que en la izquierda, y no hemos llegado al final
			// Total: Hay que coger de la derecha y meterlos en la izquierda.
			var sobra = sobranDer.pop();
			sobra.setCover({
				index: minIndex-1,
				imageURL: this.images[minIndex-1].cover,
				aspectRatio: this.images[minIndex-1].width / this.images[minIndex-1].height
			});
			sobranIzq.push(sobra);
			minIndex--;
		}
	}else{
		while(sobranDer.length < sobranIzq.length && maxIndex < this.images.length-1){
			// Hay mas que sobran en la derecha que en la izquierda, y no hemos llegado al final
			// Total: Hay que coger de la derecha y meterlos en la izquierda.
			var sobra = sobranIzq.shift();
			sobra.setCover({
				index: maxIndex+1,
				imageURL: this.images[maxIndex+1].cover,
				aspectRatio: this.images[maxIndex+1].width / this.images[maxIndex+1].height
			});
			sobranDer.push(sobra);
			maxIndex++;
		}
	}
}

// Easing
Coverflow.prototype.nextVelocity = function(delta) {
	var position = this.position;
	var gravity = this.getGravity(position); // [-1,1], -1 = max left, 1 = max right
	var drag = this.getDrag(position); // [0,1], 0 = min, 1 = max

	var velocityThreshold = (this.velocity <= MIN_SPEED && this.velocity >= -MIN_SPEED);
	var gravityThreshold = (Math.abs(gravity) <= 0.01);
	if(velocityThreshold && (gravityThreshold || GRAVITY_EFFECT == 0)){
		return 0.0;
	}

	gravity = gravity * GRAVITY_EFFECT * delta;
	drag = drag * DRAG_EFFECT;
	drag = 1-drag;
	return (this.velocity + gravity) * drag / this.easing;
};

// Easing
Coverflow.prototype.nextPosition = function(delta) {
	var position = this.position + this.velocity * delta;

	// If mouse is down (i.e., we're dragging), then set position half what the user is dragging if it overflows.
	var divider = this.mouseIsDown ? 2 : 1;
	if (position >= this.maxScroll) {
		return this.maxScroll + (position - this.maxScroll) / divider;
	}
	if (position <= 0) {
		return position / divider;
	}
	return position;
};

Coverflow.prototype.getGravity = function(position){
	window.aux = this;
	var suck;

	if(position <= 0){
		var diff = -position;
		suck = diff / this.coverFrameWidth;
	}else if(position >= this.maxScroll){
		var diff = position - this.maxScroll;
		suck = -diff / this.coverFrameWidth;
	}else{
		var mod = position % this.coverFrameWidth
		var diff = this.coverFrameWidth/2 - mod;
		suck = diff < 0 ? (diff + this.coverFrameWidth/2) / (this.coverFrameWidth/2) : diff / (this.coverFrameWidth/2) - 1;
	}

	return suck;
}
Coverflow.prototype.getDrag = function(position){
	var OVERFLOW_BASE_DRAG = 0.5;
	var drag;

	if(position <= 0){
		var diff = -position;
		if(diff > this.coverFrameWidth) drag = OVERFLOW_BASE_DRAG;
		else {
			drag = OVERFLOW_BASE_DRAG + (1-OVERFLOW_BASE_DRAG) * (1 - diff / this.coverFrameWidth);
		}
	}else if(position >= this.maxScroll){
		var diff = position - this.maxScroll;
		if(diff > this.coverFrameWidth) drag = 0.5;
		else {
			drag = OVERFLOW_BASE_DRAG + (1-OVERFLOW_BASE_DRAG) * (1 - diff / this.coverFrameWidth);
		}
	}else{
		var mod = position % this.coverFrameWidth
		var diff = this.coverFrameWidth/2 - mod;
		drag = diff < 0 ? 1-(diff + this.coverFrameWidth/2) / (this.coverFrameWidth/2) : diff / (this.coverFrameWidth/2);	
	}

	return drag;
}

// Next Position Index
Coverflow.prototype.currentPositionIndex = function() {
	var centerPos = this.position + this.coverFrameWidth / 2;
	var index = Math.floor(centerPos / this.coverFrameWidth);

	if(index < 0)
		return 0;
	if(index >= this.covers.length) return this.covers.length-1;

	return index;
};

// Touch Control
/* evt only needs a relative coordinate in evt.pageX */
Coverflow.prototype.touchStart = function(event) {
	event.preventDefault();
	event.stopPropagation();


	// If position is in overflow, it gets divided by two to make the drag effect, so we have to revert it here */
	if(this.position <= 0){
		this.position = this.position * 2;
	}else if(this.position >= this.maxScroll){
		this.position = this.position + (this.position - this.maxScroll);
	}

	this.velocity = 0.0;
	this.touch.startingPosition = this.position;
	this.touch.start = this.touch.last = event.pageX;
	this.touch.lastTime = (new Date()).getTime();
	this.touch.velocities = [];
	this.touch.iv = 0;
	this.mouseIsDown = true;

};

/* evt only needs a relative coordinate in evt.pageX */
Coverflow.prototype.touchMove = function(event) {
	if (this.mouseIsDown) {
		event.preventDefault();
		event.stopPropagation();

		var now = event.pageX;

		this.position = this.touch.startingPosition + (this.touch.start - now);
		this.pushSpeed(this.touch.last - now);
		this.touch.last = now;

		this.startAnimation();
	}
};

Coverflow.prototype.touchEnd = function(event) {
	if (this.mouseIsDown) {
		event.preventDefault();
		event.stopPropagation();
		
		this.mouseIsDown = false;
		this.velocity = this.getMeanSpeed();

		this.startAnimation();
	}
};

Coverflow.prototype.pushSpeed = function(delta) {
	var now = (new Date()).getTime();
	if(now <= this.touch.lastTime){
		// OMG SUPERFAST WTF! -- Just skip it, lol.
		return;
	}

	var speed = delta / (now - this.touch.lastTime);
	this.touch.lastTime = now;

	if(this.touch.velocities.length < VELOCITIES_CACHE){
		this.touch.velocities.push(speed);
	}else{
		this.touch.velocities[this.touch.iv] = speed;
	}
	this.touch.iv++;
	this.touch.iv = this.touch.iv % VELOCITIES_CACHE;
}
Coverflow.prototype.getMeanSpeed = function(){
	if(this.touch.velocities.length == 0) return 0;

	var total = 0;
	this.touch.velocities.forEach(function(v){
		total += v
	});
	return total / this.touch.velocities.length;
}


/*************************** Cover Object ***************************/
var Cover = function(params) {
	this.id = typeof params.id == "number" ? params.id : Math.floor(Math.random() * 10000);
	this.x = params.x || 0;
	this.y = params.y || 0;
	this.width = params.width || 200;
	this.frameWidth = params.frameWidth || this.width * 1.1;
	this.height = params.height || 200;
	this.aspectRatio = this.width / this.height;
	this.maxRotation = params.maxRotation || 60;
	this.rotation = 0;
	this.scale = 1;
	this.element = null;
	this.cover = null;
	this.onclick = params.onclick || function(){};
};

Cover.prototype.init = function(parent) {
	parent.append(this.template());
	this.element = parent.find(".coverflow-cover-id-" + this.id);


	var tapValid = false;
	var MAX_TOUCH_MOVE = 10;
	var startTap = {
		x:0,
		y:0
	}
	function checkTapValid(x, y){
		var Ax = startTap.x - x;
		var Ay = startTap.y - y;
		if(Ax*Ax + Ay*Ay > MAX_TOUCH_MOVE*MAX_TOUCH_MOVE){
			return false;
		}
		return true;
	}
	function startTouch(x, y){
		startTap = {
			x:x,
			y:y
		}

		tapValid = true;
	}
	function moveTouch(x, y){
		if(!tapValid) return;

		tapValid = checkTapValid(x, y);
	}
	var self = this;
	function endTouch(x, y){
		tapValid = checkTapValid(x, y);
		if(!tapValid) return;

		self.onclick(self.cover);

		tapValid = false;
	}

	this.element.bind("touchstart", function(evt){
		startTouch(evt.changedTouches[0].pageX, evt.changedTouches[0].pageY);
	});
	this.element.bind('touchmove', function(evt){
		moveTouch(evt.changedTouches[0].pageX, evt.changedTouches[0].pageY);
	});
	this.element.bind('touchend', function(evt){
		endTouch(evt.changedTouches[0].pageX, evt.changedTouches[0].pageY);
	});
	this.element.bind("mousedown", function(evt){
		startTouch(evt.pageX, evt.pageY);
	});
	this.element.bind('mousemove', function(evt){
		moveTouch(evt.pageX, evt.pageY);
	});
	this.element.bind('mouseup', function(evt){
		endTouch(evt.pageX, evt.pageY);
	});

	return this;
};

Cover.prototype.setCover = function(cover){
	this.cover = cover;
	this.element[0].style.backgroundImage = "url('" + this.cover.imageURL + "')";

	var height, width;
	if(cover.aspectRatio < this.aspectRatio){ // Es más alta que ancha comparado con este.
		width = this.height * cover.aspectRatio;
		height = this.height;
	}else{
		width = this.width;
		height = this.width / cover.aspectRatio;
	}
	this.element[0].style.width = width + "px";
	this.element[0].style.height = height + "px";
	// Etc etc.
};

Cover.prototype.template = function() {
	return '<div class="coverflow-cover coverflow-cover-id-' + this.id + '"></div>';
};

Cover.prototype.center = function() {
	return {
		x: this.x + (this.width / 2),
		y: this.y + (this.height / 2)
	}
};

Cover.prototype.applyNextStyle = function() {
	var width = parseInt(this.element[0].style.width || this.width);
	this.element[0].style["-webkit-transform"] = "translate3d(" + (this.x - width / 2) + "px, " + this.y + "px, 0px) rotateY(" + this.rotation + "deg) scale3d(" + this.scale + ", " + this.scale + ", 1)";
	this.element[0].style["transform"] = this.element[0].style["-webkit-transform"];
};

Cover.prototype.calculateNextStyle = function(scroll) {
	this.x = this.nextCoverX(scroll);
	this.rotation = this.nextRotation(scroll);
	this.scale = this.nextScale(scroll);
};

Cover.prototype.animateFrame = function(scroll) {
	this.calculateNextStyle(scroll);
	this.applyNextStyle();
};

Cover.prototype.nextCoverX = function(scroll) {
	if(this.cover == null) return 0;
	var xNoScroll = this.cover.index * this.frameWidth;

	return xNoScroll - scroll;
};

Cover.prototype.nextRotation = function() {
	var delta = Math.abs(this.x),
		sign = this.x < 0 ? 1 : -1;

	var deltaJump = this.frameWidth / 4;
	
	/*
	 * 1 |      ---
	 *   |     /
	 *   |    /
	 * 0 |---/
	 *   ----------
	 *    A  B  C  D
	 *
	 * A: initial = 0: When the cover is in the front.
	 * B: deltaJump: When the cover is leaving the front (this.size away from center).
	 * C: deltaJump+this.frameWidth/4: When the cover is almost at the end.
	 * D: final = 0: When the cover is about to leave.
	 */
	var offset;
	if (delta < deltaJump) {
		offset = 0;
	} else if (delta < deltaJump + this.frameWidth / 2) {
		offset = (delta - deltaJump) * 1 / (this.frameWidth / 2);
	} else {
		offset = 1;
	}

	return 0 + (sign * offset) * this.maxRotation;
};

Cover.prototype.nextScale = function() {
	return (1 - Math.abs(this.rotation / this.maxRotation) + 5) / 6;
};

/*
Cover.prototype.overflowAt = function(leftOrRight) {
	var overflow = this.overflow + leftOrRight,
		fromPositionId = this.positionId,
		positionId = this.coverId - (this.flow.totalCovers * overflow);

	// Images Bounds
	if (this.flow.images) {
		if (positionId < 0) return;
		if (positionId > this.flow.totalImages - 1) return;
	}

	// Commit
	this.overflow = overflow;
	this.positionId = positionId;
	if (!this.flow.images) return;
	this.updateCover(this.flow.images[this.positionId]);
};

Cover.prototype.nextRotation = function(i, cover) {
};

Cover.prototype.nextScale = function(i, cover) {
	
};

*/