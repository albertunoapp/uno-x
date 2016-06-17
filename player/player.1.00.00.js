/* **********************************************************
 *
 *  This is the player that handles:
 *  - Parsing playlist
 *  - Requesting DOM manipulation
 *  - Making external API calls (eg. feeds)
 *
 * ********************************************************** */

// NOTE: sandbox.html has its own _root, accessible from window._root
var _root = {};

// Privatize our scope
;(function() {
	if (!console._log) {
		// Pass console output to launcher
		console._log = console.log;
		console.log = function(message) {
			chrome.runtime.sendMessage({
				"action": "queueLogEntry",
				"args": {
					"type": "log",
					"message": message
				}
			});
			console._log(message);
		}
		console._info = console.info;
		console.info = function(message) {
			chrome.runtime.sendMessage({
				"action": "queueLogEntry",
				"args": {
					"type": "info",
					"message": message
				}
			});
			console._info(message);
		}
		console._error = console.error;
		console.error = function(message) {
			chrome.runtime.sendMessage({
				"action": "queueLogEntry",
				"args": {
					"type": "error",
					"message": message
				}
			});
			console._error(message);
		}
	}

	var initializeGlobalVariables = function() {
		_root = {};
		_root.playerVersion = '1.00.00';
		_root.layouts = _args.data.playlist.layouts;
		_root.playlists = _args.data.playlist.playlists;
		window._root.callbacks = {};
		console.log('Initializing player v' + _root.playerVersion + '...');
	};

	// Runs once per interval to update player content as per playlist
	var playlistStep = function(playlist) {

		var z_regionid_fk = playlist.currentEntry.z_regionid_fk;
		var region;
		for (var i = 0; i < _root.currentLayout.regions.length; i++) {
			if (_root.currentLayout.regions[i].z_regionid_pk == z_regionid_fk) {
				region = _root.currentLayout.regions[i];
				break;
			}
		}
		var z_contentid_pk = playlist.currentEntry.z_contentid_fk;

		// Queue the appropriate instruction
		chrome.runtime.sendMessage({
			"action": "queueInstruction",
			"args": {
				"command": "drawImage",
				"elementID": z_regionid_fk,
				"z_contentid_pk": z_contentid_pk,
				"width": region.width,
				"height": region.height,
				"x": region.x,
				"y": region.y,
				"z": region.z
			}
		});

		// Delay should be set to the next keyframe
		var delay = playlist.currentEntry.duration * 1000;
		setTimeout(function() {
			playlist.currentEntryIndex++;
			if (playlist.currentEntryIndex >= playlist.entries.length) {
				playlist.currentEntryIndex = 0;
			}
			playlist.currentEntry = playlist.entries[playlist.currentEntryIndex];

			playlistStep(playlist);
		}, delay);
	}

	var startPlaylist = function(playlist) {
		playlist.timer = 0;
		playlist.currentEntryIndex = 0;
		playlist.currentEntry = playlist.entries[playlist.currentEntryIndex];
		playlistStep(playlist);
	}

	var startPlayer = function() {
		initializeGlobalVariables();

		// Process the playlist
		_root.currentLayout = _root.layouts[0];

		for (var playlistIndex = 0; playlistIndex < _root.playlists.length; playlistIndex++) {
			var playlist = _root.playlists[playlistIndex];

			// Fork an independent process for each playlist
			startPlaylist(playlist);
		}
	};

	// Prevent duplicate function calls when we restart the player!
	clearAllTimeouts();

	startPlayer();
})();