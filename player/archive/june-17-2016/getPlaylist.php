<?php
	header('Content-Type: application/json');
	die(file_get_contents('../playlists/playlist.json'));
?>