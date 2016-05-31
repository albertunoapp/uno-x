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
			Signage
		</div>
		<div class="button-list">
			<div class="button">
				Box Manager
			</div>
			<div class="button">
				Box Groups
			</div>
			<div class="button">
				Playlists
			</div>
			<a href="content.php" class="button">
				Content
			</a>
			<a href="layouts.php" class="button">
				Layouts
			</a>
			<a href="home.php" class="button">
				Back to Home
			</a>
		</div>
	</div>
	<?php require('includes/scripts.php'); ?>
</body>
</html>