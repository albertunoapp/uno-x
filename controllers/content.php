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

// TODO: Also support videos
if ($_POST['request'] == 'uploadContent') {
	if (!isset($_FILES['content_file']) || empty($_FILES['content_file'])) {
		jsonError('Missing file!');
	}
	$z_accountid_pk = $_SESSION['selected_company']['z_accountid_pk'];
	$filesize = $_FILES['content_file']['size']; // Filesize in bytes
	$image_dimensions = @getimagesize($_FILES['content_file']['tmp_name']);
	if ($image_dimensions === FALSE) {
		jsonError('Uploaded file was not an image!');
	}
	$width = $image_dimensions[0];
	$height = $image_dimensions[1];
	$query = "INSERT INTO ux_content_mst (z_accountid_fk, content_type, url, width, height, filesize, date_added, date_modified) VALUES (?, 'image', 'placeholder', ?, ?, ?, ?, ?);";
	$stmt = $mysqli->prepare($query);
	$current_date = date("Y-m-d H:i:s");
	$stmt->bind_param('iiiiss', $z_accountid_pk, $width, $height, $filesize, $current_date, $current_date);
	$stmt->execute();
	$z_contentid_pk = $stmt->insert_id;
	$stmt->close();
	if ($z_contentid_pk === 0) {
		jsonError('Database error.');
	}
	$content_file_extension = pathinfo($_FILES['content_file']['name'], PATHINFO_EXTENSION);
	$content_filename = $z_contentid_pk . '.' . $content_file_extension;
	if (!move_uploaded_file($_FILES['content_file']['tmp_name'], 'uploaded-content/' . $content_filename)) {
		// Failed to move file
		$query = "DELETE FROM ux_content_mst WHERE z_contentid_pk = ? LIMIT 1;";
		$stmt = $mysqli->prepare($query);
		$stmt->bind_param('i', $z_contentid_pk);
		$stmt->execute();
		$stmt->close();
		jsonError('Encountered a server error while saving file.');
	}
	$query = "UPDATE ux_content_mst SET url = ? WHERE z_contentid_pk = ? LIMIT 1;";
	$stmt = $mysqli->prepare($query);
	$url = $path . 'uploaded-content/' . $content_filename;
	$stmt->bind_param('si', $url, $z_contentid_pk);
	$stmt->execute();
	$stmt->close();
	die(json_encode(array(
		'result' => 'success',
		'new_content' => array(
			'z_contentid_pk' => $z_contentid_pk,
			'url' => $url,
		),
	)));
} else if ($_POST['request'] == 'getContent') {
	$payload = $_POST['payload'];
	$z_accountid_pk = $_SESSION['selected_company']['z_accountid_pk'];
	$offset = 0;
	if (!empty($payload['offset']) && is_numeric($payload['offset'])) {
		$offset = intval($payload['offset']) * 8;
	}
	$query = "SELECT z_contentid_pk, url FROM ux_content_mst WHERE z_accountid_fk = ? AND deleted = 0 ORDER BY z_contentid_pk DESC LIMIT ?, 9;";
	$stmt = $mysqli->prepare($query);
	$stmt->bind_param('ii', $z_accountid_pk, $offset);
	$stmt->execute();
	$stmt->bind_result($z_contentid_pk, $url);
	$content = array();
	$more_next_page = false;
	while ($stmt->fetch()) {
		if (count($content) >= 8) {
			$more_next_page = true;
			break;
		}
		$content[] = array(
			'z_contentid_pk' => $z_contentid_pk,
			'url' => $url,
		);
	}
	$stmt->close();
	die(json_encode(array(
		'result' => 'success',
		'content' => $content,
		'more_next_page' => $more_next_page,
	)));
} else {
	jsonError('Unknown request!');
}

?>