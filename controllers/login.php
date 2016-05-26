<?php

require_once('includes/init-database.php');
require_once('includes/init-session.php');
require_once('includes/utilities.php');

if (!empty($_POST['email']) && !empty($_POST['password'])) {
	$query = "SELECT z_contactid_pk, password, type FROM contact_mst WHERE contact_prmemail = ?;";
	$stmt = $mysqli->prepare($query);
	$stmt->bind_param('s', $_POST['email']);
	$stmt->execute();
	$stmt->bind_result($z_contactid_pk, $password, $type);
	if (!$stmt->fetch()) {
		die(json_encode(array(
			'result' => 'error',
			'message' => 'No such user!',
		)));
	}
	$stmt->close();
	if ($password == $_POST['password']) {
		$_SESSION['z_contactid_pk'] = $z_contactid_pk;
		$_SESSION['salt'] = random_str(32);
		$_SESSION['password'] = md5($password . $_SESSION['salt']);
		$_SESSION['email'] = $_POST['email'];
		$_SESSION['type'] = $type;
		if ($type != 'Staff') {
			$query = "SELECT c.z_companyid_pk, c.company_name, c.display_name, p.privilege_type FROM contact_mst u, priviledge_mst p, company_mst c WHERE u.z_contactid_pk = ? AND p.z_contactid_fk = u.z_contactid_pk AND p.z_companyid_fk = c.z_companyid_pk LIMIT 0, 1000;";
			$stmt = $mysqli->prepare($query);
			$stmt->bind_param('i', $z_contactid_pk);
			$stmt->execute();
			$stmt->bind_result($z_companyid_pk, $company_name, $display_name, $privilege_type);
			$_SESSION['companies'] = array();
			while ($stmt->fetch()) {
				$_SESSION['companies'][] = array(
					'z_companyid_pk' => $z_companyid_pk,
					'company_name' => $company_name,
					'display_name' => $display_name,
					'privilege_type' => $privilege_type,
				);
			}
			$stmt->close();
		}
		die(json_encode(array(
			'result' => 'success',
			'message' => 'Login successful!',
			'url' => 'home.php',
		)));
	} else {
		die(json_encode(array(
			'result' => 'error',
			'message' => 'Wrong password!',
		)));
	}
} else {
	die(json_encode(array(
		'result' => 'error',
		'message' => 'Missing email or password!',
	)));
}

?>