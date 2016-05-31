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
	<div class="wrapper center">
		<div class="page-header">
			Layouts
		</div>
		<div class="button-list layouts-main">
			<div class="button new-layout">
				Create New Layout
			</div>
			<div class="button open-layout">
				Open Existing Layout
			</div>
			<a href="signage.php" class="button">
				Back to Signage
			</a>
		</div>
		<div class="form button-list new-layout" style="display: none;">
			<div class="button horizontal">
				Horizontal (1920 x 1080)
			</div>
			<div class="button vertical">
				Vertical (1080 x 1920)
			</div>
			<div class="form-row">
				<div class="label">Width</div>
				<input class="width" type="text" placeholder="Width in pixels" maxlength="5">
			</div>
			<div class="form-row">
				<div class="label">Height</div>
				<input class="height" type="text" placeholder="Height in pixels" maxlength="5">
			</div>
			<div class="button button-left ok">
				OK
			</div>
			<div class="button button-right cancel">
				Cancel
			</div>
		</div>
		<div class="button-list layout-list" style="display: none;">
			<div class="button button-left">
				<i class="fa fa-angle-double-left" aria-hidden="true"></i>
			</div>
			<div class="button button-right">
				<i class="fa fa-angle-double-right" aria-hidden="true"></i>
			</div>
			<div class="button cancel">
				Cancel
			</div>
		</div>
		<div class="layout-editor" style="display: none">
			<div class="layout-preview">
				<div class="layout-canvas"></div>
			</div>
			<div class="sub-header">
				Main
			</div>
			<div class="button-list layout-editor-main">
				<div class="form-row">
					<div class="label">Layout Name</div>
					<input type="text" class="layout-name" placeholder="My Layout Name" value="Untitled Layout" maxlength="255">
				</div>
				<div class="button new-region">
					Add New Region
				</div>
				<div class="button edit-region">
					Edit Existing Region
				</div>
				<div class="button delete-layout">
					Delete Current Layout
				</div>
				<div class="button button-left save">
					Save
				</div>
				<div class="button button-right close">
					Close
				</div>
			</div>
			<div class="button-list new-region">
				<div class="form-row">
					<div class="label">Region Name</div>
					<input type="text" class="region-name" placeholder="My Region Name" maxlength="255">
				</div>
				<div class="form-row">
					<div class="label">X Position</div>
					<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
					<input type="text" class="region-x" placeholder="X in pixels" maxlength="5">
				</div>
				<div class="form-row">
					<div class="label">Y Position</div>
					<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
					<input type="text" class="region-y" placeholder="Y in pixels" maxlength="5">
				</div>
				<div class="form-row">
					<div class="label">Width</div>
					<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
					<input type="text" class="region-width" placeholder="Width in pixels" maxlength="5">
				</div>
				<div class="form-row">
					<div class="label">Height</div>
					<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
					<input type="text" class="region-height" placeholder="Height in pixels" maxlength="5">
				</div>
				<div class="button button-left ok">
					OK
				</div>
				<div class="button button-right cancel">
					Cancel
				</div>
			</div>
			<div class="button-list region-list">
				<div class="button cancel">
					Cancel
				</div>
			</div>
			<div class="button-list edit-region">
				<div class="form-row">
					<div class="label">Region Name</div>
					<input type="text" class="region-name" placeholder="My Region Name" maxlength="255">
				</div>
				<div class="form-row">
					<div class="label">X Position</div>
					<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
					<input type="text" class="region-x" placeholder="X in pixels" maxlength="5">
				</div>
				<div class="form-row">
					<div class="label">Y Position</div>
					<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
					<input type="text" class="region-y" placeholder="Y in pixels" maxlength="5">
				</div>
				<div class="form-row">
					<div class="label">Width</div>
					<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
					<input type="text" class="region-width" placeholder="Width in pixels" maxlength="5">
				</div>
				<div class="form-row">
					<div class="label">Height</div>
					<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>
					<input type="text" class="region-height" placeholder="Height in pixels" maxlength="5">
				</div>
				<div class="button button-left ok">
					OK
				</div>
				<div class="button button-right cancel">
					Cancel
				</div>
			</div>
		</div>
	</div>
	<?php require('includes/scripts.php'); ?>
	<script src="<?= $path; ?>js/controllers/layouts.js" type="text/javascript"></script>
</body>
</html>