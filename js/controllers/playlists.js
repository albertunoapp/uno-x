// Returns current datetime in SQL format
function getCurrentDateTime() {
	var date;
	date = new Date();
	date = date.getUTCFullYear() + '-' +
	('00' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
	('00' + date.getUTCDate()).slice(-2) + ' ' +
	('00' + date.getUTCHours()).slice(-2) + ':' +
	('00' + date.getUTCMinutes()).slice(-2) + ':' +
	('00' + date.getUTCSeconds()).slice(-2);
	return date;
}

// Returns a unique color; if none found, return the least used color
function generateUniqueColor(used_color_list) {
	var colors = [
		'#3cb878', // green
		'#ec008c', // pink
		'#00bff3', // blue
		'#fbaf5d', // orange
		'#8c6239', // brown
		'#bd99d6', // purple
		'#18a2a7' // turquoise
	];
	var colors_count = [];
	var min_color = 0;

	for (var i = 0; i < colors.length; i++) {
		colors_count[i] = 0;
		var unique = true;
		for (var j = 0; j < used_color_list.length; j++) {
			if (used_color_list[j] == colors[i]) {
				colors_count[i]++;
				unique = false;
				break;
			}
		}
		if (unique) {
			return colors[i];
		}
		if (colors_count[i] < colors_count[min_color]) {
			min_color = i;
		}
	}
	return colors[min_color];
}

$(document).ready(function() {
	var constants = {
		'playlist_version': '1.00.00',
		'required_player_version': '1.00.00'
	};
	var session = {};
	session.layouts_list = null;
	session.content_list = null;
	session.current_playlist = null;
	session.timelinePosition = 1; // In seconds
	session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 }; // Multi-selection
	session.divisor = 1;

	// Fetch more layouts! TODO: handle more than 100 layouts
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
					session.layouts_list.push(response.layouts[i]);
					$layout = $('<div class="layout-item" data-id="' + response.layouts[i].z_layoutid_pk + '">' + response.layouts[i].layout_name + '</div>');
					$layout.click(function() {
						$('.modal-overlay, .modal').hide();
						var z_layoutid_pk = $(this).data('id');
						$.ajax({
							url: path + 'controllers/layouts.php',
							method: 'POST',
							data: {
								'request': 'openLayout',
								'payload': {
									'z_layoutid_pk': z_layoutid_pk
								}
							},
							dataType: 'json'
						}).success(function(response) {
							if (response && response.result && response.result == 'success') {
								// SUCCESS!
								session.current_playlist = {};
								session.current_playlist.playlist_version = constants.playlist_version;
								session.current_playlist.required_player_version = constants.required_player_version;
								session.current_playlist.layouts = [];
								session.current_playlist.playlists = [];
								session.current_playlist.layouts.push(response.opened_layout);
								session.divisor = 1;

								// Clear existing content
								$('.layout-canvas').html('');
								$('.select-region select option').not('.disabled').remove();
								$('.layer-timeline-body').html('');
								$('.gui .playlist').remove();

								// Set up preview
								while (response.opened_layout.width / session.divisor > 320 || response.opened_layout.height / session.divisor > 320) {
									session.divisor++;
								}
								$('.layout-canvas').css({
									'width': Math.round(parseInt(response.opened_layout.width) / session.divisor),
									'height': Math.round(parseInt(response.opened_layout.height) / session.divisor)
								});
								var used_colors = [];
								for (var i = 0; i < response.opened_layout.regions.length; i++) {
									$('.select-region select').append('<option value="' + response.opened_layout.regions[i].z_regionid_pk + '">' + response.opened_layout.regions[i].name + '</option>');
									var region = response.opened_layout.regions[i];
									var $new_region = $('<div class="region" data-id="' + region.z_regionid_pk + '"></div>');
									var new_color = generateUniqueColor(used_colors);
									used_colors.push(new_color);
									$new_region.css({
										'background-color': new_color,
										'width': Math.round(parseInt(region.width) / session.divisor),
										'height': Math.round(parseInt(region.height) / session.divisor),
										'left': Math.round(parseInt(region.x) / session.divisor),
										'top': Math.round(parseInt(region.y) / session.divisor),
										'z-index': parseInt(region.z)
									});
									$('.layout-canvas').append($new_region);
								}

								// Set up region dropdown
								$('.select-region select').val($('.select-region select option').eq(1).attr('value'));
								$('.select-region select').off('change');
								$('.select-region select').change(function() {
									var z_regionid_pk = $(this).val();
									var region = null;
									for (var i = 0; i < session.current_playlist.layouts[0].regions.length; i++) {
										if (session.current_playlist.layouts[0].regions[i].z_regionid_pk == z_regionid_pk) {
											region = session.current_playlist.layouts[0].regions[i];
											break;
										}
									}
									if (!region) return;
									$('.layer-timeline-body .layer').hide();
									$('.playlist').hide();
									$('.layer[data-id="' + z_regionid_pk + '"]').show();
									$('.layer-label[data-id="' + z_regionid_pk + '"]').closest('.playlist').show();
									renderPreview(true);
								});

								// Set up timeline content
								for (var i = 0; i < response.opened_layout.regions.length; i++) {
									var $playlist = $('<div class="playlist"></div>');
									var $layer_label = ('<div class="layer-label" data-id="' + response.opened_layout.regions[i].z_regionid_pk + '"><div class="layer-label-settings"></div><div class="layer-label-text">' + response.opened_layout.regions[i].name + '</div><div class="layer-label-tag" style="background-color: ' + used_colors[0] + ';"></div></div>');
									$playlist.append($layer_label);
									$('.layer-labels .layer-buttons').before($playlist);
									var $layer = $('<div class="layer" data-id="' + response.opened_layout.regions[i].z_regionid_pk + '"></div>');
									var $segment = $('<div class="layer-segment-list"><div class="layer-segment layer-segment-empty" style="width: 10px;"><div class="layer-segment-head"></div><div class="layer-segment-tail"></div></div><div class="col-resize"></div></div>');
									var $padding = $('<div class="layer-padding" style="width: 500px;"></div>');
									$layer.append($segment);
									$layer.append($padding);
									$('.layer-timeline-body').append($layer);
									if (i > 0) {
										$playlist.hide();
										$layer.hide();
									}
								}
							} else {
								// FAIL!
								alert(response.message);
							}
						}).error(function(e) {
							// Whoops, that wasn't supposed to happen...
						});
					});
					$('.layout-list').append($layout);
				}
			} else {
				// FAIL!
			}
		}).error(function(e) {
			// Whoops, that wasn't supposed to happen...
		});
	};

	// Fetch more content! TODO: handle more than 100 content
	var fetchMoreContent = function() {
		if (!session.content_list) session.content_list = [];
		$.ajax({
			url: path + 'controllers/content.php',
			method: 'POST',
			data: {
				'request': 'getContent',
				'payload': {
					'offset': 0,
					'results_per_page': 100
				}
			},
			dataType: 'json'
		}).success(function(response) {
			if (response && response.result && response.result == 'success') {
				// SUCCESS!
				for (var i = 0; i < response.content.length; i++) {
					session.content_list.push(response.content[i]);
					var $content = $('<div class="content-item" data-id="' + response.content[i].z_contentid_pk + '" data-url="' + response.content[i].url + '" style="background-image: url(\'' + response.content[i].url + '\');"></div>');
					$content.click(function() {
						$('.modal-overlay, .modal').hide();
						var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
						var url = $(this).data('url');
						var z_contentid_pk = $(this).data('id');
						getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment').each(function() {
							if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
								$(this).addClass('layer-segment-keyframe').removeClass('layer-segment-empty').data('content', {'z_contentid_pk': z_contentid_pk, 'url': url});
								renderPreview(true);
							}
						});
						$('.add-content').hide();
						$('.change-content').show();
						$('.remove-content').show();
					});
					$('.content-list').append($content);
				}
			} else {
				// FAIL!
			}
		}).error(function(e) {
			// Whoops, that wasn't supposed to happen...
		});
	};

	// Render preview of screen for current playlist position
	var renderPreview = function(playlist_changed) {
		// Only render preview if timeline position has changed or playlist has changed
		if (!playlist_changed && session.timelinePosition == $('.layer-timeline').data('timelinePosition')) return;
		$('.layer-timeline').data('timelinePosition', session.timelinePosition);
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		$('.layout-preview').hide();
		$('.layer-segment:visible').each(function() {
			if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.timelinePosition && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.timelinePosition) {
				$('.layout-preview').show();
				if ($(this).data('content')) {
					$('.region[data-id="' + $(this).closest('.layer').data('id') + '"]').css('background-image', 'url(\'' + $(this).data('content').url + '\')').addClass('transparent');
				} else {
					$('.region[data-id="' + $(this).closest('.layer').data('id') + '"]').css('background-image', '').removeClass('transparent');
				}
			}
		});
		$('.layer-segment:hidden:first-child').each(function() {
			if ($(this).hasClass('layer-segment-keyframe')) {
				$('.region[data-id="' + $(this).closest('.layer').data('id') + '"]').css('background-image', 'url(\'' + $(this).data('content').url + '\')').addClass('transparent');
			} else {
				$('.region[data-id="' + $(this).closest('.layer').data('id') + '"]').css('background-image', '').removeClass('transparent');
			}
		});
	};

	// Send playlist data to server to store in database
	var savePlaylist = function() {
		session.current_playlist.playlists = [];
		$('.layer-labels .playlist').each(function() {
			var region_timelines = [];
			$(this).find('.layer-label').each(function() {
				var z_regionid_pk = $(this).data('id');
				region_timelines.push($('.layer-timeline-body .layer[data-id="' + z_regionid_pk + '"] .layer-segment-list'));
			});
			var playlist = {};
			playlist.entries = [];
			for (var i = 0; i < region_timelines.length; i++) {
				var z_regionid_pk = region_timelines[i].closest('.layer').data('id');
				var order_index = 0;
				region_timelines[i].find('.layer-segment').each(function() {
					var entry = {};
					entry.z_regionid_fk = z_regionid_pk;
					entry.z_contentid_fk = 0;
					entry.url = '';
					if ($(this).hasClass('layer-segment-keyframe') && $(this).data('content')) {
						entry.z_contentid_fk = $(this).data('content').z_contentid_pk;
						entry.url = $(this).data('content').url;
					}
					entry.duration = Math.round($(this).width() / 10);
					entry.order_index = order_index;
					order_index++;
					playlist.entries.push(entry);
				});
			}
			session.current_playlist.playlists.push(playlist);
		});
		$.ajax({
			url: path + 'controllers/playlists.php',
			method: 'POST',
			data: {
				'request': 'savePlaylist',
				'payload': {
					'playlist': session.current_playlist
				}
			},
			dataType: 'json'
		}).success(function(response) {
			if (response && response.result && response.result == 'success') {
				// SUCCESS!
				var saved_playlist = response.saved_playlist;
				// TODO: update current playlist with IDs from the server
				session.z_playlistid_pk = saved_playlist.z_playlistid_pk;
				for (var i = 0; i < saved_playlist.playlists.length; i++) {
					var playlist = saved_playlist.playlists[i];
					var z_subplaylistid_pk = playlist.z_subplaylistid_pk;

				}
			} else {
				// FAIL!
			}
		}).error(function(e) {
			// Whoops, that wasn't supposed to happen...
		});
	};
	$('.save-button').click(savePlaylist);

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
	$('.cancel-button').click(function() {
		$('.modal-overlay, .modal').hide();
	});
	$('.back-to-main').click(function() {
		$('body > .wrapper').show();
		$('.top-navigation').show();
		$('.gui').hide();
	});

	// Get layer by index
	var getLayerByIndex = function(index) {
		return $('.layer:visible').first();
	}

	// Return layer index
	var getLayerIndex = function($layer) {
		return 0;
	}

	// Runs on mousedown / mousemove events
	var mouseAction = function(e) {
		if (e && session.$dragTarget && session.$dragTarget.hasClass('col-resize') && session.$resizeSegment) {
			// Segment resizing
			var delta = session.dragStartPosition.left - e.pageX;
			delta = Math.round((delta - 10) / 10) * 10;
			if (delta > session.resizeSegmentOriginalWidth - 10) {
				delta = session.resizeSegmentOriginalWidth - 10;
			}
			session.$resizeSegment.css('width', Math.round((session.resizeSegmentOriginalWidth - delta) / 10) * 10);
			if (session.$nextSegment.length) {
				session.$nextSegment.css('width', Math.round((session.nextSegmentOriginalWidth + delta + 20) / 10) * 10);
			} else {
				var layerWidth = Math.round((session.layerOriginalWidth - delta) / 10) * 10;
				var newDelta = delta;
				$('.layer-padding').prev().each(function() {
					if (!$(this).is(session.$resizeSegment)) {
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
						if (!$(this).is(session.$resizeSegment)) {
							var width = Math.round(($(this).data('original-width') - newDelta) / 10) * 10;
							$(this).css('width', width);
						}
					});
					session.$resizeSegment.css('width', Math.round((session.resizeSegmentOriginalWidth - newDelta) / 10) * 10);
					var layerWidth = Math.round((session.layerOriginalWidth - newDelta) / 10) * 10;
				}
			}
		} else if (e && session.$dragTarget && session.$dragTarget.is($('.ruler'))) {
			// Highlight segment
			var left = Math.min(session.dragStartPosition.left, e.pageX);
			var right = Math.max(session.dragStartPosition.left, e.pageX);
			var x = left - 7;
			if (session.dragStartPosition.left % 10 >= 1 && session.dragStartPosition.left % 10 <= 4) {
				x += 5;
				session.dragStartPosition.left += 5;
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
			session.selectedSegment.layerEnd = $('.layer-timeline-body .layer:visible').length + $('.layer-timeline-body .playlist-layer:visible').length;

			// Update timeline marker position
			var timelineOffset = Math.round($('.layer-timeline').prop('scrollLeft') / 10);
			var x;
			if (session.dragStartPosition.left < e.pageX) x = 150 + (session.selectedSegment.timeEnd * 10) - 7;
			else x = 150 + ((session.selectedSegment.timeStart + 1) * 10) - 7;
			x -= timelineOffset * 10;
			x = Math.floor((x + 5) / 10) * 10;
			if (x < 150) x = 150;
			if (x >= Math.floor(($(window).width() - 11) / 10) * 10) x = Math.floor(($(window).width() - 11) / 10) * 10;
			$('.timeline-marker').show().css('left', x);
			session.timelinePosition = timelineOffset + Math.round((x - 150) / 10);

		} else if (e && session.$dragTarget && session.$dragTarget.is($('.layer-timeline'))) {
			// Highlight segment
			var left = Math.min(session.dragStartPosition.left, e.pageX);
			var right = Math.max(session.dragStartPosition.left, e.pageX);
			var top = Math.min(session.dragStartPosition.top, e.pageY);
			var bottom = Math.max(session.dragStartPosition.top, e.pageY);
			var x = left - 7;
			if (session.dragStartPosition.left % 10 >= 1 && session.dragStartPosition.left % 10 <= 4) {
				x += 5;
				session.dragStartPosition.left += 5;
			}
			x = Math.floor((x + 5) / 10) * 10;
			if (x < 150) x = 150;
			if (x >= Math.floor(($(window).width() - 11) / 10) * 10) x = Math.floor(($(window).width() - 11) / 10) * 10;
			$('.segment-marker').show().css('left', x);
			var timelineOffset = Math.round($('.layer-timeline').prop('scrollLeft') / 10);
			session.timelinePosition = timelineOffset + Math.round((x - 150) / 10);
			var y = 28 + (Math.floor((top - 28) / 19) * 19);
			var maxY = $('.layer-timeline .layer:visible').last().offset().top - 1;
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
			var maxY2 = $('.layer-timeline .layer:visible').last().offset().top - 1;
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
			if (session.dragStartPosition.left < e.pageX) x = 150 + (session.selectedSegment.timeEnd * 10) - 7;
			else x = 150 + ((session.selectedSegment.timeStart + 1) * 10) - 7;
			x -= timelineOffset * 10;
			x = Math.floor((x + 5) / 10) * 10;
			if (x < 150) x = 150;
			if (x >= Math.floor(($(window).width() - 11) / 10) * 10) x = Math.floor(($(window).width() - 11) / 10) * 10;
			$('.timeline-marker').show().css('left', x);
			session.timelinePosition = timelineOffset + Math.round((x - 150) / 10);
		}
		renderPreview();
	};
	$(document).mousemove(function(e) {
		mouseAction(e);
	});

	// Select segment / drag
	// Note: listen to event on "body" to avoid listening to event on scrollbar
	$(document).on('mousedown', '.layer-timeline-body', function(e) {
		if (e.which == 1) {
			session.$dragTarget = $('.layer-timeline');
			session.dragStartPosition = { "top": e.pageY, "left": e.pageX };
			session.timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
			mouseAction(e);
			// Hide properties pane
			$('.properties-pane .buttons').hide();
			$('.properties-pane .information').hide();
		}
	});

	// Ruler drag
	$(document).on('mousedown', '.ruler', function(e) {
		if (e.which == 1) {
			session.$dragTarget = $('.ruler');
			session.dragStartPosition = { "top": e.pageY, "left": e.pageX };
			session.timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
			mouseAction(e);
			// Hide properties pane
			$('.properties-pane .buttons').hide();
			$('.properties-pane .information').hide();
		}
	});

	// Resize drag
	$(document).on('mousedown', '.col-resize', function(e) {
		if (e.which == 1) {
			session.$dragTarget = $(e.target);
			session.dragStartPosition = { "top": e.pageY, "left": e.pageX };
			session.timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
			session.$resizeSegment = session.$dragTarget.prev();
			session.$nextSegment = session.$resizeSegment.next().next();
			session.resizeSegmentOriginalWidth = parseInt(session.$resizeSegment.width() / 10) * 10;
			session.nextSegmentOriginalWidth = parseInt(session.$nextSegment.width() / 10) * 10;
			session.layerOriginalWidth = session.$resizeSegment.closest('.layer-segment-list').width();
			$('.layer-padding:visible').prev().each(function() {
				session.$dragTarget.data('original-width', session.$dragTarget.width());
			});
			mouseAction(e);
			// Make resizing visible
			session.$dragTarget.addClass('active');
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

	// Mouseup events
	$(document).mouseup(function(e) {
		if (session.$dragTarget && session.$dragTarget.hasClass('col-resize')) {
			// Hide resizing
			session.$dragTarget.removeClass('active');
			// Revert cursor change
			$('html, body').removeClass('col-resize-cursor');
			// Force re-render, in case we've moved a new keyframe under the timeline pointer
			renderPreview(true);
		} else if (session.$dragTarget) {
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
				getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment').each(function() {
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
				if (session.selectedSegment.timeEnd > Math.round($('.layer-segment-list').first().width() / 10)) {
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
					$('.properties-pane .selection-duration').show().find('.duration').text(session.selectedSegment.timeEnd - session.selectedSegment.timeStart);
				} else {
				// If only one column is selected
					// And selection is beyond the tail segment
					if (session.selectedSegment.timeEnd > Math.round($('.layer-segment-list').first().width() / 10)) {
						$('.properties-pane .extend-timeline').show();
					}
				}
				// If at least one keyframe(s) selected
				$('.properties-pane .delete-keyframes').hide();
				$('.layer-timeline-body .layer:visible').each(function() {
					if (getLayerIndex($(this)) >= session.selectedSegment.layerStart && getLayerIndex($(this)) < session.selectedSegment.layerEnd) {
						$(this).find('.layer-segment').each(function() {
							if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) >= session.selectedSegment.timeStart && Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) < session.selectedSegment.timeEnd) {
								if ($(this).prev().length) {
									$('.properties-pane .delete-keyframes').show();
									// If keyframe is not positioned at left-bound of selection or is length of 1s
									if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) > session.selectedSegment.timeStart || Math.round($(this).width() / 10) == 1) {
										$('.properties-pane .delete-frames').hide();
									}
								}
							}
						});
					}
				});
			}
			// If all selected segments are tail segments (or selected segments are 1s length)
			var allTailSegments = true;
			for (var i = session.selectedSegment.layerStart; i < session.selectedSegment.layerEnd; i++) {
				var layer = getLayerByIndex(i);
				if (layer.length) {
					// If keyframe selected and segment is only 1s length
					var segmentIsStub = false;
					layer.find('.layer-segment').each(function() {
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
				// If some layers were not selected
				if (session.selectedSegment.layerEnd - session.selectedSegment.layerStart < $('.playlist-layer').length + $('.playlist-layer .layer').length) {
					$('.properties-pane .delete-frame').hide();
					$('.properties-pane .delete-frames').hide();
				}
			}
			// If selection is beyond the tail segment
			if (session.selectedSegment.timeEnd > Math.round($('.layer-segment-list').first().width() / 10)) {
				$('.properties-pane .insert-frame').hide();
				$('.properties-pane .delete-frame').hide();
				$('.properties-pane .delete-frames').hide();
			}
		}
		session.$dragTarget = null;
	});

	// Timeline scroll actions
	$('.layer-timeline').scroll(function(e) {
		// If dragging, prevent scrolling!
		if (session.$dragTarget) {
			$('.layer-timeline').prop('scrollLeft', session.timelineScrollLeft);
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
		var timelineFirstLabel = Math.ceil(snapToTick / 100) * 10;
		if (labelOffset >= 200) labelOffset = 100;
		$('.timeline-label-wrapper').css('margin-left', labelOffset);
		$('.timeline-label').each(function() {
			$(this).text((($(this).index() * 10) + timelineFirstLabel) + 's');
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
	$(document).on('click', '.layer-label, .layout-label', function(e) {
		$('.layer-label, .layout-label').removeClass('selected');
		$(e.target).closest('.layer-label').addClass('selected');

		// Highlight segment
		var index = 0;
		var y = 28 + (index * 20);
		$('.segment-marker').show().css('top', y);
		$('.segment-marker').css('left', 150);
		$('.segment-marker').css('height', 21);
		$('.segment-marker').css('width', $('.layer-timeline').prop('scrollWidth') * 2);
		session.selectedSegment.timeStart = 0;
		session.selectedSegment.timeEnd = Math.round($('.layer-timeline').prop('scrollWidth') * 2 / 20);
		session.selectedSegment.layerStart = (y - 28) / 20;
		session.selectedSegment.layerEnd = session.selectedSegment.layerStart + 1;
	});
	$(document).on('click', '.layers, .ruler', function(e) {
		// Do nothing if clicking on .layer-buttons
		if ($(e.target).closest('.layer-buttons').length) return;
		// Remove selection if clicking on ruler or layers
		if (!$(e.target).closest('.layer-label').length) {
			$('.layer-label, .layout-label').removeClass('selected');
		}
	});

	// Layer Settings
	$(document).on('click', '.layer-label-settings', function(e) {
		// Prevent click propagation to label
		e.stopPropagation();
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
		$('.modal-overlay, .choose-content-modal').show();
		if (!session.content_list) session.content_list = [];
		// Get layouts from server if we haven't already
		if (session.content_list.length == 0) {
			fetchMoreContent();
		}
	});
	// Change Content
	$('.change-content').click(function(e) {
		$('.modal-overlay, .choose-content-modal').show();
		if (!session.content_list) session.content_list = [];
		// Get layouts from server if we haven't already
		if (session.content_list.length == 0) {
			fetchMoreContent();
		}
	});
	// Remove Content
	$('.remove-content').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment-keyframe').each(function() {
			if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
				$(this).removeClass('layer-segment-keyframe').addClass('layer-segment-empty').removeData('content');
			}
		});
		$('.add-content').show();
		$('.change-content').hide();
		$('.remove-content').hide();
		renderPreview(true);
	});
	// Insert Keyframe
	$('.insert-keyframe').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		// Extend timeline if required
		var insertionWidth = (session.selectedSegment.timeEnd - Math.round($('.layer-segment-list:visible').first().width() / 10)) * 10;
		if (insertionWidth > 0) {
			$('.layer-segment-list:visible .layer-segment').last().each(function() {
				$(this).css('width', $(this).width() + insertionWidth + 1);
			});
		}
		getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment').each(function() {
			if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
				var newSegmentSize = $(this).width() - ((session.selectedSegment.timeStart - Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10)) * 10) + 1;
				$(this).css('width', $(this).width() - newSegmentSize + 1);
				$(this).next().after('<div class="layer-segment layer-segment-empty" style="width: ' + newSegmentSize + 'px;"><div class="layer-segment-head"></div><div class="layer-segment-tail"></div></div><div class="col-resize"></div>');
				session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
				$('.segment-marker').hide();
				$('.properties-pane .buttons').hide();
			}
		});
		renderPreview(true);
	});
	// Delete Keyframe
	$('.delete-keyframe').click(function(e) {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment').each(function() {
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
		$('.layer-timeline-body .layer:visible').each(function() {
			if (getLayerIndex($(this)) >= session.selectedSegment.layerStart && getLayerIndex($(this)) < session.selectedSegment.layerEnd) {
				$(this).find('.layer-segment').each(function() {
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
		getLayerByIndex(session.selectedSegment.layerStart).find('.layer-segment').each(function() {
			if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
				if ($(this).width() > 11) {
					$(this).css('width', $(this).width() - 9);
					if ($(this).next().next().length) {
						$(this).next().next().css('width', $(this).next().next().width() + 11);
					} else {
						$(this).next().after('<div class="layer-segment layer-segment-empty" style="width: 10px;"><div class="layer-segment-head"></div><div class="layer-segment-tail"></div></div><div class="col-resize"></div>');
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
		$('.layer-timeline-body .layer:visible').each(function() {
			if (getLayerIndex($(this)) >= session.selectedSegment.layerStart && getLayerIndex($(this)) < session.selectedSegment.layerEnd) {
				// IMPORTANT: Looping through in REVERSE order so that deletion does not affect subsequent positional detection
				$($(this).find('.layer-segment').get().reverse()).each(function() {
					if (Math.round(($(this).offset().left + timelineScrollLeft - 150) / 10) <= session.selectedSegment.timeStart && Math.round((($(this).offset().left + timelineScrollLeft - 150) + $(this).width()) / 10) > session.selectedSegment.timeEnd - 1) {
						if ($(this).width() > 11) {
							// If some layers were not selected
							if (session.selectedSegment.layerEnd - session.selectedSegment.layerStart < $('.playlist-layer').length + $('.playlist-layer .layer').length) {
								// If not the tail segment
								if ($(this).next().next().length) {
									// Perform deletion
									$(this).css('width', $(this).width() - deletionWidth);
									// Extend the next segment
									$(this).next().next().css('width', $(this).next().next().width() + deletionWidth + 2);
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
	});
	$('.insert-frame-modal .ok-button').click(function() {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		var insertionWidth = $('.insert-frame-amount').val() * 10;
		$('.layer-timeline-body .layer').each(function() {
			// If this layer was selected, extend the selected segment
			if (getLayerIndex($(this)) >= session.selectedSegment.layerStart && getLayerIndex($(this)) < session.selectedSegment.layerEnd) {
				var segmentFound = false;
				$(this).find('.layer-segment').each(function() {
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
		session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
		$('.segment-marker').hide();
		$('.properties-pane .buttons').hide();
		$('.modal-overlay, .modal').hide();
	});
	// Extend Timeline
	$('.extend-timeline').click(function() {
		var timelineScrollLeft = $('.layer-timeline').prop('scrollLeft');
		var insertionWidth = (session.selectedSegment.timeEnd - Math.round($('.layer-segment-list:visible').first().width() / 10)) * 10;
		$('.layer-segment-list:visible .layer-segment').last().each(function() {
			$(this).css('width', $(this).width() + insertionWidth + 1);
		});
		session.selectedSegment = { "timeStart": 0, "timeEnd": 1, "layerStart": 0, "layerEnd": 1 };
		$('.segment-marker').hide();
		$('.properties-pane .buttons').hide();
		$('.modal-overlay, .modal').hide();
	});
});