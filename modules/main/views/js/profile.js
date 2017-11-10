(function() {
	$(document).ready(function() {
		formSubmit($('#profileForm'), function(data) {
			data.username = $('#username').attr('data-username');
			if (data.newPassword != data.confirmPassword) {
				$('.message').text('Password is not accord.');
				return;
			}
			CF.users('password', data, function(result) {
				if (result) {
					if (result.status == 'ok') {
						$('.message').text('Password is updated.').css('color', '#337ab7');
						setTimeout(function() {
							$('.message').text('').css('color', '');
						}, 3000);
					    alert("변경된 비밀번호로 다시 로그인해주세요.");
					    CF.signout();
					} else {
						$('.message').text(result.description ? result.description : JSON.stringify(result));
					}
				} else {
					$('.message').text('Unknown Error');
				}
			}, function(error) {
				$('.message').text(error);
			});
		});
	});
})();
