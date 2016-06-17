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

if ($_POST['request'] == 'savePlaylist') {
	$z_accountid_pk = $_SESSION['selected_company']['z_accountid_pk'];
	$current_date = date("Y-m-d H:i:s");
	$payload = $_POST['payload'];
	$retval = $payload['playlist'];
	$z_playlistid_pk = 0;
	$required_content_ids = array();
	$required_content = array();

	// Add new playlist
	if (empty($payload['playlist']['z_playlistid_pk']) || !is_numeric($payload['playlist']['z_playlistid_pk'])) {
		$query = "INSERT INTO ux_playlist_mst (z_accountid_fk, playlist_version, required_player_version, date_added, date_modified) VALUES (?, ?, ?, ?, ?);";
		$stmt = $mysqli->prepare($query);
		$stmt->bind_param('issss', $z_accountid_pk, $payload['playlist']['playlist_version'], $payload['playlist']['required_player_version'], $current_date, $current_date);
		$stmt->execute();
		$z_playlistid_pk = $stmt->insert_id;
		$retval['z_playlistid_pk'] = '' . $z_playlistid_pk;
		$stmt->close();
	// Update existing layout
	} else {
		$query = "UPDATE ux_playlist_mst SET playlist_version = ?, required_player_version = ?, date_modified = ? WHERE z_playlistid_pk = ? AND z_accountid_fk = ? AND deleted = '0';";
		$stmt = $mysqli->prepare($query);
		$stmt->bind_param('sssii', $payload['playlist']['playlist_version'], $payload['playlist']['required_player_version'], $current_date, $payload['playlist']['z_playlistid_pk'], $z_accountid_pk);
		$stmt->execute();
		$stmt->close();
		$z_playlistid_pk = $payload['playlist']['z_playlistid_pk'];
	}
	// Process regions / merged regions
	for ($i = 0; $i < count($payload['playlist']['playlists']); $i++) {
		$subplaylist = $payload['playlist']['playlists'][$i];
		// Add new subplaylist
		if (empty($subplaylist['z_subplaylistid_pk']) || !is_numeric($subplaylist['z_subplaylistid_pk'])) {
			$query = "INSERT INTO ux_subplaylist_mst (z_playlistid_fk, date_added, date_modified) VALUES (?, ?, ?);";
			$stmt = $mysqli->prepare($query);
			$stmt->bind_param('iss', $z_playlistid_pk, $current_date, $current_date);
			$stmt->execute();
			$z_subplaylistid_pk = $stmt->insert_id;
			$retval['playlists'][$i]['z_subplaylistid_pk'] = '' . $z_subplaylistid_pk;
			$stmt->close();
		// Update existing subplaylist
		} else {
			$query = "UPDATE ux_subplaylist_mst SET date_modified = ? WHERE z_subplaylistid_pk = ? AND z_playlistid_fk = ? AND deleted = '0';";
			$stmt = $mysqli->prepare($query);
			$stmt->bind_param('sii', $current_date, $subplaylist['z_subplaylistid_pk'], $z_playlistid_pk);
			$stmt->execute();
			$stmt->close();
			$z_subplaylistid_pk = $subplaylist['z_subplaylistid_pk'];
		}
		// Process entries
		for ($j = 0; $j < count($subplaylist['entries']); $j++) {
			$entry = $subplaylist['entries'][$j];
			// Add new entry
			if (empty($entry['z_playlistentryid_pk']) || !is_numeric($entry['z_playlistentryid_pk'])) {
				$query = "INSERT INTO ux_playlist_entry_mst (z_subplaylistid_fk, z_contentid_fk, z_regionid_fk, duration, order_index, date_added, date_modified) VALUES (?, ?, ?, ?, ?, ?, ?);";
				$stmt = $mysqli->prepare($query);
				$stmt->bind_param('iiiiiss', $z_subplaylistid_pk, $entry['z_contentid_fk'], $entry['z_regionid_fk'], $entry['duration'], $entry['order_index'], $current_date, $current_date);
				$stmt->execute();
				$z_playlistentryid_pk = $stmt->insert_id;
				$retval['playlists'][$i]['entries'][$j]['z_playlistentryid_pk'] = '' . $z_playlistentryid_pk;
				$stmt->close();
			// Update existing entry
			} else {
				$query = "UPDATE ux_playlist_entry_mst SET z_contentid_fk = ?, z_regionid_fk = ?, duration = ?, order_index = ?, date_modified = ? WHERE z_playlistentryid_pk = ? AND z_subplaylistid_fk = ? AND deleted = '0';";
				$stmt = $mysqli->prepare($query);
				$stmt->bind_param('iiisii', $entry['z_contentid_fk'], $entry['z_regionid_fk'], $entry['duration'], $entry['order_index'], $current_date, $entry['z_playlistentryid_pk'], $z_subplaylistid_pk);
				$stmt->execute();
				$stmt->close();
				$z_playlistentryid_pk = $entry['z_playlistentryid_pk'];
			}
			if (!in_array($entry['z_contentid_fk'], $required_content_ids) && $entry['z_contentid_fk'] > 0) {
				$required_content_ids[] = $entry['z_contentid_fk'];
				$required_content[] = array('z_contentid_pk' => $entry['z_contentid_fk'], 'url' => $entry['url']);
			}
		}
	}
	// Generate playlist.json
	$retval['last_modified'] = $current_date;
	$retval['required_content'] = $required_content;
	file_put_contents('playlists/playlist.json', json_encode($retval, JSON_PRETTY_PRINT));
	die(json_encode(array(
		'result' => 'success',
		'saved_playlist' => $retval,
	)));
} else {
	jsonError('Unknown request!');
}

?>