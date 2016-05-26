/* **********************************************************
 *
 *  This is the background script that handles:
 *  - Creation of the launcher and sandbox window instances
 *  - Communication between the launcher and sandbox
 *
 * ********************************************************** */

var pendingJS = [];
var pendingLogs = [];
var pendingInstructions = [];

// Handle communication between launcher and sandbox
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (sender.url.indexOf('sandbox.html') != -1) {
		// If no windows found, tell sandbox to close its window
		if ((chrome.app.window.getAll()).length == 0) {
			sendResponse();
			return;
		}

		// Send javascript to sandbox for execution
		if (request.action == 'fetchNextJavascriptRequest') {
			if (pendingJS.length > 0) {
				var scriptRequests = pendingJS;
				pendingJS = [];
				sendResponse({
					"action": "requestJavascriptExecution",
					"args": scriptRequests
				});
			} else {
				// No javascript to execute; send placeholder response to keep connection alive
				sendResponse({
					"action": "keepAlive"
				});
			}
		// Retrieve log entry from sandbox
		} else if (request.action == 'queueLogEntry') {
			pendingLogs.push(request.args);
		// Retrieve instruction from sandbox
		} else if (request.action == 'queueInstruction') {
			pendingInstructions.push(request.args);
		} else {
			console.error('ERROR: Received unexpected request action "' + request.action + '"');
		}
	} else if (sender.url.indexOf('index.html') != -1) {
		// Retrieve javascript from launcher
		if (request.action == 'queueJavascriptRequest') {
			pendingJS.push(request.args);
		// Send log entry to launcher
		} else if (request.action == 'fetchNextLogEntry') {
			if (pendingLogs.length > 0) {
				var logEntries = pendingLogs;
				pendingLogs = [];
				sendResponse({
					"action": "sendLogEntries",
					"args": logEntries
				});
			} else {
				// No javascript to execute; send placeholder response to keep connection alive
				sendResponse({
					"action": "keepAlive"
				});
			}
		// Send instruction to launcher
		} else if (request.action == 'fetchNextInstruction') {
			if (pendingInstructions.length > 0) {
				var instructions = pendingInstructions;
				pendingInstructions = [];
				sendResponse({
					"action": "sendInstructions",
					"args": instructions
				});
			} else {
				// No javascript to execute; send placeholder response to keep connection alive
				sendResponse({
					"action": "keepAlive"
				});
			}
		} else {
			console.error('ERROR: Received unexpected request action "' + request.action + '"');
		}
	} else {
		console.error('ERROR: Received message from unexpected URL');
	}
});

// When the app is "launched", open the launcher!
chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('index.html', {
		"id": "index.html",
		"state": "fullscreen",
		"outerBounds": {
			"width": window.screen.availWidth,
			"height": window.screen.availHeight
		}
	}, function(launcherWindow) {
		launcherWindow.fullscreen(); // Don't restore last "remembered" screen position... just fullscreen it!

		// Open sandbox window after the launcher, so it won't close itself immediately, thinking that the launcher is closed!
		chrome.app.window.create('sandbox.html', {
			"id": "sandbox.html",
			"hidden": true
		}, function() {
			// No access to window of sandbox
		});
	});
});