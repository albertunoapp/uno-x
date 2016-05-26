/* **********************************************************
 *
 *  This is the player that handles:
 *  - Parsing playlist
 *  - Requesting DOM manipulation
 *  - Making external API calls (eg. feeds)
 *
 * ********************************************************** */

// TEMP: This is a debug timer to test for accuracy of playlist playback
var timerBase = (new Date()).getTime();
var debugTimer = function() {
	setInterval(function() {
		console.clear();
		var timer = ((new Date()).getTime() - timerBase);
		if (timer > 30000) {
			timerBase = (new Date()).getTime();
			timer = ((new Date()).getTime() - timerBase);
		}
		console.dir('timer: ' + timer);
		for (var playlistIndex = 0; playlistIndex < _root.currentSchedule.playlists.length; playlistIndex++) {
			var playlist = _root.currentSchedule.playlists[playlistIndex];
			console.dir('playlist'+playlistIndex+' timer: ' + playlist.timer);
		}
	}, 100);
};
//debugTimer();

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
		_root.schedule = _args.data.playlist.schedule;
		window._root.callbacks = {};
		console.log('Initializing player v' + _root.playerVersion + '...');
	};

	// Queue a callback function fot the next layout change
	// Don't change layout until all callbacks are received!
	var layoutPlaylistQueueCallback = function(callback) {
		_root.nextLayoutChangeCallbacks.push(callback);

		// If all callbacks are received, change layout and execute all callbacks
		if (_root.nextLayoutChangeCallbacks.length == _root.currentSchedule.playlists.length - _root.idlePlaylists) {
			// Change layout
			_root.currentLayoutPlaylistIndex++;
			if (_root.currentLayoutPlaylistIndex >= _root.currentSchedule.layoutPlaylist.length) {
				_root.currentLayoutPlaylistIndex = 0;
			}
			_root.currentLayoutEntry = _root.currentSchedule.layoutPlaylist[_root.currentLayoutPlaylistIndex];
			_root.currentLayout = _root.layouts[_root.currentLayoutEntry.layoutID];

			// Change layout
			chrome.runtime.sendMessage({
				"action": "queueInstruction",
				"args": {
					"command": "changeLayout",
					"regions": _root.currentLayout.regions
				}
			});

			for (var i = 0; i < _root.nextLayoutChangeCallbacks.length; i++) {
				_root.nextLayoutChangeCallbacks[i]();
			}

			_root.nextLayoutChangeTime = _root.currentLayoutEntry.endTime;
			_root.nextLayoutChangeCallbacks = [];
		}
	}

	// Runs once per interval to update player content as per playlist
	var playlistStep = function(playlist) {

		// If the current entry has endTime of "auto"...
		if (playlist.currentEntry.endTime == 'auto') {
			// Keep track of how many "placeOnce" content has finished...
			playlist.currentEntry.playOnceFinished = 0;

			// ...and the expected number of "placeOnce" content to finish
			playlist.currentEntry.playOnceContentCount = 0;
		}

		for (var regionIndex = 0; regionIndex < playlist.currentEntry.regions.length; regionIndex++) {
			var regionID = playlist.currentEntry.regions[regionIndex].regionID;
			var region = _root.currentLayout.regions[regionID];
			var contentID = playlist.currentEntry.regions[regionIndex].content.contentID;

			// If this is "playOnce" content, generate a callback function
			if (playlist.currentEntry.regions[regionIndex].content.playOnce) {
				if (!window._root.callbacks['playOnce' + contentID]) {
					playlist.currentEntry.playOnceContentCount++;
					window._root.callbacks['playOnce' + contentID] = function() {
						playlist.currentEntry.playOnceFinished++;
						delete window._root.callbacks['playOnce' + contentID];

						// If all "playOnce" content has finished...
						if (playlist.currentEntry.playOnceFinished >= playlist.currentEntry.playOnceContentCount) {
							delete playlist.currentEntry.playOnceFinished;
							delete playlist.currentEntry.playOnceContentCount;

							// Get the next entry
							playlist.currentEntryIndex++;
							if (playlist.currentEntryIndex >= playlist.entries.length) {
								playlist.currentEntryIndex = 0;
								playlist.timer = 0;
							}
							playlist.currentEntry = playlist.entries[playlist.currentEntryIndex];
							playlist.timer = playlist.currentEntry.startTime;

							// If the next entry starts during the upcoming layout change...
							if (playlist.currentEntry.startTime == _root.nextLayoutChangeTime) {
								layoutPlaylistQueueCallback(function() {
									playlistStep(playlist);
								});

							// Otherwise just set up the next entry
							} else {
								playlistStep(playlist);
							}
						}
					};
				}
			}

			// Queue the appropriate instruction
			if (playlist.currentEntry.regions[regionIndex].content.type == 'image') {
				chrome.runtime.sendMessage({
					"action": "queueInstruction",
					"args": {
						"command": "drawImage",
						"elementID": regionID,
						"contentID": contentID,
						"x": region.x,
						"y": region.y,
						"width": region.width,
						"height": region.height,
						"z-index": region['z-index']
					}
				});
			} else if (playlist.currentEntry.regions[regionIndex].content.type == 'video') {
				var loop = playlist.currentEntry.regions[regionIndex].content.loop;
				var playOnce = playlist.currentEntry.regions[regionIndex].content.playOnce;
				chrome.runtime.sendMessage({
					"action": "queueInstruction",
					"args": {
						"command": "playVideo",
						"elementID": regionID,
						"contentID": contentID,
						"loop": loop,
						"playOnce": playOnce,
						"x": region.x,
						"y": region.y,
						"width": region.width,
						"height": region.height,
						"z-index": region['z-index']
					}
				});
			}
		}

		// If there is only one entry in this playlist, stop here.
		if (playlist.entries.length == 1) {
			// Indicate there is an idle playlist so layout change doesn't wait for a callback...
			_root.idlePlaylists++;
			return;
		}

		// If the current entry has endTime of "auto"...
		if (playlist.currentEntry.endTime == 'auto') {
			// Fail-safe
			if (playlist.currentEntry.playOnceContentCount == 0) {
				console.error('Cannot have entry endTime of "auto" without at least one "playOnce" content!');
				return;
			}
			// Don't bother figuring out what to do until the "playOnce" content has completed
			return;
		}

		// If the current entry ends during or after the upcoming layout change...
		if (playlist.currentEntry.startTime <= _root.nextLayoutChangeTime && playlist.currentEntry.endTime >= _root.nextLayoutChangeTime) {
			// ... then we should queue the callback to the layout change function!

			// The delay until the layout change takes place
			var beforeDelay = _root.nextLayoutChangeTime - playlist.timer;
			playlist.timer = _root.nextLayoutChangeTime;

			// The delay after the layout change takes place until the next entry starts
			var afterDelay = playlist.currentEntry.endTime - _root.nextLayoutChangeTime;

			// Add callback after delay
			setTimeout(function() {
				layoutPlaylistQueueCallback(function() {
					// The callback
					setTimeout(function() {
						playlist.timer = playlist.currentEntry.endTime;
						playlist.currentEntryIndex++;
						if (playlist.currentEntryIndex >= playlist.entries.length) {
							playlist.currentEntryIndex = 0;
							playlist.timer = 0;
						}
						playlist.currentEntry = playlist.entries[playlist.currentEntryIndex];

						playlistStep(playlist);
					}, afterDelay);
				});
			}, beforeDelay);

		// Otherwise just set up the next entry
		} else {
			// Delay should be set to the next keyframe
			var delay = playlist.currentEntry.endTime - playlist.timer;
			setTimeout(function() {
				playlist.timer = playlist.currentEntry.endTime;
				playlist.currentEntryIndex++;
				if (playlist.currentEntryIndex >= playlist.entries.length) {
					playlist.currentEntryIndex = 0;
					playlist.timer = 0;
				}
				playlist.currentEntry = playlist.entries[playlist.currentEntryIndex];

				playlistStep(playlist);
			}, delay);
		}
	}

	var startPlaylist = function(playlist) {
		playlist.timer = 0;
		playlist.currentEntryIndex = 0;
		playlist.currentEntry = playlist.entries[playlist.currentEntryIndex];

		playlistStep(playlist);
	}

	var startPlayer = function() {
		initializeGlobalVariables();

		// Get the current scheduled playlist
		var currentDate = new Date();
		var currentDayOfWeek = currentDate.getDay();
		var currentTime = ('0'+currentDate.getHours()).slice(-2) + ':' + ('0'+currentDate.getMinutes()).slice(-2);
		for (var i = 0; i < _root.schedule.length; i++) {
			if (currentDayOfWeek >= _root.schedule[i].startTime.dayOfWeek && currentDayOfWeek <= _root.schedule[i].endTime.dayOfWeek) {
				_root.currentSchedule = _root.schedule[i];
			// Check if schedule timeslot wraps around the weekend... (eg. Saturday-Monday 6-1)
			} else if (currentDayOfWeek + 7 >= _root.schedule[i].startTime.dayOfWeek && currentDayOfWeek + 7 <= _root.schedule[i].endTime.dayOfWeek + 7) {
				_root.currentSchedule = _root.schedule[i];
			// If there is only one scheduled playlist, always set it as current!
			} else if (_root.schedule.length == 1) {
				_root.currentSchedule = _root.schedule[i];
			}
		}
		if (!_root.currentSchedule) {
			console.error('Invalid schedule!');
			return;
		}

		// Process the playlist
		_root.currentLayoutPlaylistIndex = 0;
		_root.currentLayoutEntry = _root.currentSchedule.layoutPlaylist[_root.currentLayoutPlaylistIndex];
		_root.currentLayout = _root.layouts[_root.currentLayoutEntry.layoutID];
		_root.nextLayoutChangeTime = -1; // Default for no next layout change
		// Only queue layout change callbacks if there are at least two layouts to switch between!
		if (_root.currentSchedule.layoutPlaylist.length > 1) {
			_root.nextLayoutChangeTime = _root.currentLayoutEntry.endTime;
		}
		_root.idlePlaylists = 0;
		_root.nextLayoutChangeCallbacks = [];

		for (var playlistIndex = 0; playlistIndex < _root.currentSchedule.playlists.length; playlistIndex++) {
			var playlist = _root.currentSchedule.playlists[playlistIndex];

			// Fork an independent process for each playlist
			startPlaylist(playlist);
		}
	};

	// Prevent duplicate function calls when we restart the player!
	clearAllTimeouts();

	startPlayer();
})();