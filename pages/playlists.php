<?php

require_once('includes/auth-login.php');

?>
<!DOCTYPE HTML>
<html>
<head>
	<title>Uno-X</title>
	<?php require('includes/head.php'); ?>
	<link href='https://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>
	<style>
	html.col-resize-cursor *, body.col-resize-cursor * {
		cursor: col-resize !important;
	}

	body {
		overflow-x: hidden;
		font-family: 'Open Sans', 'Arial', 'Helvetica', 'sans-serif';
		font-size: 12px;
	}

	.gui {
		position: absolute;
		left: 0;
		top: 0;
		background-color: #fff;
		width: 100%;
		min-height: 100%;
		color: #000;
		-webkit-user-select: none;
		-moz-user-select: none;
		-ms-user-select: none;
		-o-user-select: none;
		user-select: none;
	}

	/* TIMELINE RULER */

	.segment-marker {
		position: absolute;
		top: 0;
		width: 11px;
		height: 20px;
		border: 1px solid #000;
		background-color: rgba(0,0,0,0.5);
		box-sizing: border-box;
		z-index: 3;
		pointer-events: none;
	}

	.timeline-marker {
		position: absolute;
		top: 0;
		width: 11px;
		height: 27px;
		border: 1px solid #f00;
		background-color: rgba(255,0,0,0.25);
		box-sizing: border-box;
		z-index: 4;
		pointer-events: none;
	}

	.timeline-marker-line {
		position: absolute;
		top: 27px;
		width: 6px;
		border-right: 1px solid #f00;
		box-sizing: border-box;
		z-index: 4;
		pointer-events: none;
	}

	.ruler {
		background-color: #ddd;
		border-bottom: 1px solid #999;
		cursor: pointer;
	}

	.timeline-label-wrapper {
		white-space: nowrap;
		margin-left: 100px;
		height: 17px;
	}

	.timeline-label {
		display: inline-block;
		width: 100px;
		text-align: center;
	}

	.timeline-ticks {
		height: 11px;
		background-image: url('../images/ticks.png');
		background-repeat: repeat-x;
		background-position: left top;
		margin-left: 150px;
	}

	/* LAYER SECTION */

	.layers:after {
		content: '';
		clear: both;
		display: table;
	}

	.layer-labels {
		display: block;
		width: 150px;
		float: left;
	}

	.layer-timeline {
		white-space: nowrap;
		background-image: url('../images/segment-background.png');
		overflow-x: scroll;
	}

	.layout-label {
		display: block;
		width: 150px;
		height: 19px;
		text-align: left;
		padding-left: 10px;
		border-right: 1px solid #ddd;
		border-bottom: 1px solid #ddd;
		box-sizing: border-box;
		background-color: #eee;
		cursor: default;
	}

	.playlist-label {
		display: block;
		width: 150px;
		height: 19px;
		text-align: left;
		padding-left: 10px;
		border-right: 1px solid #ddd;
		border-bottom: 1px solid #ddd;
		box-sizing: border-box;
		background-color: #ccc;
		cursor: default;
	}

	.layer-label {
		display: block;
		width: 150px;
		height: 19px;
		text-align: right;
		border-right: 1px solid #ddd;
		padding-right: 10px;
		border-bottom: 1px solid #ddd;
		box-sizing: border-box;
		background-color: #fff;
		cursor: default;
	}

	.layout-label.selected {
		color: #fff;
		background-color: #000;
		border-right: 1px solid #000;
		border-bottom: 1px solid #000;
	}

	.layer-label.selected {
		color: #fff;
		background-color: #000;
		border-right: 1px solid #000;
		border-bottom: 1px solid #000;
	}

	.layer-label-settings {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin-bottom: 4px;
		margin-right: 4px;
		background-image: url('../images/gear.png');
		cursor: pointer;
		vertical-align: bottom;
	}

	.playlist-icon {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin-bottom: 4px;
		margin-right: 4px;
		background-image: url('../images/folder.gif');
		cursor: pointer;
		vertical-align: bottom;
	}

	.layer-buttons {
		display: block;
		width: 150px;
		text-align: right;
		padding-right: 7px;
		box-sizing: border-box;
		height: 11px;
	}

	.gui .new-playlist {
		display: inline-block;
		width: 13px;
		height: 11px;
		margin-bottom: 4px;
		margin-right: 4px;
		background-image: url('../images/new-folder.png');
		cursor: pointer;
		vertical-align: bottom;
	}

	.new-layer {
		display: inline-block;
		width: 13px;
		height: 11px;
		margin-bottom: 4px;
		margin-right: 4px;
		background-image: url('../images/new-layer.png');
		cursor: pointer;
		vertical-align: bottom;
	}

	.layer-label-text {
		display: inline-block;
		width: 90px;
		text-align: left;
		overflow-x: hidden;
		vertical-align: bottom;
	}

	.playlist-label-text {
		display: inline-block;
		width: 120px;
		text-align: left;
		overflow-x: hidden;
		vertical-align: bottom;
	}

	.layer-label-tag {
		display: inline-block;
		width: 10px;
		height: 10px;
		margin-bottom: 3px;
		cursor: pointer;
		vertical-align: bottom;
	}

	.playlist-layer .playlist-layer-padding {
		display: block;
		height: 19px;
		border-bottom: 1px solid #000;
		box-sizing: border-box;
	}

	.layer-segment-wrapper {
		display: inline-block;
		height: 19px;
		text-align: left;
		border-left: 1px solid #000;
		vertical-align: bottom;
	}

	.layer-segment-empty {
		display: inline-block;
		background-color: #fff;
		height: 19px;
		border-right: 1px solid #000;
		border-bottom: 1px solid #000;
		box-sizing: border-box;
		background-image: url('../images/ticks2.png');
		background-repeat: repeat-x;
		background-position: -1px -7px;
		vertical-align: bottom;
		overflow: hidden;
	}

	.layer-segment-keyframe {
		display: inline-block;
		background-color: #ddd;
		height: 19px;
		border-right: 1px solid #000;
		border-bottom: 1px solid #000;
		box-sizing: border-box;
		background-image: url('../images/ticks2.png');
		background-repeat: repeat-x;
		background-position: -1px -7px;
		vertical-align: bottom;
		overflow: hidden;
	}

	.layer-layout .layer-segment-keyframe {
		background-color: #999;
	}

	.layer-padding {
		display: inline-block;
		height: 19px;
		vertical-align: bottom;
	}

	.layer-segment-empty .layer-segment-head {
		position: relative;
		width: 9px;
		height: 18px;
		margin-right: -9px;
		margin-bottom: -18px;
		background-color: #fff;
		background-image: url('../images/white-dot.png');
		background-repeat: no-repeat;
		background-position: 2px 10px;
		vertical-align: bottom;
		z-index: 2;
	}

	.layer-segment-keyframe .layer-segment-head {
		position: relative;
		width: 9px;
		height: 18px;
		margin-right: -9px;
		margin-bottom: -18px;
		background-color: #ddd;
		background-image: url('../images/black-dot.png');
		background-repeat: no-repeat;
		background-position: 2px 10px;
		vertical-align: bottom;
		z-index: 2;
	}

	.layer-layout .layer-segment-keyframe .layer-segment-head {
		background-color: #999;
	}

	.layer-segment-tail {
		float: right;
		width: 7px;
		height: 18px;
		background-image: url('../images/white-rectangle.png');
		background-repeat: no-repeat;
		background-position: 0 7px;
		vertical-align: bottom;
	}

	.col-resize {
		position: relative;
		display: inline-block;
		height: 18px;
		width: 1px;
		margin-left: 6px;
		cursor: col-resize;
		z-index: 5;
	}

	.col-resize.active {
		background-color: #000;
	}

	/* PROPERTIES PANE */

	.properties-pane-label {
		background-color: #666;
		border-top: 1px solid #000;
		border-bottom: 1px solid #000;
		color: #fff;
		padding-left: 20px;
		cursor: default;
	}

	.collapse, .expand {
		display: inline-block;
		height: 11px;
		width: 11px;
		line-height: 11px;
		text-align: center;
		cursor: pointer;
		border: 1px solid rgba(255,255,255,0.5);
	}

	.collapse:hover, .expand:hover {
		background-color: #fff;
		border: 1px solid #fff;
		color: #000;
	}

	.properties-pane-body {
		height: 80px;
		background-color: #ddd;
		padding: 20px;
		border-bottom: 1px solid #999;
	}

	.properties-pane .buttons {
		white-space: nowrap;
	}

	.properties-pane button {
		padding: 5px 20px;
		background-color: #eee;
		color: #000;
		border: 1px solid #000;
		cursor: pointer;
	}

	.properties-pane button:hover {
		background-color: #ccc;
	}

	.properties-pane .information {
		color: #999;
		line-height: 30px;
	}

	.properties-pane .information .information-bit {
		padding-right: 20px;
	}

	/* INSERT FRAME MODAL */

	.modal-overlay {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(255,255,255,0.75);
		z-index: 4;
	}

	.insert-frame-modal {
		position: absolute;
		width: 300px;
		height: 200px;
		top: 50%;
		left: 50%;
		margin-left: -150px;
		margin-top: -100px;
		z-index: 5;
		border: 1px solid #000;
		background-color: #ddd;
		box-sizing: border-box;
	}

	.modal-header {
		background-color: #666;
		border-bottom: 1px solid #000;
		color: #fff;
		cursor: default;
		height: 20px;
		line-height: 20px;
		text-align: center;
		box-sizing: border-box;
	}

	.modal-body {
		height: 120px;
		line-height: 40px;
		padding-top: 20px;
		padding-bottom: 20px;
		border-bottom: 1px solid #bbb;
		text-align: center;
		box-sizing: border-box;
	}

	.modal-body .column {
		float: left;
		width: 50%;
		text-align: right;
		padding-right: 5px;
		box-sizing: border-box;
	}
	.modal-body .column:last-child {
		text-align: left;
		padding-left: 5px;
		box-sizing: border-box;
	}

	.modal-body input[type="text"] {
		padding: 5px 10px;
		width: 50px;
		text-align: center;
	}

	.modal-footer {
		height: 50px;
		line-height: 50px;
		text-align: center;
		box-sizing: border-box;
	}

	.modal-footer button {
		width: 100px;
		padding: 5px 20px;
		background-color: #eee;
		color: #000;
		border: 1px solid #000;
		cursor: pointer;
	}

	.modal-footer button:hover {
		background-color: #ccc;
	}
	</style>
