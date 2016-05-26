<?php

// CONNECT TO DATABASE
$mysqli = mysqli_connect('172.16.13.12', 'dmbdemo', 'W3UG6us79oBhtqPd') or fatalError('Unable to connect with server');
mysqli_select_db($mysqli, 'dmbdemo_unoapp') or fatalError('Unable to select database');

?>