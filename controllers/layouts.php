<?php

require_once('includes/auth-login.php');
require_once('includes/init-database.php');
require_once('includes/init-session.php');
require_once('includes/utilities.php');

if (!isset($_SESSION['selected_company']) || empty($_SESSION['selected_company'])) {
	die('Missing company ID!');
}

if (!empty($_POST['name']) && !empty($_POST['width']) && !empty($_POST['height'])) {
	$z_companyid_pk = $_SESSION['selected_company']['z_companyid_pk'];
	if (!empty($_POST['regions'])) {
	}
}

?>