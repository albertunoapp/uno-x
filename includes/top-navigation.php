	<div class="top-navigation">
		<div class="logo-small">
			<img src="<?= $path; ?>images/logo.png">
		</div>
		<div class="navigation-links-left">
			<div class="nav-item">
				<a href="home.php">Home</a>
			</div>
		</div>
		<div class="navigation-links-right">
			<div class="nav-item">
				<a href="index.php">Log Out</a>
			</div>
			<div class="nav-item logged-in">
				Logged in as <?= $_SESSION['email']; ?>
			</div>
		</div>
	</div>