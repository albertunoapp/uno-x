<?php

require_once('includes/init-session.php');
require_once('includes/language.php');
$login_message = FALSE;
if (!empty($_SESSION['login_message'])) {
	$login_message = $_SESSION['login_message'];
}
$_SESSION = array();

?>
<html>
<head>
	<title>Uno-X</title>
	<?php require('includes/head.php'); ?>
</head>
<body>
	<div class="vertical-center-wrapper">
		<div class="vertical-center-content">
			<div class="wrapper center">
				<div class="logo-large">
					<img src="<?= $path; ?>images/logo.png">
				</div>
				<?php if ($login_message) { ?>
				<div class="small-link">
					<div>
						<?= $login_message ?>
					</div>
				</div>
				<?php } ?>
				<div class="button-list login">
					<div class="form-row">
						<input type="text" placeholder="Email" class="email">
					</div>
					<div class="form-row">
						<input type="password" placeholder="Password" class="password">
					</div>
				</div>
				<div class="button-list">
					<div class="button">
						Log In
					</div>
				</div>
				<div class="small-link">
					<?php
					if (!isFr()) {
						?>
					<a href="<?= $path; ?>fr/index.php">Vue en Français</a>
						<?php
					} else {
						?>
					<a href="<?= $path; ?>en/index.php">Switch to English</a>
						<?php
					}
					?>
				</div>
			</div>
		</div>
	</div>
	<?php require('includes/scripts.php'); ?>
	<script src="<?= $path; ?>js/controllers/login.js" type="text/javascript"></script>
</body>
</html>