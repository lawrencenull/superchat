"use strict";

// Author: Michael Puckett - michaelcpuckett@gmail.com
// 2012-09-15 for AW
// 2012-11-05 for AC

// enables keyboard navigation of gallery images

var AC = (function () {

	// private vars
	var $assets;
	var $body;
	var $scrollRoot;
	var $win;
	var getClosestAsset;
	var getClosestValues;
	var getAssetOffsetAt;
	var getScroll;
	var key; // holds left and right keycodes
	var onKey;

	// variable definitions
	$body = $('body');
	$scrollRoot = $('html,body');
	$win = $(window);
	$assets = $('#assets_wrap').children();
	key = {
		left: 37,
		right: 39
	};

	// methods
	getClosestValues = function(a, x) {
		// via http://stackoverflow.com/questions/4431259/formal-way-of-getting-closest-values-in-array-in-javascript-given-a-value-and-a
	    var lo = 0,
	    	hi = a.length-1,
	    	result = {};
	    while (hi - lo > 1) {
	        var mid = Math.round((lo + hi)/2);
	        if (a[mid] <= x) {
	            lo = mid;
	        } else {
	            hi = mid;
	        }
	    }
	    if (a[lo] == x) {
	    	lo = lo-1; // previous
	    	//hi = hi+1; // next
	    }
	    // send both options in an object
	    result[key.left] = a[lo];
	    result[key.right] = a[hi];
	    return result;
	};
	getAssetOffsetAt = function ($asset) {
		return $asset.offset().left;
	};
	getClosestAsset = function (scroll, keyCode) {
		var assetOffsets = [];
		$assets.each(function () {
			assetOffsets.push(getAssetOffsetAt( $(this) ));
		});
		// return correct option based on left or right keycode
		return getClosestValues(assetOffsets, scroll)[keyCode];
	};
	getScroll = function () {
		return $win.scrollLeft();
	};

	// event-driven methods
	onKey = function (e) {
		var keyCode = e.keyCode;
		if (keyCode === key.left || keyCode === key.right) {
			var offset = getClosestAsset( getScroll(), keyCode );
			e.preventDefault();
			$scrollRoot.stop(true,true).animate({scrollLeft: offset}, 0);
		}
	};

	// events -- jQuery version too old for 'on'
	$body.bind('keydown', onKey);

}());

$(AC);