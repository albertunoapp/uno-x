$(document).ready(function() {
	var session = {};
	session.content_offset = 0;
	session.more_next_page = false;
	session.content_list = null;

	// Upload New Content
	$('.button-list.content-main .button.new-content input[type="file"]').change(function() {
		$('.button-list.content-main .button.new-content').addClass('uploading');
		$('.button-list.content-main .button.new-content .button-text').text('UPLOADING...');
		$('.button-list.content-main .button.new-content .progress-bar').css('width', 0).show();
		var formData = new FormData($(this).closest('form').get(0));
		$('.button-list.content-main .button.new-content input[type="file"]').prop('disabled', true);
		$.ajax({
			type: 'POST',
			url: path + 'controllers/content.php',
			data: formData,
			dataType: 'json',
			xhr: function() {
				var myXhr = $.ajaxSettings.xhr();
				if (myXhr.upload) {
					myXhr.upload.addEventListener('progress', function(e, position, total, percentComplete) {
						var fractionUploaded = e.loaded / e.total;
						var percentUploaded = Math.round(fractionUploaded * 1000) / 10;
						$('.button-list.content-main .button.new-content .progress-bar').css('width', fractionUploaded * 300).show();
					}, false);
				}
				return myXhr;
			},
			cache: false,
			contentType: false,
			processData: false
		}).success(function(response) {
			if (response && response.result && response.result == 'success') {
				// SUCCESS!

				// Clear content cache
				session.content_list = null;

				$('.button-list.content-main .button.new-content .progress-bar').css('width', 0).hide();
				$('.button-list.content-main .button.new-content').removeClass('uploading').addClass('success');
				$('.button-list.content-main .button.new-content .button-text').text('UPLOAD COMPLETE');
				setTimeout(function() {
					$('.button-list.content-main .button.new-content').removeClass('success');
					$('.button-list.content-main .button.new-content .button-text').text('UPLOAD NEW CONTENT');
					$('.button-list.content-main .button.new-content input[type="file"]').val('').prop('disabled', false);
				}, 1000);
			} else {
				// FAIL!
				alert(response.message);
				$('.button-list.content-main .button.new-content .progress-bar').css('width', 0).hide();
				$('.button-list.content-main .button.new-content').removeClass('uploading').addClass('error');
				$('.button-list.content-main .button.new-content .button-text').text('UPLOAD FAILED');
				setTimeout(function() {
					$('.button-list.content-main .button.new-content').removeClass('error');
					$('.button-list.content-main .button.new-content .button-text').text('UPLOAD NEW CONTENT');
					$('.button-list.content-main .button.new-content input[type="file"]').val('').prop('disabled', false);
				}, 1000);
			}
		}).error(function(e) {
			// Whoops, that wasn't supposed to happen
			$('.button-list.content-main .button.new-content .progress-bar').css('width', 0).hide();
			$('.button-list.content-main .button.new-content').removeClass('uploading').addClass('error');
			$('.button-list.content-main .button.new-content .button-text').text('UPLOAD FAILED');
			setTimeout(function() {
				$('.button-list.content-main .button.new-content').removeClass('error');
				$('.button-list.content-main .button.new-content .button-text').text('UPLOAD NEW CONTENT');
				$('.button-list.content-main .button.new-content input[type="file"]').val('').prop('disabled', false);
			}, 1000);
		});
	});

	// Generate the list of content! (8 content with offset)
	var renderContentList = function() {
		$('.button-list.content-list .content-button').remove();
		if (!session.content_list) return;
		for (var i = session.content_offset * 8; i < session.content_list.length && i < (session.content_offset * 8) + 8; i++) {
			// Generate thumbnails
			var $content_button = $('<a class="button content-button" href="' + session.content_list[i]['url'] + '" target="blank" style="background-image:url(\'' + session.content_list[i]['url'] + '\')"></a>')
			if ($('.button-list.content-list .content-button').length) {
				$('.button-list.content-list .content-button').last().after($content_button);
			} else {
				$('.button-list.content-list').prepend($content_button);
			}
		}
		// If odd number of thumbnails, even it out!
		if ($('.button-list.content-list .content-button').length % 2 == 1) {
			var $content_button = $('<div class="button content-button disabled"></div>')
			$('.button-list.content-list .content-button').last().after($content_button);
		}
	};

	// Fetch 8 more content!
	var fetchMoreContent = function() {
		if (!session.content_list) session.content_list = [];
		$('.button-list.content-list .button-left').addClass('disabled').hide();
		$('.button-list.content-list .button-right').addClass('disabled').hide();
		$('.button-list.content-list .content-button').remove();
		var $loading_button = $('<div class="button content-button disabled">LOADING...</div>')
		$('.button-list.content-list').prepend($loading_button);
		$.ajax({
			url: path + 'controllers/content.php',
			method: 'POST',
			data: {
				'request': 'getContent',
				'payload': {
					'offset': Math.floor((session.content_list.length - 0.5) / 8) + 1
				}
			},
			dataType: 'json'
		}).success(function(response) {
			if (response && response.result && response.result == 'success') {
				// SUCCESS!
				$('.button-list.content-list .content-button.disabled').remove(); // Remove loading message
				// Make sure at least some content exists in response...
				if (!response.content || !response.content.length) {
					if (session.content_list.length == 0) {
						var $no_content_button = $('<div class="button content-button error">NO CONTENT FOUND</div>')
						$('.button-list.content-list').prepend($no_content_button);
					}
					return;
				}
				for (var i = 0; i < response.content.length; i++) {
					session.content_list.push(response.content[i]);
				}
				session.content_offset = Math.floor((session.content_list.length - 0.5 )/ 8);
				session.more_next_page = response.more_next_page;
				renderContentList();
				$('.button-list.content-list .button-left').show();
				$('.button-list.content-list .button-right').show();
				if (session.content_offset > 0) {
					$('.button-list.content-list .button-left').removeClass('disabled');
				}
				if (response.more_next_page) {
					$('.button-list.content-list .button-right').removeClass('disabled');
				}
			} else {
				// FAIL!
				$('.button-list.content-list .content-button').text('ERROR!').removeClass('disabled').addClass('error');
			}
		}).error(function(e) {
			// Whoops, that wasn't supposed to happen...
			$('.button-list.content-list .content-button').text('ERROR!').removeClass('disabled').addClass('error');
		});
	};

	// Browse Uploaded Content
	$('.button-list.content-main .button.browse-content').click(function() {
		$('.page-header').text('Browse Uploaded Content');
		$('.button-list').hide();
		$('.button-list.content-list').show();
		$('.button-list.content-list .button-left').addClass('disabled');
		$('.button-list.content-list .button-right').addClass('disabled');
		if (!session.content_list) session.content_list = [];
		if (session.content_list.length > 8 || (session.content_list.length == 8 && session.more_next_page)) {
			$('.button-list.content-list .button-right').removeClass('disabled');
		}
		session.content_offset = 0;
		renderContentList();
		// Get content from server if we haven't already
		if (session.content_list.length == 0) {
			$('.button-list.content-list .button-left').hide();
			$('.button-list.content-list .button-right').hide();
			fetchMoreContent();
		}
	});

	$('.button-list.content-list .button-left').click(function() {
		if (!session.content_list) session.content_list = [];
		if (session.content_offset > 0) {
			session.content_offset--;
			renderContentList();
		}
		if (session.content_offset == 0) {
			$(this).addClass('disabled');
		}
		if (session.content_list.length > 8 || (session.content_list.length == 8 && session.more_next_page)) {
			$('.button-list.content-list .button-right').removeClass('disabled');
		}
	});

	$('.button-list.content-list .button-right').click(function() {
		if (!session.content_list) session.content_list = [];
		// If we already have enough results to display next page...
		if (session.content_offset < Math.floor((session.content_list.length - 0.5) / 8)) {
			session.content_offset++;
			renderContentList();
			if (!session.more_next_page && session.content_offset >= Math.floor((session.content_list.length - 0.5) / 8)) {
				$(this).addClass('disabled');
			}
			$('.button-list.content-list .button-left').removeClass('disabled');
		} else if (session.more_next_page) {
			fetchMoreContent();
		}
	});

	$('.button-list.content-list .button.cancel').click(function() {
		$('.page-header').text('Content');
		$('.button-list').hide();
		$('.button-list.content-main').show();
	});
});