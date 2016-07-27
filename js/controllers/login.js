$('.email').focus();
var doLogin = function() {
	// Animate the form and display success message, then redirect to url
	var loginSuccess = function(message, url) {
		if ($('.button-list.login').is(':animated')) {
			setTimeout(function() {
				loginSuccess(message, url);
			}, 25);
			return;
		}
		$('.button').removeClass('disabled').addClass('success');
		$('.button').html(message);
		setTimeout(function() {
			window.location = url;
		}, 500);
	};

	// Animate the form and display error message
	var loginError = function(message) {
		if ($('.button-list.login').is(':animated')) {
			setTimeout(function() {
				loginError(message);
			}, 25);
			return;
		}
		$('.button').removeClass('disabled').addClass('error');
		$('.button').html(message);
		var shakeButton = function() {
			var shakeState = 0;
			var shakeButtonStep = function() {
				$('.button').css('margin-top', (shakeState * shakeState) % 10);
				shakeState++;
				if (shakeState < 30) {
					setTimeout(shakeButtonStep, 15);
				} else {
					$('.button').css('margin-top', 0);
					setTimeout(function() {
						$('.button').addClass('disabled').removeClass('error');
						$('.button').html('Log In');
						$('.button-list.login').slideDown(300, function() {
							$('.button').removeClass('disabled');
						});
					}, 1500);
				}
			};
			shakeButtonStep();
		};
		shakeButton();
	}

	// Disable button during login animation
	if ($('.button').hasClass('disabled') ||
		$('.button').hasClass('error') ||
		$('.button').hasClass('success')) {
		return;
	}

	// Start animating the login screen
	$('.button-list.login').slideUp(300);
	$('.button').addClass('disabled');
	$('.button').html('Logging In <span class="dot">.</span> <span class="dot">.</span> <span class="dot">.</span>');
	var dotState = 0;
	$('.dot').css('opacity', '0');
	var delay = 150;
	var dotAnimation = function() {
		if (dotState == 0) {
			$('.dot').eq(0).css('opacity', 0).animate({ 'opacity': 1 }, delay);
		} else if (dotState == 1) {
			$('.dot').eq(1).css('opacity', 0).animate({ 'opacity': 1 }, delay);
		} else if (dotState == 2) {
			$('.dot').eq(2).css('opacity', 0).animate({ 'opacity': 1 }, delay);
		} else if (dotState == 3) {
			$('.dot').css('opacity', 1).animate({ 'opacity': 0 }, delay);
		}
		dotState++;
		if (dotState > 3) {
			dotState = 0;
		}
		if ($('.dot').length) {
			setTimeout(dotAnimation, delay);
		}
	};
	dotAnimation();

	// Authenticate the login
	$.ajax({
		'method': 'POST',
		'dataType': 'json',
		'url': path+'controllers/login.php',
		'data': {
			'email': $('.email').val(),
			'password': $('.password').val()
		}
	}).success(function(response) {
		if (typeof(response) == 'undefined') {
			loginError('Unknown error!');
		} else if (!response) {
			loginError('Unknown error!');
		} else if (!response.result) {
			loginError('Unknown error!');
		}
		if (response.result == 'error') {
			if (response.message) {
				loginError(response.message);
			} else {
				loginError('Unknown error!');
			}
		} else if (response.result == 'success') {
			// ********* SUCCESSFUL LOGIN *********
			if (response.message && response.url) {
				loginSuccess(response.message, response.url);
			} else {
				loginError('Unknown error!');
			}
		}
	}).error(function(e) {
		if (e.status >= 500) {
			loginError('Unknown server error!');
		} else {
			loginError('Error connecting to server.');
		}
	});
}
$('.button').click(function() {
	doLogin();
});
$(document).keydown(function(e) {
	if (e.which == 13) {
		doLogin();
	}
});

// Easter eggs
var buffer = '';
var checkBuffer = function(text, fn) {
	if (buffer.slice(-text.length).toLowerCase() == text) {
		fn();
	}
}
$(document).keydown(function(e) {
	buffer += String.fromCharCode(e.which);
	buffer = buffer.slice(-20);
	checkBuffer('blorp', function() { $('body').css('background-image', 'url("http://pop.h-cdn.co/assets/15/47/1448036790-ezgif-2831929554.gif")').css('background-size', 'cover'); });
	checkBuffer('aaron', function() { $('body').css('background-image', 'url("https://media.giphy.com/media/Vuw9m5wXviFIQ/giphy.gif")').css('background-size', 'cover'); });
	checkBuffer('jesse', function() { $('body').css('background-image', 'url("http://25.media.tumblr.com/tumblr_lm59mleifE1qkc0g1o1_1280.jpg")').css('background-size', 'cover'); });
	checkBuffer('trump', function() { $('body').css('background-image', 'url("http://images.dmbdemo.com/boxdata/asset22887/images/giphy.gif?r=160429014117")').css('background-size', 'cover'); });
	checkBuffer('bees', function() { $('body').css('background-image', 'url("https://media.giphy.com/media/dcubXtnbck0RG/giphy.gif")').css('background-size', 'cover'); });
	checkBuffer('chew', function() { $('body').css('background-image', 'url("http://i.imgur.com/UYPLKwN.gif")').css('background-size', 'cover'); });
	checkBuffer('cyber', function() { $('body').css('background-image', 'url("http://i.imgur.com/D4FDPUm.gif")').css('background-size', 'cover'); });
	checkBuffer('jiggle', function() { $('body').css('background-image', 'url("http://i.giphy.com/oUxSEtoblS0y4.gif")').css('background-size', 'cover'); });
});