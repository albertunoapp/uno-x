<?php

require_once('includes/auth-login.php');
require_once('includes/init-session.php');
require_once('includes/utilities.php');

function createAccount($z_companyid_pk, $company_name) {
	global $mysqli;
	$query = "INSERT IGNORE INTO ux_account_mst (z_companyid_fk, account_name, date_added, date_modified) VALUES (?, ?, ?, ?);";
	$stmt = $mysqli->prepare($query);
	$current_date = date("Y-m-d H:i:s");
	$stmt->bind_param('isss', $z_companyid_pk, $company_name, $current_date, $current_date);
	$stmt->execute();
	$stmt->close();
	$query = "SELECT z_accountid_pk FROM ux_account_mst WHERE z_companyid_fk = ? LIMIT 0, 1;";
	$stmt = $mysqli->prepare($query);
	$stmt->bind_param('i', $z_companyid_pk);
	$stmt->execute();
	$stmt->bind_result($z_accountid_pk);
	if ($stmt->fetch()) {
		$_SESSION['selected_company']['z_accountid_pk'] = $z_accountid_pk;
	}
	$stmt->close();
}

if (isset($_POST['z_companyid_pk'])) {
	$z_companyid_pk = intval($_POST['z_companyid_pk']);
	if (is_numeric($_POST['z_companyid_pk']) && $z_companyid_pk == $_POST['z_companyid_pk']) {
		if ($_SESSION['type'] == 'Staff') {
			$_SESSION['selected_company'] = array(
				'z_companyid_pk' => $_POST['z_companyid_pk'],
				'company_name' => $_POST['company_name'],
			);
			createAccount($_POST['z_companyid_pk'], $_POST['company_name']);
			die(json_encode(array(
				'result' => 'success',
				'message' => 'Company successfully selected!',
			)));
		} else {
			for ($i = 0; $i < count($_SESSION['companies']); $i++) {
				if ($_SESSION['companies'][$i]['z_companyid_pk'] == $_POST['z_companyid_pk']) {
					$_SESSION['selected_company'] = $_SESSION['companies'][$i];
					createAccount($_SESSION['selected_company']['z_companyid_pk'], $_SESSION['selected_company']['company_name']);
					die(json_encode(array(
						'result' => 'success',
						'message' => 'Company successfully selected!',
					)));
				}
			}
			jsonError('You don\'t have access to this company!');
		}
	} else {
		jsonError('Invalid company ID!');
	}
} else {
	jsonError('Missing company ID!');
}

?>