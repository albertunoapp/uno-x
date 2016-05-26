<?php

require_once('includes/auth-login.php');
require_once('includes/init-database.php');
require_once('includes/init-session.php');
require_once('includes/utilities.php');

if ($_SESSION['type'] != 'Staff') {
	die(json_encode(array(
		'result' => 'error',
		'message' => 'You do not have access to this feature!',
	)));
}

if (!empty($_POST['q']) || $_POST['q'] === '0') {
	$like = '%' . addcslashes($_POST['q'], '%_') . '%';
	$q = intval($_POST['q']);
	if (is_numeric($_POST['q']) && $q == $_POST['q']) {
		$query = "SELECT z_companyid_pk, company_name, display_name FROM company_mst WHERE status = 1 AND (z_companyid_pk = ? OR company_name LIKE ? OR display_name LIKE ?) LIMIT 0, 8;";
		$stmt = $mysqli->prepare($query);
		$stmt->bind_param('iss', $_POST['q'], $like, $like);
	} else {
		$query = "SELECT z_companyid_pk, company_name, display_name FROM company_mst WHERE status = 1 AND (company_name LIKE ? OR display_name LIKE ?) LIMIT 0, 8;";
		$stmt = $mysqli->prepare($query);
		$stmt->bind_param('ss', $like, $like);
	}
	$stmt->execute();
	$stmt->bind_result($z_companyid_pk, $company_name, $display_name);
	$companies = array();
	while ($stmt->fetch()) {
		$companies[] = array(
			'z_companyid_pk' => $z_companyid_pk,
			'company_name' => $company_name,
			'display_name' => $display_name,
		);
	}
	$stmt->close();
	die(json_encode(array(
		'result' => 'success',
		'message' => 'Search successful!',
		'companies' => $companies,
	)));
} else {
	die(json_encode(array(
		'result' => 'error',
		'message' => 'Missing search criteria!',
	)));
}

?>