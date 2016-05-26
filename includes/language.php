<?php

if (strpos($_SERVER['REQUEST_URI'], $root.'fr/') === 0) {
	$lang = 'fr/';
} else {
	$lang = 'en/';
}

function isFr() {
	global $lang;
	return $lang == 'fr/';
}
function isEn() {
	global $lang;
	return $lang == 'en/';
}

function fr($text) {
	if (isFr()) {
		return htmlentities($text);
	} else {
		return '';
	}
}
function en($text) {
	if (!isFr()) {
		return htmlentities($text);
	} else {
		return '';
	}
}

?>