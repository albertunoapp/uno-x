<?php

require_once('includes/init-database.php');
require_once('includes/init-session.php');

function sessionExpired() {
	$_SESSION = array();
	$_SESSION['login_message'] = 'Session Expired.';
	header('Location: index.php');
	die();
}

function passwordChanged() {
	$_SESSION = array();
	$_SESSION['login_message'] = 'Password Changed.';
	header('Location: index.php');
	die();
}

if (!empty($_SESSION['email']) && !empty($_SESSION['password']) && !empty($_SESSION['salt'])) {
	$query = "SELECT contact_prmemail, password FROM contact_mst WHERE z_contactid_pk = ?;";
	$stmt = $mysqli->prepare($query);
	$stmt->bind_param('i', $_SESSION['z_contactid_pk']);
	$stmt->execute();
	$stmt->bind_result($contact_prmemail, $password);
	if (!$stmt->fetch()) {
		sessionExpired();
	}
	$stmt->close();
	if ($_SESSION['password'] == md5($password . $_SESSION['salt'])) {
		$_SESSION['email'] = $contact_prmemail;
		// Successful authentication!
	} else {
		passwordChanged();
	}
} else {
	sessionExpired();
}

?>