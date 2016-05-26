$(document).ready(function() {
	$('.location-search').focus(function() {
		if ($('.location-item').length) {
			$('.location-dropdown').show();
		}
	});
	$(document).click(function() {
		if (!$('.location-search').is($(document.activeElement))) {
			$('.location-dropdown').hide();
		}
	});

	// IMPORTANT: this function is for non-staff users only; for staff function, see home.php
	$('.location-item').click(function() {
		$('.location-search').val($(this).find('.company-name').text() + ' (' + $(this).find('.company-id').text() + ')');
		$('.location-dropdown').hide();
		$.ajax({
			'method': 'POST',
			'dataType': 'json',
			'url': path + 'controllers/location-select.php',
			'data': {
				'z_companyid_pk': $(this).find('.company-id').text()
			}
		}).success(function(response) {
			$('.app-list').removeClass('disabled');
		});
	});
});