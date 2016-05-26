/* **********************************************************
 *
 *  This is the player that handles:
 *  - Parsing playlist
 *  - Requesting DOM manipulation
 *  - Making external API calls (eg. feeds)
 *
 * ********************************************************** */

var _root = {};

// Privatize our scope
;(function() {
	// Pass console output to launcher
	console.log = function(message) {
		chrome.runtime.sendMessage({
			"action": "queueLogEntry",
			"args": {
				"type": "log",
				"message": message
			}
		});
	}
	console.info = function(message) {
		chrome.runtime.sendMessage({
			"action": "queueLogEntry",
			"args": {
				"type": "info",
				"message": message
			}
		});
	}
	console.error = function(message) {
		chrome.runtime.sendMessage({
			"action": "queueLogEntry",
			"args": {
				"type": "error",
				"message": message
			}
		});
	}

	var initializeGlobalVariables = function() {
		_root = {};
		_root.playerVersion = '1.00.00'; // Should not need to be updated, but just in case...
		_root.playlist = window.data.playlist; // playlist
	}

	var startPlayer = function() {
		initializeGlobalVariables();

		// Access playlist
		console.log(_root.playlist);

		var layout = _root.playlist.layouts[0];
		var region = layout.regions[0];
		var image = 1407402;
		chrome.runtime.sendMessage({
			"action": "queueInstruction",
			"args": {
				"command": "drawImage",
				"imageID": image,
				"x": region.x,
				"y": region.y,
				"width": region.width,
				"height": region.height,
				"z-index": region['z-index']
			}
		});
	}

	// Prevent duplicate function calls when we restart the player!
	clearAllTimeouts();

	startPlayer();
})();