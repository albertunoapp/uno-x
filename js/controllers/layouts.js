// Create an object that can store hidden properties...
function secret() {
	var cache = {};
	return function(){
		if (arguments.length == 1) {
				return cache[arguments[0]];
			}
		if (arguments.length == 2) {
			cache[arguments[0]] = arguments[1];
		}
	};
}

function generateUniqueName(new_name, used_name_list) {
	var name = new_name;
	var enumeration = 1;
	var regex = /(.+) \(([2-9]|[1-9][0-9]+)\)$/g.exec(new_name);
	if (regex) {
		if (regex.length == 3) {
			name = regex[1];
			enumeration = parseInt(regex[2]);
		}
	}
	for (var i = 0; i < used_name_list.length; i++) {
		if (new_name == used_name_list[i]) {
			enumeration++;
			new_name = name + ' (' + enumeration + ')';
		}
	}
	return new_name;
}

function colorToHex(color) {
	if (color.charAt(0) == '#') return color;
	var rgb;
	rgb = color.substring(color.indexOf('(') + 1);
	rgb = rgb.substring(0, rgb.indexOf(')'));
	rgb = rgb.split(',');
	var hex = '#';
	hex += ('0' + parseInt(rgb[0]).toString(16)).slice(-2);
	hex += ('0' + parseInt(rgb[1]).toString(16)).slice(-2);
	hex += ('0' + parseInt(rgb[2]).toString(16)).slice(-2);
	return hex;
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
	var session = {};
	session.layouts_offset = 0;
	session.more_next_page = false;
	session.layouts_list = null;
	session.divisor = 1;
	session.current_layout = null;
	session.current_region_index = null;

	// Main Navigation
	$('.button-list.layouts-main .button.new-layout').click(function() {
		$('.page-header').text('Create New Layout');
		$('.button-list').hide();
		$('.button-list.new-layout').show();
		$('.width').val('');
		$('.height').val('');
	});

	// Generate the list of layouts! (8 layouts with offset)
	var renderLayoutList = function() {
		$('.button-list.layout-list .layout-button').remove();
		if (!session.layouts_list) return;
		for (var i = session.layouts_offset * 8; i < session.layouts_list.length && i < (session.layouts_offset * 8) + 8; i++) {
			var $layout_button = $('<div class="button layout-button" data-id="' + session.layouts_list[i].z_layoutid_pk + '">' + session.layouts_list[i].layout_name + '</div>')
			$layout_button.click(function() {
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
						// Load layout into layout editor
						$('.page-header').text('Layout Editor');
						$('.button-list').hide();
						$('.layout-editor').show();
						$('.button-list.layout-editor-main').show();
						$('.layout-name').val(response.opened_layout.name);
						session.current_layout = response.opened_layout;
						session.divisor = 1;
						while (session.current_layout.width / session.divisor > 320 || session.current_layout.height / session.divisor > 320) {
							session.divisor++;
						}
						$('.layout-canvas').css({
							'width': session.current_layout.width / session.divisor,
							'height': session.current_layout.height / session.divisor
						});
						var used_colors = [];
						for (var i = 0; i < session.current_layout.regions.length; i++) {
							var region = session.current_layout.regions[i];
							var new_region_obj = new(secret())();
							new_region_obj['z_layoutregionid_pk'] = region['z_layoutregionid_pk'];
							new_region_obj['z_regionid_pk'] = region['z_regionid_pk'];
							new_region_obj['name'] = region['name'];
							new_region_obj['width'] = region['width'];
							new_region_obj['height'] = region['height'];
							new_region_obj['x'] = region['x'];
							new_region_obj['y'] = region['y'];
							var new_color = generateUniqueColor(used_colors);
							used_colors.push(new_color);
							var $new_region = $('<div class="region"></div>');
							$new_region.css({
								'background-color': new_color,
								'width': parseInt(region.width) / session.divisor,
								'height': parseInt(region.height) / session.divisor,
								'left': parseInt(region.x) / session.divisor,
								'top': parseInt(region.y) / session.divisor,
								'z-index': parseInt(region.z)
							});
							$('.layout-canvas').append($new_region);
							new_region_obj.constructor('$region', $new_region);
							session.current_layout.regions[i] = new_region_obj;
							$('.button-list.layout-editor-main .save').addClass('disabled');
						}
					} else {
						// FAIL!
						alert(response.message);
					}
				}).error(function(e) {
					// Whoops, that wasn't supposed to happen...
				});
			});
			if ($('.button-list.layout-list .layout-button').length) {
				$('.button-list.layout-list .layout-button').last().after($layout_button);
			} else {
				$('.button-list.layout-list').prepend($layout_button);
			}
		}
	};

	// Fetch 8 more layouts!
	var fetchMoreLayouts = function() {
		if (!session.layouts_list) session.layouts_list = [];
		$('.button-list.layout-list .button-left').addClass('disabled').hide();
		$('.button-list.layout-list .button-right').addClass('disabled').hide();
		$('.button-list.layout-list .layout-button').remove();
		var $loading_button = $('<div class="button layout-button disabled">LOADING...</div>')
		$('.button-list.layout-list').prepend($loading_button);
		$.ajax({
			url: path + 'controllers/layouts.php',
			method: 'POST',
			data: {
				'request': 'getLayouts',
				'payload': {
					'offset': Math.floor((session.layouts_list.length - 0.5) / 8) + 1
				}
			},
			dataType: 'json'
		}).success(function(response) {
			if (response && response.result && response.result == 'success') {
				// SUCCESS!
				$('.button-list.layout-list .layout-button.disabled').remove(); // Remove loading message
				// Make sure at least some layouts exist in response...
				if (!response.layouts || !response.layouts.length) {
					if (session.layouts_list.length == 0) {
						var $no_layouts_button = $('<div class="button layout-button error">NO LAYOUTS FOUND</div>')
						$('.button-list.layout-list').prepend($no_layouts_button);
					}
					return;
				}
				for (var i = 0; i < response.layouts.length; i++) {
					session.layouts_list.push(response.layouts[i]);
				}
				session.layouts_offset = Math.floor((session.layouts_list.length - 0.5 )/ 8);
				session.more_next_page = response.more_next_page;
				renderLayoutList();
				$('.button-list.layout-list .button-left').show();
				$('.button-list.layout-list .button-right').show();
				if (session.layouts_offset > 0) {
					$('.button-list.layout-list .button-left').removeClass('disabled');
				}
				if (response.more_next_page) {
					$('.button-list.layout-list .button-right').removeClass('disabled');
				}
			} else {
				// FAIL!
				$('.button-list.layout-list .layout-button').text('ERROR!').removeClass('disabled').addClass('error');
			}
		}).error(function(e) {
			// Whoops, that wasn't supposed to happen...
			$('.button-list.layout-list .layout-button').text('ERROR!').removeClass('disabled').addClass('error');
		});
	};

	// Open Existing Layout
	$('.button-list.layouts-main .button.open-layout').click(function() {
		$('.page-header').text('Open Existing Layout');
		$('.button-list').hide();
		$('.button-list.layout-list').show();
		$('.button-list.layout-list .button-left').addClass('disabled');
		$('.button-list.layout-list .button-right').addClass('disabled');
		if (!session.layouts_list) session.layouts_list = [];
		if (session.layouts_list.length > 8 || (session.layouts_list.length == 8 && session.more_next_page)) {
			$('.button-list.layout-list .button-right').removeClass('disabled');
		}
		session.layouts_offset = 0;
		renderLayoutList();
		// Get layouts from server if we haven't already
		if (session.layouts_list.length == 0) {
			$('.button-list.layout-list .button-left').hide();
			$('.button-list.layout-list .button-right').hide();
			fetchMoreLayouts();
		}
	});
	$('.button-list.layout-list .button-left').click(function() {
		if (!session.layouts_list) session.layouts_list = [];
		if (session.layouts_offset > 0) {
			session.layouts_offset--;
			renderLayoutList();
		}
		if (session.layouts_offset == 0) {
			$(this).addClass('disabled');
		}
		if (session.layouts_list.length > 8 || (session.layouts_list.length == 8 && session.more_next_page)) {
			$('.button-list.layout-list .button-right').removeClass('disabled');
		}
	});
	$('.button-list.layout-list .button-right').click(function() {
		if (!session.layouts_list) session.layouts_list = [];
		// If we already have enough results to display next page...
		if (session.layouts_offset < Math.floor((session.layouts_list.length - 0.5) / 8)) {
			session.layouts_offset++;
			renderLayoutList();
			if (!session.more_next_page && session.layouts_offset >= Math.floor((session.layouts_list.length - 0.5) / 8)) {
				$(this).addClass('disabled');
			}
			$('.button-list.layout-list .button-left').removeClass('disabled');
		} else if (session.more_next_page) {
			fetchMoreLayouts();
		}
	});
	$('.button-list.layout-list .button.cancel').click(function() {
		$('.page-header').text('Layouts');
		$('.button-list').hide();
		$('.button-list.layouts-main').show();
	});

	// New Layout
	$('.button-list.new-layout .button.cancel').click(function() {
		$('.page-header').text('Layouts');
		$('.button-list').hide();
		$('.button-list.layouts-main').show();
	});
	$('.button.horizontal').click(function() {
		$('.width').val('1920');
		$('.height').val('1080');
	});
	$('.button.vertical').click(function() {
		$('.width').val('1080');
		$('.height').val('1920');
	});
	$('.button-list.new-layout .button.ok').click(function() {
		if (isNaN(parseInt($('.width').val())) ||
			parseInt($('.width').val()) < 320 ||
			parseInt($('.width').val()) > 32000 ||
			'' + parseInt($('.width').val()) != $('.width').val().trim()) {
			alert('Width must be a valid integer between 320 through 32000');
			return;
		} else if (isNaN(parseInt($('.height').val())) ||
			parseInt($('.height').val()) < 320 ||
			parseInt($('.height').val()) > 32000 ||
			'' + parseInt($('.height').val()) != $('.height').val().trim()) {
			alert('Height must be a valid integer between 320 through 32000');
			return;
		}
		$('.page-header').text('Layout Editor');
		$('.button-list').hide();
		$('.layout-editor').show();
		$('.button-list.layout-editor-main').show();
		session.current_layout = {};
		session.current_layout.name = $('.layout-name').val();
		session.current_layout.regions = [];
		session.current_layout.width = parseInt($('.width').val());
		session.current_layout.height = parseInt($('.height').val());
		session.current_layout.dirty = true;
		$('.button-list.layout-editor-main .save').removeClass('disabled');
		session.divisor = 1;
		while (session.current_layout.width / session.divisor > 320 || session.current_layout.height / session.divisor > 320) {
			session.divisor++;
		}
		$('.layout-canvas').css({
			'width': session.current_layout.width / session.divisor,
			'height': session.current_layout.height / session.divisor
		});
	});

	// Layout Name
	var layoutNameChange = function() {
		if (session.current_layout.name != $('.layout-name').val()) {
			session.current_layout.name = $('.layout-name').val();
			session.current_layout.dirty = true;
			$('.button-list.layout-editor-main .save').removeClass('disabled');
		}
	};
	$('.layout-name').keydown(layoutNameChange);
	$('.layout-name').keyup(layoutNameChange);
	$('.layout-name').change(layoutNameChange);
	$('.layout-name').bind('paste', function() { setTimeout(layoutNameChange, 100); });
	$('.layout-name').bind('cut', function() { setTimeout(layoutNameChange, 100); });

	// New region
	$('.button-list.layout-editor-main .button.new-region').click(function() {
		$('.sub-header').text('New Region');
		$('.button-list').hide();
		$('.button-list.new-region').show();
		$('.region-name:visible').val('Untitled Region');
		$('.region-x:visible').val(0);
		$('.region-y:visible').val(0);
		$('.region-width:visible').val('');
		$('.region-height:visible').val('');
		$('.fa-exclamation-triangle:visible').hide();
	});
	var regionSizeChange = function() {
		$('.region.blink').remove();

		if (parseInt($('.region-y:visible').val()) < 0 || parseInt($('.region-y:visible').val()) > session.current_layout.height ||
			parseInt($('.region-x:visible').val()) < 0 || parseInt($('.region-x:visible').val()) > session.current_layout.width ||
			parseInt($('.region-width:visible').val()) < 0 || parseInt($('.region-width:visible').val()) > session.current_layout.width ||
			parseInt($('.region-height:visible').val()) < 0 || parseInt($('.region-height:visible').val()) > session.current_layout.height ||
			parseInt($('.region-y:visible').val()) + parseInt($('.region-height:visible').val()) > session.current_layout.height ||
			parseInt($('.region-x:visible').val()) + parseInt($('.region-width:visible').val()) > session.current_layout.width) {
			$('.region-x:visible').closest('.button-list').find('.fa-exclamation-triangle').show();
			return;
		} else {
			$('.fa-exclamation-triangle:visible').hide();
		}

		var used_colors = [];
		$('.region').each(function() {
			var color = colorToHex($(this).css('background-color'));
			used_colors.push(color);
		});
		var new_color = generateUniqueColor(used_colors);

		var $ghost_region = $('<div class="region blink"></div>').css({
			'background-color': '#000',
			'top': parseInt($('.region-y:visible').val()) / session.divisor,
			'left': parseInt($('.region-x:visible').val()) / session.divisor,
			'width': parseInt($('.region-width:visible').val()) / session.divisor,
			'height': parseInt($('.region-height:visible').val()) / session.divisor,
			'z-index': 999
		});
		if (session.current_region_index != null) {
			var current_region = session.current_layout.regions[session.current_region_index];
			if (typeof(current_region.constructor('$region')) != 'undefined') {
				$ghost_region = current_region.constructor('$region');
				$ghost_region.addClass('blink');
				$ghost_region.css({
					'top': parseInt($('.region-y:visible').val()) / session.divisor,
					'left': parseInt($('.region-x:visible').val()) / session.divisor,
					'width': parseInt($('.region-width:visible').val()) / session.divisor,
					'height': parseInt($('.region-height:visible').val()) / session.divisor,
					'z-index': 999
				});
			}
		}
		$('.layout-canvas').append($ghost_region);

	};
	var regionWidthChange = function() {
		if ($('.region-width:visible').val() == '') {
			// Leave empty fields empty
		} else if (isNaN(parseInt($('.region-width:visible').val()))) {
			$('.region-width:visible').val(1);
		} else if (parseInt($('.region-width:visible').val()) < 0) {
			$('.region-width:visible').val(1);
		} else if (parseInt($('.region-width:visible').val()) > session.current_layout.width) {
			$('.region-width:visible').val(session.current_layout.width);
		}
		regionSizeChange();
	};
	$('.region-width').each(function() {
		$(this).keydown(regionWidthChange);
		$(this).keyup(regionWidthChange);
		$(this).change(function() {
			regionWidthChange();
			if ($(this).val() != parseInt($(this).val())) {
				$(this).val(parseInt($(this).val()));
			}
		});
		$(this).bind('paste', function() { setTimeout(regionWidthChange, 100); });
		$(this).bind('cut', function() { setTimeout(regionWidthChange, 100); });
	})
	var regionHeightChange = function() {
		if ($('.region-height:visible').val() == '') {
			// Leave empty fields empty
		} else if (isNaN(parseInt($('.region-height:visible').val()))) {
			$('.region-height:visible').val(1);
		} else if (parseInt($('.region-height:visible').val()) < 0) {
			$('.region-height:visible').val(1);
		} else if (parseInt($('.region-height:visible').val()) > session.current_layout.height) {
			$('.region-height:visible').val(session.current_layout.height);
		}
		regionSizeChange();
	};
	$('.region-height').each(function() {
		$(this).keydown(regionHeightChange);
		$(this).keyup(regionHeightChange);
		$(this).change(function() {
			regionHeightChange();
			if ($(this).val() != parseInt($(this).val())) {
				$(this).val(parseInt($(this).val()));
			}
		});
		$(this).bind('paste', function() { setTimeout(regionHeightChange, 100); });
		$(this).bind('cut', function() { setTimeout(regionHeightChange, 100); });
	});
	var regionXChange = function() {
		if ($('.region-x:visible').val() == '') {
			// Leave empty fields empty
		} else if (isNaN(parseInt($('.region-x:visible').val()))) {
			$('.region-x:visible').val(0);
		} else if (parseInt($('.region-x:visible').val()) < 0) {
			$('.region-x:visible').val(0);
		} else if (parseInt($('.region-x:visible').val()) >= session.current_layout.width) {
			$('.region-x:visible').val(session.current_layout.width - 1);
		}
		regionSizeChange();
	};
	$('.region-x').each(function() {
		$(this).keydown(regionXChange);
		$(this).keyup(regionXChange);
		$(this).change(function() {
			regionXChange();
			if ($(this).val() != parseInt($(this).val())) {
				$(this).val(parseInt($(this).val()));
			}
		});
		$(this).bind('paste', function() { setTimeout(regionXChange, 100); });
		$(this).bind('cut', function() { setTimeout(regionXChange, 100); });
	})
	var regionYChange = function() {
		if ($('.region-y:visible').val() == '') {
			// Leave empty fields empty
		} else if (isNaN(parseInt($('.region-y:visible').val()))) {
			$('.region-y:visible').val(0);
		} else if (parseInt($('.region-y:visible').val()) < 0) {
			$('.region-y:visible').val(0);
		} else if (parseInt($('.region-y:visible').val()) >= session.current_layout.height) {
			$('.region-y:visible').val(session.current_layout.height - 1);
		}
		regionSizeChange();
	};
	$('.region-y').each(function() {
		$(this).keydown(regionYChange);
		$(this).keyup(regionYChange);
		$(this).change(function() {
			regionYChange();
			if ($(this).val() != parseInt($(this).val())) {
				$(this).val(parseInt($(this).val()));
			}
		});
		$(this).bind('paste', function() { setTimeout(regionYChange, 100); });
		$(this).bind('cut', function() { setTimeout(regionYChange, 100); });
	});
	$('.button-list.new-region .button.ok').click(function() {
		if (parseInt($('.region-y:visible').val()) < 0 || parseInt($('.region-y:visible').val()) > session.current_layout.height - 1) {
			alert('Y position must be valid integer between 0 - ' + (session.current_layout.height - 1) + '.');
			return;
		}
		if (parseInt($('.region-x:visible').val()) < 0 || parseInt($('.region-x:visible').val()) > session.current_layout.width - 1) {
			alert('X position must be valid integer between 0 - ' + (session.current_layout.width - 1) + '.');
			return;
		}
		if (parseInt($('.region-width:visible').val()) < 1 || parseInt($('.region-width:visible').val()) > session.current_layout.width) {
			alert('Width must be valid integer between 1 - ' + session.current_layout.width + '.');
			return;
		}
		if (parseInt($('.region-height:visible').val()) < 1 || parseInt($('.region-height:visible').val()) > session.current_layout.height) {
			alert('Height must be valid integer between 1 - ' + session.current_layout.height + '.');
			return;
		}
		if (parseInt($('.region-y:visible').val()) + parseInt($('.region-height:visible').val()) > session.current_layout.height ||
			parseInt($('.region-x:visible').val()) + parseInt($('.region-width:visible').val()) > session.current_layout.width) {
			alert('Region cannot exceed layout boundaries!');
			return;
		}
		var used_colors = [];
		$('.region').each(function() {
			var color = colorToHex($(this).css('background-color'));
			used_colors.push(color);
		});
		var new_color = generateUniqueColor(used_colors);
		var $new_region = $('<div class="region"></div>');
		$new_region.css({
			'background-color': new_color,
			'width': parseInt($('.region-width:visible').val()) / session.divisor,
			'height': parseInt($('.region-height:visible').val()) / session.divisor,
			'left': parseInt($('.region-x:visible').val()) / session.divisor,
			'top': parseInt($('.region-y:visible').val()) / session.divisor
		});
		$('.layout-canvas').append($new_region);
		var new_z = 1;
		var used_names = [];
		for (var i = 0; i < session.current_layout.regions.length; i++) {
			used_names.push(session.current_layout.regions[i].name);
			if (session.current_layout.regions[i].z >= new_z)  {
				new_z = session.current_layout.regions[i].z + 1;
			}
		}
		var new_region_obj = new(secret())();
		new_region_obj.name = generateUniqueName($('.region-name:visible').val(), used_names);
		new_region_obj.width = parseInt($('.region-width:visible').val());
		new_region_obj.height = parseInt($('.region-height:visible').val());
		new_region_obj.x = parseInt($('.region-x:visible').val());
		new_region_obj.y = parseInt($('.region-y:visible').val());
		new_region_obj.z = new_z;
		new_region_obj.constructor('$region', $new_region);
		session.current_layout.regions.push(new_region_obj);
		session.current_layout.dirty = true;
		$('.button-list.layout-editor-main .save').removeClass('disabled');
		$('.sub-header').text('Main');
		$('.button-list').hide();
		$('.button-list.layout-editor-main').show();
		$('.region.blink').remove();
	});
	$('.button-list.new-region .button.cancel').click(function() {
		$('.sub-header').text('Main');
		$('.button-list').hide();
		$('.button-list.layout-editor-main').show();
	});

	// Edit region
	$('.button-list.layout-editor-main .edit-region').click(function() {
		if (session.current_layout.regions.length == 0) {
			alert('No regions to edit!');
			return;
		}
		$('.sub-header').text('Select Region');
		$('.button-list').hide();
		$('.button-list.region-list').show();
		$('.button-list.region-list .region-button').remove();
		for (var i = 0; i < session.current_layout.regions.length; i++) {
			var $region_button = $('<div class="button region-button" data-index="' + i + '">' + session.current_layout.regions[i].name + '</div>')
			$region_button.click(function() {
				session.current_region_index = $(this).data('index');
				var current_region = session.current_layout.regions[session.current_region_index];
				$('.sub-header').text('Edit Region');
				$('.button-list').hide();
				$('.button-list.edit-region').show();
				$('.region-name:visible').val(current_region.name);
				$('.region-x:visible').val(current_region.x);
				$('.region-y:visible').val(current_region.y);
				$('.region-width:visible').val(current_region.width);
				$('.region-height:visible').val(current_region.height);
				$('.fa-exclamation-triangle:visible').hide();
				if (typeof(current_region.constructor('$region')) != 'undefined') {
					var $ghost_region = current_region.constructor('$region');
					$ghost_region.addClass('blink');
					$ghost_region.css('z-index', 999);
				}
			});
			// TODO: Add ability to sort regions, which should modify z-index accordingly.
			$('.button-list.region-list').prepend($region_button);
		}
	});
	$('.button-list.region-list .button.cancel').click(function() {
		$('.sub-header').text('Main');
		$('.region-name:visible').val('Untitled Region');
		$('.button-list').hide();
		$('.button-list.layout-editor-main').show();
	});
	$('.button-list.edit-region .button.ok').click(function() {
		if (parseInt($('.region-y:visible').val()) < 0 || parseInt($('.region-y:visible').val()) > session.current_layout.height - 1) {
			alert('Y position must be valid integer between 0 - ' + (session.current_layout.height - 1) + '.');
			return;
		}
		if (parseInt($('.region-x:visible').val()) < 0 || parseInt($('.region-x:visible').val()) > session.current_layout.width - 1) {
			alert('X position must be valid integer between 0 - ' + (session.current_layout.width - 1) + '.');
			return;
		}
		if (parseInt($('.region-width:visible').val()) < 1 || parseInt($('.region-width:visible').val()) > session.current_layout.width) {
			alert('Width must be valid integer between 1 - ' + session.current_layout.width + '.');
			return;
		}
		if (parseInt($('.region-height:visible').val()) < 1 || parseInt($('.region-height:visible').val()) > session.current_layout.height) {
			alert('Height must be valid integer between 1 - ' + session.current_layout.height + '.');
			return;
		}
		if (parseInt($('.region-y:visible').val()) + parseInt($('.region-height:visible').val()) > session.current_layout.height ||
			parseInt($('.region-x:visible').val()) + parseInt($('.region-width:visible').val()) > session.current_layout.width) {
			alert('Region cannot exceed layout boundaries!');
			return;
		}
		var current_region = session.current_layout.regions[session.current_region_index];
		current_region.name = '';
		var used_names = [];
		for (var i = 0; i < session.current_layout.regions.length; i++) {
			used_names.push(session.current_layout.regions[i].name);
		}
		current_region.name = generateUniqueName($('.region-name:visible').val(), used_names);
		current_region.width = parseInt($('.region-width:visible').val());
		current_region.height = parseInt($('.region-height:visible').val());
		current_region.x = parseInt($('.region-x:visible').val());
		current_region.y = parseInt($('.region-y:visible').val());
		session.current_region_index = null;
		session.current_layout.dirty = true;
		$('.button-list.layout-editor-main .save').removeClass('disabled');
		$('.sub-header').text('Main');
		$('.button-list').hide();
		$('.button-list.layout-editor-main').show();
		$('.region.blink').removeClass('blink').css('z-index', current_region.z);
	});
	$('.button-list.edit-region .button.cancel').click(function() {
		var current_region = session.current_layout.regions[session.current_region_index];
		session.current_region_index = null;
		$('.sub-header').text('Main');
		$('.button-list').hide();
		$('.button-list.layout-editor-main').show();
		$('.region.blink').css({
			'width': current_region.width / session.divisor,
			'height': current_region.height / session.divisor,
			'left': current_region.x / session.divisor,
			'top': current_region.y / session.divisor,
			'z-index': current_region.z
		}).removeClass('blink');
	});

	// Delete Layout
	$('.button-list.layout-editor-main .delete-layout').click(function() {
		if (confirm('Are you sure you want to delete this layout?')) {
			// If this layout was never saved before, just close it.
			if (!session.current_layout.z_layoutid_pk) {
				$('.button-list').hide();
				$('.layout-editor').hide();
				$('.region').remove();
				session.current_layout = null;
				session.divisor = 1;
				session.current_region_index = null;
				$('.page-header').text('Layouts');
				$('.button-list.layouts-main').show();
			} else {
				//Delete the layout
				$.ajax({
					url: path + 'controllers/layouts.php',
					method: 'POST',
					data: {
						'request': 'deleteLayout',
						'payload': {
							'z_layoutid_pk': session.current_layout.z_layoutid_pk
						}
					},
					dataType: 'json'
				}).success(function(response) {
					if (response && response.result && response.result == 'success') {
						// SUCCESS!
						// Close the layout
						$('.button-list').hide();
						$('.layout-editor').hide();
						$('.region').remove();
						session.current_layout = null;
						session.divisor = 1;
						session.current_region_index = null;
						$('.page-header').text('Layouts');
						$('.button-list.layouts-main').show();
						// Clear layouts cache
						session.layouts_list = null;
					} else {
						// FAIL!
						alert(response.message);
					}
				}).error(function(e) {
					// Whoops, that wasn't supposed to happen...
				});
			}
		}
	});

	// Save Layout
	$('.button-list.layout-editor-main .save').click(function() {
		if (!session.current_layout.dirty) {
			return;
		}
		// Remove dirty flag before sending data to server
		delete session.current_layout.dirty;
		$('.button-list.layout-editor-main .save').text('SAVING...').addClass('disabled');
		$.ajax({
			url: path + 'controllers/layouts.php',
			method: 'POST',
			data: {
				'request': 'saveLayout',
				'payload': session.current_layout
			},
			dataType: 'json'
		}).success(function(response) {
			if (response && response.result && response.result == 'success') {
				// SUCCESS!
				$('.button-list.layout-editor-main .save').text('SAVED!').removeClass('disabled').addClass('success');
				setTimeout(function() {
					$('.button-list.layout-editor-main .save').text('SAVE').removeClass('success').addClass('disabled');
				}, 1000);
				// Update layout object with new IDs if any
				if (response.saved_layout) {
					if (!session.current_layout.z_layoutid_pk) {
						session.current_layout.z_layoutid_pk = response.saved_layout.z_layoutid_pk;
						// Clear layouts cache
						session.layouts_list = null;
					}
					if (response.saved_layout.regions) {
						for (var i = 0; i < response.saved_layout.regions.length; i++) {
							session.current_layout.regions[i].z_layoutregionid_pk = response.saved_layout.regions[i].z_layoutregionid_pk;
							session.current_layout.regions[i].z_regionid_pk = response.saved_layout.regions[i].z_regionid_pk;
							session.current_layout.regions[i].z_layoutid_fk = response.saved_layout.regions[i].z_layoutid_fk;
						}
					}
				}
			} else {
				// FAIL!
				alert(response.message);
				$('.button-list.layout-editor-main .save').text('ERROR!').removeClass('disabled').addClass('error');
				setTimeout(function() {
					$('.button-list.layout-editor-main .save').text('SAVE').removeClass('error');
				}, 1000);
				// Re-instate dirty flag so user can attempt to save again
				session.current_layout.dirty = true;
			}
		}).error(function(e) {
			// SERVER FAILURE!
			$('.button-list.layout-editor-main .save').text('ERROR!').removeClass('disabled').addClass('error');
			setTimeout(function() {
				$('.button-list.layout-editor-main .save').text('SAVE').removeClass('error');
			}, 1000);
		});
	});

	// Close Layout
	$('.button-list.layout-editor-main .close').click(function() {
		if (!session.current_layout.dirty || confirm('Are you sure you want to close this layout? You will lose any unsaved changes!')) {
			$('.button-list').hide();
			$('.layout-editor').hide();
			$('.region').remove();
			session.current_layout = null;
			session.divisor = 1;
			session.current_region_index = null;
			$('.page-header').text('Layouts');
			$('.button-list.layouts-main').show();
		}
	});
});