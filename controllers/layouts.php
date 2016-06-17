<?php

require_once('includes/auth-login.php');
require_once('includes/init-database.php');
require_once('includes/init-session.php');
require_once('includes/utilities.php');

if (!isset($_SESSION['selected_company']) || empty($_SESSION['selected_company'])) {
	jsonError('Missing company ID!');
}

if (!isset($_POST['request'])) {
	jsonError('Missing request!');
}

if ($_POST['request'] == 'saveLayout') {
	$payload = $_POST['payload'];
	$retval = $payload;
	if (!empty($payload['name']) && !empty($payload['width']) && !empty($payload['height']) && is_numeric($payload['width']) && is_numeric($payload['height'])) {
		$z_accountid_pk = $_SESSION['selected_company']['z_accountid_pk'];
		// Save new layout
		if (empty($payload['z_layoutid_pk']) || !is_numeric($payload['z_layoutid_pk'])) {
			// Check if name has been already taken
			$query = "SELECT z_layoutid_pk FROM ux_layout_mst WHERE layout_name = ? AND z_accountid_fk = ? AND deleted = 0 LIMIT 0, 1;";
			$stmt = $mysqli->prepare($query);
			$stmt->bind_param('si', $payload['name'], $z_accountid_pk);
			$stmt->execute();
			$stmt->bind_result($z_layoutid_pk);
			if ($stmt->fetch()) {
				jsonError('Layout name already exists! Please set a unique layout name.');
			}
			$stmt->close();

			$query = "INSERT INTO ux_layout_mst (z_accountid_fk, layout_name, width, height, date_added, date_modified) VALUES (?, ?, ?, ?, ?, ?);";
			$stmt = $mysqli->prepare($query);
			$current_date = date("Y-m-d H:i:s");
			$stmt->bind_param('isiiss', $z_accountid_pk, $payload['name'], $payload['width'], $payload['height'], $current_date, $current_date);
			$stmt->execute();
			$z_layoutid_pk = $stmt->insert_id;
			$retval['z_layoutid_pk'] = '' . $z_layoutid_pk;
			$stmt->close();
		// Update existing layout
		} else {
			// Check if name has been already taken
			$query = "SELECT z_layoutid_pk FROM ux_layout_mst WHERE layout_name = ? AND z_accountid_fk = ? AND z_layoutid_pk != ? AND deleted = 0 LIMIT 0, 1;";
			$stmt = $mysqli->prepare($query);
			$stmt->bind_param('sii', $payload['name'], $z_accountid_pk, $payload['z_layoutid_pk']);
			$stmt->execute();
			$stmt->bind_result($z_layoutid_pk);
			if ($stmt->fetch()) {
				jsonError('Layout name already exists! Please set a unique layout name.');
			}
			$stmt->close();

			$query = "UPDATE ux_layout_mst SET layout_name = ?, width = ?, height = ?, date_modified = ? WHERE z_layoutid_pk = ? AND z_accountid_fk = ? AND deleted = '0';";
			$stmt = $mysqli->prepare($query);
			$current_date = date("Y-m-d H:i:s");
			$stmt->bind_param('siisii', $payload['name'], $payload['width'], $payload['height'], $current_date, $payload['z_layoutid_pk'], $z_accountid_pk);
			$stmt->execute();
			$stmt->close();
			$z_layoutid_pk = $payload['z_layoutid_pk'];
			$retval['z_layoutid_pk'] = '' . $z_layoutid_pk;
		}
		if (!empty($payload['regions']) && is_array($payload['regions'])) {
			for ($i = 0; $i < count($payload['regions']); $i++) {
				$current_region = $payload['regions'][$i];
				// New region
				if (empty($current_region['z_regionid_pk']) || !is_numeric($current_region['z_regionid_pk'])) {
					// Insert new region
					$query = "INSERT INTO ux_region_mst (z_layoutid_fk, region_name, original_width, original_height, date_added, date_modified) VALUES (?, ?, ?, ?, ?, ?);";
					$stmt = $mysqli->prepare($query);
					$current_date = date("Y-m-d H:i:s");
					$stmt->bind_param('isiiss', $z_layoutid_pk, $current_region['name'], $current_region['width'], $current_region['height'], $current_date, $current_date);
					$stmt->execute();
					$z_regionid_pk = $stmt->insert_id;
					$retval['regions'][$i]['z_regionid_pk'] = '' . $z_regionid_pk;
					$stmt->close();
					// Associate region with layout
					$query = "INSERT INTO ux_layout_region_mst (z_regionid_fk, z_layoutid_fk, width, height, x, y, z, date_added, date_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
					$stmt = $mysqli->prepare($query);
					$current_date = date("Y-m-d H:i:s");
					$stmt->bind_param('iiiiiiiss', $z_regionid_pk, $z_layoutid_pk, $current_region['width'], $current_region['height'], $current_region['x'], $current_region['y'], $current_region['z'], $current_date, $current_date);
					$stmt->execute();
					$z_layoutregionid_pk = $stmt->insert_id;
					$retval['regions'][$i]['z_layoutregionid_pk'] = '' . $z_layoutregionid_pk;
					$retval['regions'][$i]['z_layoutid_fk'] = '' . $z_layoutid_pk;
					$stmt->close();
				// Existing region
				} else {
					// This is the original region associated with its original layout
					if (!empty($current_region['z_layoutid_fk']) && $current_region['z_layoutid_fk'] == $z_layoutid_pk) {
						$query = "UPDATE ux_region_mst SET region_name = ?, original_width = ?, original_height = ?, date_modified = ? WHERE z_regionid_pk = ? AND z_layoutid_fk = ? AND deleted = '0';";
						$stmt = $mysqli->prepare($query);
						$current_date = date("Y-m-d H:i:s");
						$stmt->bind_param('siisii', $current_region['name'], $current_region['width'], $current_region['height'], $current_date, $current_region['z_regionid_pk'], $current_region['z_layoutid_fk']);
						$stmt->execute();
						$stmt->close();
					}
					// Associating existing region with new layout
					if (!empty($current_region['z_regionid_pk']) && empty($current_region['z_layoutid_fk']) && empty($current_region['z_layoutregionid_pk'])) {
						$query = "INSERT INTO ux_layout_region_mst (z_regionid_fk, z_layoutid_fk, width, height, x, y, z, date_added, date_modified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);";
						$stmt = $mysqli->prepare($query);
						$current_date = date("Y-m-d H:i:s");
						$stmt->bind_param('iiiiiiiss', $current_region['z_regionid_pk'], $z_layoutid_pk, $current_region['width'], $current_region['height'], $current_region['x'], $current_region['y'], $current_region['z'], $current_date, $current_date);
						$stmt->execute();
						$z_layoutregionid_pk = $stmt->insert_id;
						$retval['regions'][$i]['z_layoutregionid_pk'] = '' . $z_layoutregionid_pk;
						$retval['regions'][$i]['z_layoutid_fk'] = '' . $z_layoutid_pk;
						$stmt->close();
					// Updating existing region with existing layout association
					} else if (!empty($current_region['z_layoutregionid_pk'])) {
						$query = "UPDATE ux_layout_region_mst SET width = ?, height = ?, x = ?, y = ?, z = ?, date_modified = ? WHERE z_layoutregionid_pk = ? AND z_regionid_fk = ? AND z_layoutid_fk = ? AND deleted = '0';";
						$stmt = $mysqli->prepare($query);
						$current_date = date("Y-m-d H:i:s");
 						$stmt->bind_param('iiiiisiii', $current_region['width'], $current_region['height'], $current_region['x'], $current_region['y'], $current_region['z'], $current_date, $current_region['z_layoutregionid_pk'], $current_region['z_regionid_pk'], $current_region['z_layoutid_fk']);
						$stmt->execute();
						$stmt->close();
					}
				}
			}
		}
		// Delete regions
		if (!empty($payload['deleted_regions']) && is_array($payload['deleted_regions'])) {
			for ($i = 0; $i < count($payload['deleted_regions']); $i++) {
				$current_region = $payload['deleted_regions'][$i];
				// This is the original region associated with its original layout
				if (!empty($current_region['z_layoutid_fk']) && $current_region['z_layoutid_fk'] == $z_layoutid_pk) {
					$query = "UPDATE ux_region_mst SET deleted = '1' WHERE z_regionid_pk = ? AND z_layoutid_fk = ? AND deleted = '0';";
					$stmt = $mysqli->prepare($query);
					$stmt->bind_param('ii', $current_region['z_regionid_pk'], $current_region['z_layoutid_fk']);
					$stmt->execute();
					$stmt->close();
				}
				$query = "UPDATE ux_layout_region_mst SET deleted = '1' WHERE z_layoutregionid_pk = ? AND z_regionid_fk = ? AND z_layoutid_fk = ? AND deleted = '0';";
				$stmt = $mysqli->prepare($query);
				$stmt->bind_param('iii', $current_region['z_layoutregionid_pk'], $current_region['z_regionid_pk'], $current_region['z_layoutid_fk']);
				$stmt->execute();
				$stmt->close();
			}
		}
		die(json_encode(array(
			'result' => 'success',
			'saved_layout' => $retval,
		)));
	} else {
		jsonError('Invalid or missing parameters!');
	}
} else if ($_POST['request'] == 'getLayouts') {
	$payload = $_POST['payload'];
	$z_accountid_pk = $_SESSION['selected_company']['z_accountid_pk'];
	$offset = 0;
	$results_per_page = 8;
	if (!empty($payload['results_per_page']) && is_numeric($payload['results_per_page'])) {
		$results_per_page = intval($payload['results_per_page']);
	}
	$results_per_page_plus_one = $results_per_page + 1;
	if (!empty($payload['offset']) && is_numeric($payload['offset'])) {
		$offset = intval($payload['offset']) * $results_per_page;
	}
	$query = "SELECT z_layoutid_pk, layout_name FROM ux_layout_mst WHERE z_accountid_fk = ? AND deleted = 0 ORDER BY z_layoutid_pk DESC LIMIT ?, ?;";
	$stmt = $mysqli->prepare($query);
	$stmt->bind_param('iii', $z_accountid_pk, $offset, $results_per_page_plus_one);
	$stmt->execute();
	$stmt->bind_result($z_layoutid_pk, $layout_name);
	$layouts = array();
	$more_next_page = false;
	while ($stmt->fetch()) {
		if (count($layouts) >= $results_per_page) {
			$more_next_page = true;
			break;
		}
		$layouts[] = array(
			'z_layoutid_pk' => $z_layoutid_pk,
			'layout_name' => $layout_name,
		);
	}
	$stmt->close();
	die(json_encode(array(
		'result' => 'success',
		'layouts' => $layouts,
		'more_next_page' => $more_next_page,
	)));
} else if ($_POST['request'] == 'openLayout') {
	$payload = $_POST['payload'];
	if (empty($payload['z_layoutid_pk'])) {
		jsonError('Invalid or missing layout ID!');
	}
	$z_accountid_pk = $_SESSION['selected_company']['z_accountid_pk'];
	$query = "SELECT layout_name, width, height FROM ux_layout_mst WHERE z_layoutid_pk = ? AND z_accountid_fk = ? AND deleted = 0 LIMIT 0, 1;";
	$stmt = $mysqli->prepare($query);
	$stmt->bind_param('ii', $payload['z_layoutid_pk'], $z_accountid_pk);
	$stmt->execute();
	$stmt->bind_result($layout_name, $layout_width, $layout_height);
	if ($stmt->fetch()) {
		$layout = array(
			'z_layoutid_pk' => '' . $payload['z_layoutid_pk'],
			'name' => $layout_name,
			'width' => '' . $layout_width,
			'height' => '' . $layout_height,
			'regions' => array(),
		);
	} else {
		jsonError('Layout not found!');
	}
	$stmt->close();
	$query = "SELECT r.`z_regionid_pk`, lr.`z_layoutregionid_pk`, lr.`z_layoutid_fk`, r.`region_name`, lr.`width`, lr.`height`, lr.`x`, lr.`y`, lr.`z` FROM ux_region_mst r, ux_layout_region_mst lr WHERE lr.`z_layoutid_fk` = ? AND lr.`z_regionid_fk` = r.`z_regionid_pk` AND r.`deleted` = 0 AND lr.`deleted` = 0 ORDER BY lr.`z`, lr.`z_layoutregionid_pk` LIMIT 0, 1000;";
	$stmt = $mysqli->prepare($query);
	$stmt->bind_param('i', $payload['z_layoutid_pk']);
	$stmt->execute();
	$stmt->bind_result($z_regionid_pk, $z_layoutregionid_pk, $z_layoutid_fk, $region_name, $region_width, $region_height, $region_x, $region_y, $region_z);
	while ($stmt->fetch()) {
		$layout['regions'][] = array(
			'z_regionid_pk' => $z_regionid_pk,
			'z_layoutregionid_pk' => $z_layoutregionid_pk,
			'z_layoutid_fk' => $z_layoutid_fk,
			'name' => $region_name,
			'width' => $region_width,
			'height' => $region_height,
			'x' => $region_x,
			'y' => $region_y,
			'z' => $region_z,
		);
	}
	$stmt->close();
	die(json_encode(array(
		'result' => 'success',
		'opened_layout' => $layout,
	)));
} else if ($_POST['request'] == 'deleteLayout') {
	$payload = $_POST['payload'];
	if (empty($payload['z_layoutid_pk'])) {
		jsonError('Invalid or missing layout ID!');
	}
	$z_accountid_pk = $_SESSION['selected_company']['z_accountid_pk'];
	$query = "SELECT z_layoutid_pk FROM ux_layout_mst WHERE z_layoutid_pk = ? AND z_accountid_fk = ? AND deleted = 0 LIMIT 0, 1;";
	$stmt = $mysqli->prepare($query);
	$stmt->bind_param('ii', $payload['z_layoutid_pk'], $z_accountid_pk);
	$stmt->execute();
	$stmt->bind_result($z_layoutid_pk);
	if (!$stmt->fetch()) {
		jsonError('Layout not found!');
	}
	$stmt->close();
	$query = "UPDATE ux_layout_mst SET deleted = 1 WHERE z_layoutid_pk = ? AND z_accountid_fk = ? AND deleted = 0 LIMIT 1;";
	$stmt = $mysqli->prepare($query);
	$stmt->bind_param('ii', $payload['z_layoutid_pk'], $z_accountid_pk);
	$stmt->execute();
	$stmt->close();
	die(json_encode(array(
		'result' => 'success',
		'message' => 'Successfully deleted layout!',
	)));
} else {
	jsonError('Unknown request!');
}

?>