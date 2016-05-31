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
			Content
		</div>
		<div class="button-list content-main">
			<label class="button new-content">
				<div class="progress-bar" style="display: none;"></div>
				<div class="button-text">Upload New Content</div>
				<form action="/" method="POST" enctype="multipart/form-data">
					<input type="hidden" name="request" value="uploadContent">
					<input type="file" name="content_file">
				</form>
			</label>
			<div class="button browse-content">
				Browse Uploaded Content
			</div>
			<a href="signage.php" class="button">
				Back to Signage
			</a>
		</div>
		<div class="button-list content-list" style="display: none;">
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
	</div>
	<?php require('includes/scripts.php'); ?>
	<script src="<?= $path; ?>js/controllers/content.js" type="text/javascript"></script>
</body>
</html>