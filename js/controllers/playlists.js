$(document).ready(function() {
	var session = {};
	session.layouts = null;
	session.current_playlist = null;
	session.timelinePosition = 1; // In 10ths of a second (centisecond?)
	session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 }; // Multi-selection

	// Fetch more layouts!
	var fetchMoreLayouts = function() {
		if (!session.layouts_list) session.layouts_list = [];
		$.ajax({
			url: path + 'controllers/layouts.php',
			method: 'POST',
			data: {
				'request': 'getLayouts',
				'payload': {
					'offset': 0,
					'results_per_page': 100
				}
			},
			dataType: 'json'
		}).success(function(response) {
			if (response && response.result && response.result == 'success') {
				// SUCCESS!
				$('.layout-list').html('');
				for (var i = 0; i < response.layouts.length; i++) {
					$('.layout-list').append('<div class="layout-item">' + response.layouts[i].layout_name + '</div>');
				}
			} else {
				// FAIL!
			}
		}).error(function(e) {
			// Whoops, that wasn't supposed to happen...
		});
	};

	// Main Navigation
	$('.button-list.playlists-main .button.new-playlist').click(function() {
		$('body > .wrapper').hide();
		$('.top-navigation').hide();
		$('.gui').show();
		session.current_playlist = {};

		if (!session.layouts_list) session.layouts_list = [];
		// Get layouts from server if we haven't already
		if (session.layouts_list.length == 0) {
			fetchMoreLayouts();
		}
	});

	// Runs on mousedown / mousemove events
	var mouseAction = function(e) {
		if (e && window.$dragTarget && window.$dragTarget.hasClass('col-resize') && window.resizeSegment) {
			// Segment resizing
			var nextSegment = $();
			if (!window.resizeSegment.next().hasClass('layer-padding')) {
				nextSegment = window.resizeSegment.next();
			}
			var delta = dragStartPosition.left - e.pageX;
			delta = Math.round(delta / 10) * 10;
			if (delta > window.resizeSegmentOriginalWidth - 10) {
				delta = window.resizeSegmentOriginalWidth - 10;
			} else if (nextSegment.length && delta < -window.nextSegmentOriginalWidth + 10) {
				delta = -window.nextSegmentOriginalWidth + 10;
			}
			window.resizeSegment.css('width', Math.round((window.resizeSegmentOriginalWidth - delta) / 10) * 10);
			if (nextSegment.length) {
				nextSegment.css('width', Math.round((nextSegmentOriginalWidth + delta) / 10) * 10);
			} else {
				var layerWidth = Math.round((window.layerOriginalWidth - delta) / 10) * 10;
				$('.playlist-layer-padding').css('width', layerWidth + 1);
				var newDelta = delta;
				$('.layer-padding').prev().each(function() {
					if (!$(this).is(window.resizeSegment)) {
						var width = Math.round(($(this).data('original-width') - delta) / 10) * 10;
						if (width < 10) {
							$(this).css('width', 10);
							newDelta = delta + width - 10;
						} else {
							$(this).css('width', width);
						}
					}
				});
				if (newDelta != delta) {
					$('.layer-padding').prev().each(function() {
						if (!$(this).is(window.resizeSegment)) {
							var width = Math.round(($(this).data('original-width') - newDelta) / 10) * 10;
							$(this).css('width', width);
						}
					});
					window.resizeSegment.css('width', Math.round((window.resizeSegmentOriginalWidth - newDelta) / 10) * 10);
					var layerWidth = Math.round((window.layerOriginalWidth - newDelta) / 10) * 10;
					$('.playlist-layer-padding').css('width', layerWidth + 1);
				}
			}
		} else if (e && window.$dragTarget && window.$dragTarget.is($('.ruler'))) {
			// Highlight segment
			var left = Math.min(dragStartPosition.left, e.pageX);
			var right = Math.max(dragStartPosition.left, e.pageX);
			var x = left - 7;
			if (dragStartPosition.left % 10 >= 1 && dragStartPosition.left % 10 <= 4) {
				x += 5;
				dragStartPosition.left += 5;
			}
			x = Math.floor((x + 5) / 10) * 10;
			if (x < 150) x = 150;
			if (x >= Math.floor(($(window).width() - 11) / 10) * 10) x = Math.floor(($(window).width() - 11) / 10) * 10;
			$('.segment-marker').show().css('left', x);
			var x2 = right;
			x2 = Math.floor((x2 + 5) / 10) * 10;
			if (x2 < 150) x2 = 150;
			if (x2 >= Math.floor(($(window).width() - 11) / 10) * 10) x2 = Math.floor(($(window).width() - 11) / 10) * 10;
			if (x == x2) x2 += 10;
			$('.segment-marker').css('width', x2 - x + 1);
			$('.segment-marker').css('top', 28);
			$('.segment-marker').css('height', $('.layer-timeline-body').height() + 1);
			var timelineOffset = Math.round($('.layer-timeline').prop('scrollLeft') / 10);
			session.selectedSegment.timeStart = ((x - 150) / 10) + timelineOffset;
			session.selectedSegment.timeEnd = ((x2 - 150) / 10) + timelineOffset;
			session.selectedSegment.layerStart = 0;
			session.selectedSegment.layerEnd = $('.layer-timeline-body .layer').length + $('.layer-timeline-body .playlist-layer').length;

			// Update timeline marker position
			var timelineOffset = Math.round($('.layer-timeline').prop('scrollLeft') / 10);
			var x;
			if (dragStartPosition.left < e.pageX) x = 150 + (session.selectedSegment.timeEnd * 10) - 7;
			else x = 150 + ((session.selectedSegment.timeStart + 1) * 10) - 7;
			x -= timelineOffset * 10;
			x = Math.floor((x + 5) / 10) * 10;
			if (x < 150) x = 150;
			if (x >= Math.floor(($(window).width() - 11) / 10) * 10) x = Math.floor(($(window).width() - 11) / 10) * 10;
			$('.timeline-marker').show().css('left', x);
			session.timelinePosition = timelineOffset + Math.round((x - 150) / 10);

		} else if (e && window.$dragTarget && window.$dragTarget.is($('.layer-timeline'))) {
			// Highlight segment
			var left = Math.min(dragStartPosition.left, e.pageX);
			var right = Math.max(dragStartPosition.left, e.pageX);
			var top = Math.min(dragStartPosition.top, e.pageY);
			var bottom = Math.max(dragStartPosition.top, e.pageY);
			var x = left - 7;
			if (dragStartPosition.left % 10 >= 1 && dragStartPosition.left % 10 <= 4) {
				x += 5;
				dragStartPosition.left += 5;
			}
			x = Math.floor((x + 5) / 10) * 10;
			if (x < 150) x = 150;
			if (x >= Math.floor(($(window).width() - 11) / 10) * 10) x = Math.floor(($(window).width() - 11) / 10) * 10;
			$('.segment-marker').show().css('left', x);
			var timelineOffset = Math.round($('.layer-timeline').prop('scrollLeft') / 10);
			session.timelinePosition = timelineOffset + Math.round((x - 150) / 10);
			var y = 28 + (Math.floor((top - 28) / 19) * 19);
			var maxY = $('.layer-timeline .layer').last().offset().top - 1;
			if (y < 28) y = 28;
			else if (y > maxY) y = maxY;
			$('.segment-marker').css('top', y);
			var x2 = right;
			x2 = Math.floor((x2 + 5) / 10) * 10;
			if (x2 < 150) x2 = 150;
			if (x2 >= Math.floor(($(window).width() - 11) / 10) * 10) x2 = Math.floor(($(window).width() - 11) / 10) * 10;
			if (x == x2) x2 += 10;
			$('.segment-marker').css('width', x2 - x + 1);
			var y2 = 28 + (Math.floor((bottom - 28) / 19) * 19);
			var maxY2 = $('.layer-timeline .layer').last().offset().top - 1;
			if (y2 < 28) y2 = 28;
			else if (y2 > maxY2) y2 = maxY2;
			y2 += 19;
			$('.segment-marker').css('height', y2 - y + 1);
			var timelineOffset = Math.round($('.layer-timeline').prop('scrollLeft') / 10);
			session.selectedSegment.timeStart = ((x - 150) / 10) + timelineOffset;
			session.selectedSegment.timeEnd = ((x2 - 150) / 10) + timelineOffset;
			session.selectedSegment.layerStart = (y - 28) / 19;
			session.selectedSegment.layerEnd = (y2 - 28) / 19;

			// Update timeline marker position
			var timelineOffset = Math.round($('.layer-timeline').prop('scrollLeft') / 10);
			var x;
			if (dragStartPosition.left < e.pageX) x = 150 + (session.selectedSegment.timeEnd * 10) - 7;
			else x = 150 + ((session.selectedSegment.timeStart + 1) * 10) - 7;
			x -= timelineOffset * 10;
			x = Math.floor((x + 5) / 10) * 10;
			if (x < 150) x = 150;
			if (x >= Math.floor(($(window).width() - 11) / 10) * 10) x = Math.floor(($(window).width() - 11) / 10) * 10;
			$('.timeline-marker').show().css('left', x);
			session.timelinePosition = timelineOffset + Math.round((x - 150) / 10);
		}
	}

	// Get layer by index
	var getLayerByIndex = function(index) {
		if (index == 0) return $('.layer-layout');
		var current_index = 0;
		var num_playlists = $('.layer-timeline-body .playlist-layer').length;
		for (var i = 0; i < num_playlists; i++) {
			current_index++;
			if (current_index == index) return $();
			var num_layers = $('.playlist-layer').eq(i).find('.layer').length;
			for (var j = 0; j < num_layers; j++) {
				current_index++;
				if (current_index == index) {
					return $('.playlist-layer').eq(i).find('.layer').eq(j);
				}
			}
		}
		return $();
	}

	var getLayerIndex = function($layer) {
		if ($layer.is($('.layer-layout'))) return 0;
		var current_index = 0;
		var num_playlists = $('.layer-timeline-body .playlist-layer').length;
		for (var i = 0; i < num_playlists; i++) {
			current_index++;
			var num_layers = $('.playlist-layer').eq(i).find('.layer').length;
			for (var j = 0; j < num_layers; j++) {
				current_index++;
				if ($layer.is($('.playlist-layer').eq(i).find('.layer').eq(j))) {
					return current_index;
				}
			}
		}
		return null;
	}

	// Select segment / drag
	// Note: listen to event on "body" to avoid listening to event on scrollbar
	$('.layer-timeline-body').mousedown(function(e) {
		if (e.which == 1) {
			window.$dragTarget = $('.layer-timeline');
			window.dragStartPosition = { "top": e.pageY, "left": e.pageX };
			window.timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
			mouseAction(e);
			// Hide properties pane
			$('.properties-pane .buttons').hide();
			$('.properties-pane .information').hide();
		}
	});

	// Ruler drag
	$('.ruler').mousedown(function(e) {
		if (e.which == 1) {
			window.$dragTarget = $('.ruler');
			window.dragStartPosition = { "top": e.pageY, "left": e.pageX };
			window.timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
			mouseAction(e);
			// Hide properties pane
			$('.properties-pane .buttons').hide();
			$('.properties-pane .information').hide();
		}
	});

	// Resize drag
	$('.col-resize').mousedown(function(e) {
		if (e.which == 1) {
			window.$dragTarget = $(this);
			window.dragStartPosition = { "top": e.pageY, "left": e.pageX };
			window.timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
			window.resizeSegment = $(this).parent().parent();
			window.nextSegment = $(this).parent().parent().next();
			window.resizeSegmentOriginalWidth = window.resizeSegment.width();
			window.nextSegmentOriginalWidth = window.nextSegment.width();
			window.layerOriginalWidth = $('.playlist-layer-padding').width();
			$('.layer-padding').prev().each(function() {
				$(this).data('original-width', $(this).width());
			});
			mouseAction(e);
			// Make resizing visible
			$(this).addClass('active');
			// Force cursor to change
			$('html, body').addClass('col-resize-cursor');
			// Don't allow event to bubble underneath the resize element
			e.stopPropagation();
			// Deselect everything
			session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
			$('.segment-marker').hide();
			$('.properties-pane .buttons').hide();
			$('.modal-overlay, .modal').hide();
		}
	});
	$(document).mouseup(function(e) {
		// Update properties pane
		if (window.$dragTarget && window.$dragTarget.hasClass('col-resize')) {
			// Hide resizing
			window.$dragTarget.removeClass('active');
			// Revert cursor change
			$('html, body').removeClass('col-resize-cursor');
		} else if (window.$dragTarget) {
			$('.properties-pane .buttons').show();
			$('.properties-pane .information').show();
			$('.properties-pane .buttons button').show();
			$('.properties-pane .selection-duration').hide();
			$('.properties-pane .entry-duration').hide();
			$('.properties-pane .extend-timeline').hide();
			$('.properties-pane .add-content').hide();
			$('.properties-pane .change-content').hide();
			$('.properties-pane .remove-content').hide();

			var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');

			// If single selection...
			if (session.selectedSegment.timeEnd - session.selectedSegment.timeStart == 1 && session.selectedSegment.layerEnd - session.selectedSegment.layerStart == 1) {
				$('.properties-pane .delete-frames').hide();
				$('.properties-pane .delete-keyframe').hide();
				$('.properties-pane .delete-keyframes').hide();
				// If keyframe selected
				getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment-empty, .layer-segment-keyframe').each(function() {
					if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) == session.selectedSegment.timeStart) {
						$('.properties-pane .insert-keyframe').hide();
						// If keyframe is not first keyframe in layer
						if ($(this).prev().length) {
							$('.properties-pane .delete-keyframe').show();
						}
						// Display duration of currently selected entry
						$('.properties-pane .entry-duration').show().find('.duration').text(Math.round($(this).width() / 10));

						// If keyframe is empty
						if ($(this).hasClass('layer-segment-empty')) {
							$('.properties-pane .add-content').show();
						} else {
						// If keyframe is not empty
							$('.properties-pane .change-content').show();
							$('.properties-pane .remove-content').show();
						}
					}
				});
				// If selection is beyond the tail segment
				if (session.selectedSegment.timeEnd > Math.round($('.playlist-layer-padding').first().width() / 10)) {
					$('.properties-pane .extend-timeline').show();
				}
			} else {
			// If multi-selection
				$('.properties-pane .insert-keyframe').hide();
				$('.properties-pane .delete-keyframe').hide();
				$('.properties-pane .delete-frame').hide();
				// If multi-column
				if (session.selectedSegment.timeEnd - session.selectedSegment.timeStart > 1) {
					$('.properties-pane .insert-frame').hide();
					// Display duration of current selection
					$('.properties-pane .selection-duration').show().find('.duration').text(((session.selectedSegment.timeEnd - session.selectedSegment.timeStart) / 10));
				} else {
				// If only one column is selected
					// And selection is beyond the tail segment
					if (session.selectedSegment.timeEnd > Math.round($('.playlist-layer-padding').first().width() / 10)) {
						$('.properties-pane .extend-timeline').show();
					}
				}
				// If at least one keyframe(s) selected
				$('.properties-pane .delete-keyframes').hide();
				$('.layer-timeline-body .layer').each(function() {
					if (getLayerIndex($(this)) >= session.selectedSegment.layerStart && getLayerIndex($(this)) < session.selectedSegment.layerEnd) {
						$(this).find('.layer-segment-empty, .layer-segment-keyframe').each(function() {
							if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) >= session.selectedSegment.timeStart && Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) < session.selectedSegment.timeEnd) {
								if ($(this).prev().length) {
									$('.properties-pane .delete-keyframes').show();
									// If keyframe is not positioned at left-bound of selection or is length of 0.1s
									if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) > session.selectedSegment.timeStart || Math.round($(this).width() / 10) == 1) {
										$('.properties-pane .delete-frames').hide();
									}
								}
							}
						});
					}
				});
			}
			// If only one layer selected
			if (session.selectedSegment.layerEnd - session.selectedSegment.layerStart == 1) {
				// If this layer is a playlist layer
				if (getLayerByIndex(session.selectedSegment.layerStart).length == 0) {
					// Hide all buttons
					$('.properties-pane .buttons button').hide();
				}
			}
			// If all selected segments are tail segments (or selected segments are 0.1s length)
			var allTailSegments = true;
			for (var i = session.selectedSegment.layerStart; i < session.selectedSegment.layerEnd; i++) {
				var layer = getLayerByIndex(i);
				if (layer.length) {
					// If keyframe selected and segment is only 0.1s length
					var segmentIsStub = false;
					layer.find('.layer-segment-empty, .layer-segment-keyframe').each(function() {
						if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) == session.selectedSegment.timeStart) {
							if (Math.round($(this).width() / 10) == 1) {
								segmentIsStub = true;
							}
						}
					});
					var tailSegment = layer.find('.layer-padding').prev();
					if (Math.round((tailSegment.offset().left + timelineScrollLeft - 150) / 10) > session.selectedSegment.timeStart && !segmentIsStub) {
						allTailSegments = false;
					}
				}
			}
			if (allTailSegments) {
				$('.properties-pane .delete-frame').hide();
				// If some layers were not selected
				if (session.selectedSegment.layerEnd - session.selectedSegment.layerStart < $('.playlist-layer').length + $('.playlist-layer .layer').length) {
					$('.properties-pane .delete-frames').hide();
				}
			}
			// If selection is beyond the tail segment
			if (session.selectedSegment.timeEnd > Math.round($('.playlist-layer-padding').first().width() / 10)) {
				$('.properties-pane .insert-frame').hide();
				$('.properties-pane .delete-frame').hide();
				$('.properties-pane .delete-frames').hide();
			}
		}
		window.$dragTarget = null;
	});
	$(document).mousemove(function(e) {
		mouseAction(e);
	});

	// Timeline scroll actions
	$('.layer-timeline').scroll(function(e) {
		// If dragging, prevent scrolling!
		if (window.$dragTarget) {
			$('.layer-timeline').prop('scrollLeft', window.timelineScrollLeft);
			return;
		}

		// Snap the timeline scroll to the nearest segment
		var snapToTick = Math.round($('.layer-timeline').prop('scrollLeft') / 10) * 10;
		if (snapToTick > $('.layer-timeline').prop('scrollWidth') - $('.layer-timeline').innerWidth()) {
			snapToTick -= 10;
		}
		$('.layer-timeline').prop('scrollLeft', snapToTick);

		// Ticks need to line up
		var backgroundOffset = -(snapToTick % 50);
		$('.layer-timeline, .timeline-ticks').css('background-position', backgroundOffset + 'px 0');
		var labelOffset = 200 - (snapToTick % 100);
		var timelineFirstLabel = Math.ceil(snapToTick / 100);
		if (labelOffset >= 200) labelOffset = 100;
		$('.timeline-label-wrapper').css('margin-left', labelOffset);
		$('.timeline-label').each(function() {
			$(this).text(($(this).index() + timelineFirstLabel) + 's');
		});

		// Update timeline marker position
		var timelineOffset = Math.round(snapToTick / 10);
		var x = 150 + ((session.timelinePosition - timelineOffset) * 10);
		if (x >= 150) {
			$('.timeline-marker').show().css('left', x);
		} else {
			$('.timeline-marker').hide();
		}

		// Update segment marker position
		var timelineOffset = Math.round($('.layer-timeline').prop('scrollLeft') / 10);
		var top = 28 + (session.selectedSegment.layerStart * 19);
		var left = 150 + (session.selectedSegment.timeStart * 10) - (timelineOffset * 10);
		var height = ((session.selectedSegment.layerEnd - session.selectedSegment.layerStart) * 19) + 1;
		var width = ((session.selectedSegment.timeEnd - session.selectedSegment.timeStart) * 10) + 1;
		if (left < 150) {
			width -= 150 - left;
			left = 150;
		}
		if (top < 28) {
			height -= 28 - top;
			top = 28;
		}
		if (width < 10 || height < 19) {
			$('.segment-marker').hide();
		} else {
			$('.segment-marker').show().css('top', top);
			$('.segment-marker').css('left', left);
			$('.segment-marker').css('height', height);
			$('.segment-marker').css('width', width);
		}
	});

	// Select layer
	$('.layer-label, .layout-label').click(function(e) {
		$('.layer-label, .layout-label').removeClass('selected');
		$(this).addClass('selected');

		// Highlight segment
		var index;
		if ($(this).is($('.layout-label'))) {
			index = 0;
		} else {
			index = $(this).index() + 1; // +1 to skip layout (playlist layer is already included in index())
			// Increment for each playlist above as well as for each layer in those playlists
			for (var i = 0; i < $(this).closest('.playlist').index() - 1; i++) {
				index += $('.layer-labels .playlist').eq(i).find('.layer-label').length + 1;
			}
		}
		var y = 28 + (index * 19);
		$('.segment-marker').show().css('top', y);
		$('.segment-marker').css('left', 150);
		$('.segment-marker').css('height', 20);
		$('.segment-marker').css('width', $('.layer-timeline').prop('scrollWidth') * 2);
		session.selectedSegment.timeStart = 0;
		session.selectedSegment.timeEnd = Math.round($('.layer-timeline').prop('scrollWidth') * 2 / 19);
		session.selectedSegment.layerStart = (y - 28) / 19;
		session.selectedSegment.layerEnd = session.selectedSegment.layerStart + 1;
	});

	// Layer Settings
	$('.layer-label-settings').click(function(e) {
		// Prevent click propagation to label
		e.stopPropagation();
	});

	// New Playlist
	$('.gui .new-playlist').click(function(e) {
		if ($('.layer-labels .selected').is($('.layout-label'))) {
			$('.playlist').first().before('<div class="playlist"><div class="playlist-label"><div class="playlist-icon"></div><div class="playlist-label-text">New Playlist</div></div><div class="layer-label"><div class="layer-label-settings"></div><div class="layer-label-text">New Layer</div><div class="layer-label-tag" style="background-color: #89bafe;"></div></div></div>');
			$('.playlist-layer').first().before('<div class="playlist-layer"><div class="playlist-layer-padding" style="width: 1001px;"></div><div class="layer"><div class="layer-segment-wrapper"><div class="layer-segment-empty" style="width: ' + ($('.playlist-layer-padding').first().width() - 1) + 'px;"><div class="layer-segment-head"></div><div class="layer-segment-tail"><div class="col-resize"></div></div></div><div class="layer-padding" style="width: 500px;"></div></div></div></div>');
		} else {
			var playlistBefore = $('.layer-labels .selected').closest('.playlist');
			playlistBefore.after('<div class="playlist"><div class="playlist-label"><div class="playlist-icon"></div><div class="playlist-label-text">New Playlist</div></div><div class="layer-label"><div class="layer-label-settings"></div><div class="layer-label-text">New Layer</div><div class="layer-label-tag" style="background-color: #89bafe;"></div></div></div>');
			$('.playlist-layer').eq(playlistBefore.index() - 1).after('<div class="playlist-layer"><div class="playlist-layer-padding" style="width: 1001px;"></div><div class="layer"><div class="layer-segment-wrapper"><div class="layer-segment-empty" style="width: ' + ($('.playlist-layer-padding').first().width() - 1) + 'px;"><div class="layer-segment-head"></div><div class="layer-segment-tail"><div class="col-resize"></div></div></div><div class="layer-padding" style="width: 500px;"></div></div></div></div>');
		}
		$('.timeline-marker-line').css('height', $('.timeline-marker-line').height() + 38);
	});

	// New Layer
	$('.new-layer').click(function(e) {
		if ($('.layer-labels .selected').is($('.layout-label'))) {
			$('.playlist').first().append('<div class="layer-label"><div class="layer-label-settings"></div><div class="layer-label-text">New Layer</div><div class="layer-label-tag" style="background-color: #89bafe;"></div></div>');
			$('.playlist-layer').first().append('<div class="layer"><div class="layer-segment-wrapper"><div class="layer-segment-empty" style="width: ' + ($('.playlist-layer-padding').first().width() - 1) + 'px;"><div class="layer-segment-head"></div><div class="layer-segment-tail"><div class="col-resize"></div></div></div><div class="layer-padding" style="width: 500px;"></div></div></div>');
		} else {
			var playlist = $('.layer-labels .selected').closest('.playlist');
			playlist.append('<div class="layer-label"><div class="layer-label-settings"></div><div class="layer-label-text">New Layer</div><div class="layer-label-tag" style="background-color: #89bafe;"></div></div>');
			$('.playlist-layer').eq(playlist.index() - 1).append('<div class="layer"><div class="layer-segment-wrapper"><div class="layer-segment-empty" style="width: ' + ($('.playlist-layer-padding').first().width() - 1) + 'px;"><div class="layer-segment-head"></div><div class="layer-segment-tail"><div class="col-resize"></div></div></div><div class="layer-padding" style="width: 500px;"></div></div></div>');
		}
		$('.timeline-marker-line').css('height', $('.timeline-marker-line').height() + 19);
	});

	// Properties Pane
	$('.properties-pane .collapse').click(function(e) {
		$(this).hide();
		$('.properties-pane-body').css('pointer-events', 'none');
		$('.properties-pane .expand').show();
		$('.properties-pane-body').slideUp();
	});
	$('.properties-pane .expand').click(function(e) {
		$(this).hide();
		$('.properties-pane-body').css('pointer-events', 'auto');
		$('.properties-pane .collapse').show();
		$('.properties-pane-body').slideDown();
	});
	// Add Content
	$('.add-content').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment-empty').each(function() {
			if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
				$(this).addClass('layer-segment-keyframe').removeClass('layer-segment-empty');
			}
		});
		$('.add-content').hide();
		$('.change-content').show();
		$('.remove-content').show();
	});
	// Change Content
	$('.change-content').click(function(e) {
		// Doesn't actually do anything.
		console.log('Change content is not implemented.');
	});
	// Remove Content
	$('.remove-content').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment-keyframe').each(function() {
			if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
				$(this).removeClass('layer-segment-keyframe').addClass('layer-segment-empty');
			}
		});
		$('.add-content').show();
		$('.change-content').hide();
		$('.remove-content').hide();
	});
	// Insert Keyframe
	$('.insert-keyframe').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		// Extend timeline if required
		var insertionWidth = (session.selectedSegment.timeEnd - Math.round($('.playlist-layer-padding').first().width() / 10)) * 10;
		if (insertionWidth > 0) {
			$('.layer-padding').prev().each(function() {
				$(this).css('width', $(this).width() + insertionWidth + 1);
			});
			// Extend the playlist layer padding
			$('.playlist-layer-padding').each(function() {
				$(this).css('width', $(this).width() + insertionWidth);
			});
		}
		getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment-empty, .layer-segment-keyframe').each(function() {
			if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
				var newSegmentSize = $(this).width() - ((session.selectedSegment.timeStart - Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10)) * 10) + 1;
				$(this).css('width', $(this).width() - newSegmentSize + 1);
				$(this).after('<div class="layer-segment-empty" style="width: ' + newSegmentSize + 'px;"><div class="layer-segment-head"></div><div class="layer-segment-tail"><div class="col-resize"></div></div></div>');
				session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
				$('.segment-marker').hide();
				$('.properties-pane .buttons').hide();
			}
		});
	});
	// Delete Keyframe
	$('.delete-keyframe').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment-empty, .layer-segment-keyframe').each(function() {
			if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
				if ($(this).prev().length) {
					$(this).prev().css('width', $(this).prev().width() + $(this).width() + 2);
					$(this).remove();
					session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
					$('.segment-marker').hide();
					$('.properties-pane .buttons').hide();
				}
			}
		});
	});
	// Delete Keyframes
	$('.delete-keyframes').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		$('.layer-timeline-body .layer').each(function() {
			if (getLayerIndex($(this)) >= session.selectedSegment.layerStart && getLayerIndex($(this)) < session.selectedSegment.layerEnd) {
				$(this).find('.layer-segment-empty, .layer-segment-keyframe').each(function() {
					if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) >= session.selectedSegment.timeStart && Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) < session.selectedSegment.timeEnd) {
						if ($(this).prev().length) {
							$(this).prev().css('width', $(this).prev().width() + $(this).width() + 2);
							$(this).remove();
						}
					}
				});
			}
		});
		session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
		$('.segment-marker').hide();
		$('.properties-pane .buttons').hide();
	});
	// Delete Frame
	$('.delete-frame').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment-empty, .layer-segment-keyframe').each(function() {
			if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
				if ($(this).width() > 11) {
					$(this).css('width', $(this).width() - 9);
					if ($(this).next().next().length) {
						$(this).next().css('width', $(this).next().width() + 11);
					} else {
						$(this).after('<div class="layer-segment-empty" style="width: 10px;"><div class="layer-segment-head"></div><div class="layer-segment-tail"><div class="col-resize"></div></div></div>');
					}
					session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
					$('.segment-marker').hide();
					$('.properties-pane .buttons').hide();
				}
			}
		});
	});
	// Delete Frames
	$('.delete-frames').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		var deletionWidth = ((session.selectedSegment.timeEnd - session.selectedSegment.timeStart) * 10) - 1;
		$('.layer-timeline-body .layer').each(function() {
			if (getLayerIndex($(this)) >= session.selectedSegment.layerStart && getLayerIndex($(this)) < session.selectedSegment.layerEnd) {
				// IMPORTANT: Looping through in REVERSE order so that deletion does not affect subsequent positional detection
				$($(this).find('.layer-segment-empty, .layer-segment-keyframe').get().reverse()).each(function() {
					if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
						if ($(this).width() > 11) {
							// If some layers were not selected
							if (session.selectedSegment.layerEnd - session.selectedSegment.layerStart < $('.playlist-layer').length + $('.playlist-layer .layer').length) {
								// If not the tail segment
								if ($(this).next().next().length) {
									// Perform deletion
									$(this).css('width', $(this).width() - deletionWidth);
									// Extend the next segment
									$(this).next().css('width', $(this).next().width() + deletionWidth + 2);
								}
							} else {
							// If all layers were selected, just delete
								$(this).css('width', $(this).width() - deletionWidth);
							}
						}
					}
				});
			}
		});
		// If all layers were selected
		if (session.selectedSegment.layerEnd - session.selectedSegment.layerStart >= $('.playlist-layer').length + $('.playlist-layer .layer').length) {
			$('.playlist-layer-padding').each(function() {
				$(this).css('width', $(this).width() - deletionWidth - 1);
			});
		}
		session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
		$('.segment-marker').hide();
		$('.properties-pane .buttons').hide();
	});
	// Insert Frame(s)
	$('.insert-frame').click(function(e) {
		$('.modal-overlay, .insert-frame-modal').show();
	});
	$('.insert-frame-amount').change(function() {
		if (parseInt($(this).val()) < 1 || isNaN(parseInt($(this).val()))) {
			$(this).val(1);
		}
		if (parseInt($(this).val()) > 1000) {
			$(this).val(1000);
		}
		$('.insert-frame-seconds').val(parseInt($(this).val()) / 10);
	});
	$('.insert-frame-seconds').change(function() {
		if (parseFloat($(this).val()) < 0.1 || isNaN(parseFloat($(this).val()))) {
			$(this).val(0.1);
		}
		if (parseFloat($(this).val()) > 100) {
			$(this).val(100);
		}
		$(this).val(Math.round($(this).val() * 10) / 10);
		$('.insert-frame-amount').val(parseFloat($(this).val()) * 10);
	});
	$('.insert-frame-modal .ok-button').click(function() {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		var insertionWidth = $('.insert-frame-amount').val() * 10;
		$('.layer-timeline-body .layer').each(function() {
			// If this layer was selected, extend the selected segment
			if (getLayerIndex($(this)) >= session.selectedSegment.layerStart && getLayerIndex($(this)) < session.selectedSegment.layerEnd) {
				var segmentFound = false;
				$(this).find('.layer-segment-empty, .layer-segment-keyframe').each(function() {
					if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
						$(this).css('width', $(this).width() + insertionWidth + 1);
						segmentFound = true;
					}
				});
			} else {
			// If this layer was NOT selected, extend the tail segment
				var $tailSegment = $(this).find('.layer-padding').prev();
				$tailSegment.css('width', $tailSegment.width() + insertionWidth + 1);
			}
		});
		// Extend the playlist layer padding
		$('.playlist-layer-padding').each(function() {
			$(this).css('width', $(this).width() + insertionWidth);
		});
		session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
		$('.segment-marker').hide();
		$('.properties-pane .buttons').hide();
		$('.modal-overlay, .modal').hide();
	});
	$('.cancel-button').click(function() {
		$('.modal-overlay, .modal').hide();
	});
	// Extend Timeline
	$('.extend-timeline').click(function() {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		var insertionWidth = (session.selectedSegment.timeEnd - Math.round($('.playlist-layer-padding').first().width() / 10)) * 10;
		$('.layer-padding').prev().each(function() {
			$(this).css('width', $(this).width() + insertionWidth + 1);
		});
		// Extend the playlist layer padding
		$('.playlist-layer-padding').each(function() {
			$(this).css('width', $(this).width() + insertionWidth);
		});
		session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
		$('.segment-marker').hide();
		$('.properties-pane .buttons').hide();
		$('.modal-overlay, .modal').hide();
	});
});