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
	session.divisor = 1;
	session.current_region_index = null;

	// Main Navigation
	$('.button.new-layout').click(function() {
		$('.page-header').text('Create New Layout');
		$('.button-list').hide();
		$('.button-list.new-layout').show();
		$('.width').val('');
		$('.height').val('');
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
		session.current_layout.regions = [];
		session.current_layout.width = parseInt($('.width').val());
		session.current_layout.height = parseInt($('.height').val());
		session.divisor = 1;
		while (session.current_layout.width / session.divisor > 320 || session.current_layout.height / session.divisor > 320) {
			session.divisor++;
		}
		$('.layout-canvas').css({
			'width': session.current_layout.width / session.divisor,
			'height': session.current_layout.height / session.divisor
		});
	});

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
		$(this).bind('paste', regionWidthChange);
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
		$(this).bind('paste', regionHeightChange);
	})
	$('.region-height:visible').bind('paste', regionHeightChange);
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
		$(this).bind('paste', regionXChange);
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
		$(this).bind('paste', regionYChange);
	})
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
			$('.button-list.region-list').prepend($region_button);
		}
	});
	$('.button-list.region-list .button.cancel').click(function() {
		$('.sub-header').text('Main');
		$('.region-name:visible').val('Untitled Region');
		$('.button-list').hide();
		$('.button-list.layout-editor-main').show();
	});
	$('.button-list.edit-region .button.save').click(function() {
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
		$('.region.blink').removeClass('blink').css('z-index', current_region.z);
	});

	// Save Layout
	$('.button-list.layout-editor-main .save').click(function() {
		$('.button-list.layout-editor-main .save').text('SAVING...').addClass('disabled');
		setTimeout(function() {
			$('.button-list.layout-editor-main .save').text('SAVED!').removeClass('disabled').addClass('success');
			setTimeout(function() {
				$('.button-list.layout-editor-main .save').text('SAVE').removeClass('success');
			}, 1000);
		}, 750);
	});

	// Close Layout
	$('.button-list.layout-editor-main .close').click(function() {
		if (confirm('Are you sure you want to close this layout? You will lose any unsaved changes!')) {
			$('.button-list').hide();
			$('.layout-editor').hide();
			$('.region').remove();
			session = {};
			session.divisor = 1;
			session.current_region_index = null;
			$('.page-header').text('Layouts');
			$('.button-list.layouts-main').show();
		}
	});
});