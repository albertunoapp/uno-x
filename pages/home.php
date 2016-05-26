<?php

require_once('includes/auth-login.php');

?>
<html>
<head>
	<title>Uno-X</title>
	<?php require('includes/head.php'); ?>
</head>
<body>
	<?php require('includes/top-navigation.php'); ?>
	<div class="vertical-center-wrapper">
		<div class="vertical-center-content">
			<div class="wrapper center">
				<div class="location-search-wrapper">
					<div>
						<input type="text" class="location-search" placeholder="Location Search" value="<?php if (isset($_SESSION['selected_company'])) { echo $_SESSION['selected_company']['company_name'] . ' (' . $_SESSION['selected_company']['z_companyid_pk'] . ')'; } ?>">
					</div>
					<div class="location-dropdown" style="display: none;">
						<?php
							if ($_SESSION['type'] != 'Staff') {
								for ($i = 0; $i < count($_SESSION['companies']); $i++) {
									echo '<div class="location-item">';
									echo '<div class="company-name">';
									echo $_SESSION['companies'][$i]['display_name'];
									echo '</div>';
									echo '<div class="company-id">';
									echo $_SESSION['companies'][$i]['z_companyid_pk'];
									echo '</div>';
									echo '</div>';
								}
							}
						?>
					</div>
				</div>
				<div class="app-list<?php if (!isset($_SESSION['selected_company'])) { echo ' disabled'; } ?>">
					<div class="app">
						<a href="signage.php"><img src="<?= $path; ?>images/signage.png"></a>
					</div><!--
					--><div class="app">
						<img src="<?= $path; ?>images/coming-soon.png">
					</div><!--
					--><div class="app">
						<img src="<?= $path; ?>images/coming-soon.png">
					</div><!--
					--><div class="app">
						<img src="<?= $path; ?>images/coming-soon.png">
					</div><!--
					--><div class="app">
						<img src="<?= $path; ?>images/coming-soon.png">
					</div><!--
					--><div class="app">
						<img src="<?= $path; ?>images/coming-soon.png">
					</div><!--
					--><div class="app">
						<img src="<?= $path; ?>images/coming-soon.png">
					</div><!--
					--><div class="app">
						<img src="<?= $path; ?>images/coming-soon.png">
					</div><!--
					--><div class="app">
						<img src="<?= $path; ?>images/coming-soon.png">
					</div><!--
					--><div class="app">
						<img src="<?= $path; ?>images/coming-soon.png">
					</div>
				</div>
			</div>
		</div>
	</div>
	<?php require('includes/scripts.php'); ?>
	<script src="<?= $path; ?>js/controllers/home.js" type="text/javascript"></script>
	<?php if ($_SESSION['type'] == 'Staff') { ?>
	<script>
		// IMPORTANT: this script is for staff users only; for non-staff script, see js/controllers/home.js
		var ajaxRequest = null;
		var locationSearch = function() {
			// If value hasn't changed, terminate now!
			if ($('.location-search').data('previous') == $('.location-search').val()) {
				return;
			}
			// Cancel previous ajax call
			if (ajaxRequest) ajaxRequest.abort();
			ajaxRequest = null;
			$('.location-dropdown').html('').hide();
			$('.location-search').data('previous', $('.location-search').val());
			if ($('.location-search').val().length == 0) {
				return;
			}
			ajaxRequest = $.ajax({
				'method': 'POST',
				'dataType': 'json',
				'url': '<?= $path; ?>controllers/location-search.php',
				'data': {
					'q': $('.location-search').val()
				}
			}).success(function(response) {
				if (typeof(response) == 'undefined') {
					$('.location-dropdown').html('<div class="location-item-disabled">Unknown error!</div>').show();
				} else if (!response) {
					$('.location-dropdown').html('<div class="location-item-disabled">Unknown error!</div>').show();
				} else if (!response.result) {
					$('.location-dropdown').html('<div class="location-item-disabled">Unknown error!</div>').show();
				}
				if (response.result == 'error') {
					if (response.message) {
						$('.location-dropdown').html('<div class="location-item-disabled">' + response.message + '</div>').show();
					} else {
						$('.location-dropdown').html('<div class="location-item-disabled">Unknown error!</div>').show();
					}
				} else if (response.result == 'success') {
					// ********* SUCCESSFUL SEARCH *********
					if (response.message && response.companies && response.companies.length == 0) {
						$('.location-dropdown').html('<div class="location-item-disabled">No results.</div>').show();
					} else if (response.message && response.companies && response.companies.length) {
						$('.location-dropdown').html('');
						for (var i = 0; i < response.companies.length; i++) {
							var company = response.companies[i];
							$('.location-dropdown').append('<div class="location-item"><div class="company-name">' + company.company_name + '</div><div class="company-id">' + company.z_companyid_pk + '</div></div>');
						}
						$('.location-dropdown').show();
						$('.location-item').click(function() {
							$('.location-search').val($(this).find('.company-name').text() + ' (' + $(this).find('.company-id').text() + ')');
							$('.location-dropdown').html('').hide();
							$.ajax({
								'method': 'POST',
								'dataType': 'json',
								'url': path + 'controllers/location-select.php',
								'data': {
									'z_companyid_pk': $(this).find('.company-id').text(),
									'company_name': $(this).find('.company-name').text()
								}
							}).success(function(response) {
								$('.app-list').removeClass('disabled');
							});
						});
					} else {
						$('.location-dropdown').html('<div class="location-item-disabled">Unknown error!</div>').show();
					}
				}
			}).error(function(e) {
				if (e.status >= 500) {
					$('.location-dropdown').html('<div class="location-item-disabled">Unknown server error!</div>').show();
				} else {
					$('.location-dropdown').html('<div class="location-item-disabled">Error connecting to server!</div>').show();
				}
			});
		};
		$('.location-search').change(locationSearch);
		$('.location-search').keydown(locationSearch);
		$('.location-search').keyup(locationSearch);
		$('.location-search').on('paste', function() { setTimeout(locationSearch, 100); } ); // Delay until paste populates input field!
	</script>
	<?php } ?>
</body>
</html>