</head>
<body>
	<?php require('includes/top-navigation.php'); ?>
	<div class="wrapper center">
		<div class="page-header">
			Playlists
		</div>
		<div class="button-list playlists-main">
			<div class="button new-playlist">
				Create New Playlist
			</div>
			<div class="button open-playlist">
				Open Existing Playlist
			</div>
			<a href="signage.php" class="button">
				Back to Signage
			</a>
		</div>
		<div class="button-list playlist-list" style="display: none;">
			<div class="button button-left">
				<i class="fa fa-angle-double-left" aria-hidden="true"></i>
			</div>
			<div class="button button-right">
				<i class="fa fa-angle-double-right" aria-hidden="true"></i>
			</div>
			<div class="button cancel">
				Cancel
			</div>
		</div>
	</div>
	<div class="gui" style="display: none;">
		<div class="choose-layout-wrapper" style="position: fixed; top: 0; left: 0; display: table; width: 100%; height: 100%; background-color: rgba(0,0,0,0.8); z-index: 5;">
			<div class="choose-layout-content" style="display: table-cell; text-align: center; vertical-align: middle;">
				<div class="choose-layout" style="display: inline-block; background-color: #eee; padding: 20px;">
					<div class="header" style="display: block; width: 300px; text-align: left; font-size: 24px;">
						Select Layout
					</div>
					<div class="layout-list">
						<div class="layout-item" style="display: block; width: 300px; text-align: left;">
							asdf
						</div>
						<div class="layout-item" style="display: block; width: 300px; text-align: left;">
							asdf
						</div>
						<div class="layout-item" style="display: block; width: 300px; text-align: left;">
							asdf
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="segment-marker" style="left: 150px; top: 28px; width: 11px; height: 20px;"></div>
		<div class="timeline-marker" style="left: 150px;">
			<div class="timeline-marker-line" style="height: 20px;"></div>
		</div>
		<div class="ruler">
			<div class="timeline">
				<div class="timeline-label-wrapper">
					<div class="timeline-label">0s</div><!--
					--><div class="timeline-label">10s</div><!--
					--><div class="timeline-label">20s</div><!--
					--><div class="timeline-label">30s</div><!--
					--><div class="timeline-label">40s</div><!--
					--><div class="timeline-label">50s</div><!--
					--><div class="timeline-label">60s</div><!--
					--><div class="timeline-label">70s</div><!--
					--><div class="timeline-label">80s</div><!--
					--><div class="timeline-label">90s</div><!--
					--><div class="timeline-label">100s</div><!--
					--><div class="timeline-label">110s</div><!--
					--><div class="timeline-label">120s</div><!--
					--><div class="timeline-label">130s</div><!--
					--><div class="timeline-label">140s</div><!--
					--><div class="timeline-label">150s</div><!--
					--><div class="timeline-label">160s</div><!--
					--><div class="timeline-label">170s</div><!--
					--><div class="timeline-label">180s</div><!--
					--><div class="timeline-label">190s</div><!--
					--><div class="timeline-label">200s</div><!--
					--><div class="timeline-label">210s</div><!--
					--><div class="timeline-label">220s</div><!--
					--><div class="timeline-label">230s</div><!--
					--><div class="timeline-label">240s</div><!--
					--><div class="timeline-label">250s</div><!--
					--><div class="timeline-label">260s</div><!--
					--><div class="timeline-label">270s</div><!--
					--><div class="timeline-label">280s</div><!--
					--><div class="timeline-label">290s</div><!--
					--><div class="timeline-label">300s</div>
				</div>
				<div class="timeline-ticks"></div>
			</div>
		</div>
		<div class="layers">
			<div class="layer-labels">
				<div class="layout-label selected">
					<div class="layer-label-text">Layout</div>
				</div>
				<div class="layer-buttons">
					<div class="new-playlist"></div><div class="new-layer"></div>
				</div>
			</div>
			<div class="layer-timeline">
				<div class="layer-timeline-body">
					<div class="layer layer-layout">
						<div class="layer-segment-wrapper">
							<div class="layer-segment-keyframe" style="width: 600px;">
								<div class="layer-segment-head"></div>
								<div class="layer-segment-tail"><div class="col-resize"></div></div>
							</div><!--
						--><div class="layer-padding" style="width: 500px;"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="properties-pane">
			<div class="properties-pane-label">
				<span class="collapse">&ndash;</span>
				<span class="expand" style="display: none;">+</span>
				<span class="label">Properties</span>
			</div>
			<div class="properties-pane-body">
				<div class="buttons" style="display: none;">
					<button class="add-content">Add Content</button>
					<button class="change-content">Change Content</button>
					<button class="remove-content">Remove Content</button>
					<button class="insert-keyframe">Insert Keyframe</button>
					<button class="delete-keyframe">Delete Keyframe</button>
					<button class="delete-keyframes">Delete Keyframe(s)</button>
					<button class="insert-frame">Insert Frame(s)...</button>
					<button class="delete-frame">Delete Frame</button>
					<button class="delete-frames">Delete Frames</button>
					<button class="extend-timeline">Extend Timeline</button>
				</div>
				<div class="information">
					<span class="information-bit selection-duration" style="display: none;">
						Selected Duration: <span class="duration"></span>s
					</span>
					<span class="information-bit entry-duration" style="display: none;">
						Keyframe Duration: <span class="duration"></span>s
					</span>
				</div>
			</div>
		</div>
		<div class="modal-overlay" style="display: none;"></div>
		<div class="modal insert-frame-modal" style="display: none;">
			<div class="modal-header">
				Insert Frame(s)...
			</div>
			<div class="modal-body">
				<div class="row">
					<div class="column">
						Frame(s):
					</div>
					<div class="column">
						<input type="text" class="insert-frame-amount" value="1">
					</div>
				</div>
				<div class="row">
					<div class="column">
						Second(s):
					</div>
					<div class="column">
						<input type="text" class="insert-frame-seconds" value="0.1">
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button class="ok-button">OK</button>
				<button class="cancel-button">Cancel</button>
			</div>
		</div>
	</div>
	<?php require('includes/scripts.php'); ?>
	<script src="<?= $path; ?>js/controllers/playlists.js" type="text/javascript"></script>
</body>
</html>