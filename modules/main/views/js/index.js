var login = function(id, password)
{
	CF.signin({id : id, password : password}, function(result){
		if(result && result.redirect)
			location.href = result.redirect;
		else
			location.href = '/org_main';
	},
	function(error){
		var errorObj = JSON.parse(error);
		var errorInfo = JSON.parse(errorObj.error);
		openErrorPopup(errorInfo.description);
	});
};

var pumpkin = new Pumpkin();
pumpkin.addWork('signup', function(data){
	var next = this.next;
	CF.users('signup', {email : data.username, password : data.password}, function(result){
		result.data.email = data.username;
		next(result.data);
	},
	function(error){
		var errorObj = JSON.parse(error);
		var errorInfo = JSON.parse(errorObj.error);
		openErrorPopup(errorInfo.description);
	});
});

pumpkin.addWork('setOrgRole', function(data){
	$('#signinForm .result-desc').text('Setting a role of organization to your account.').css('color', 'rgb(51, 122, 183)');

	var next = this.next;
	CF.users('setOrgRole', data, function(result){
		next(data);
	},
	function(error){
		var errorObj = JSON.parse(error);
		var errorInfo = JSON.parse(errorObj.error);
		openErrorPopup(errorInfo.description);
	});
});

pumpkin.addWork('setSpaceRole', function(data){
	$('#signinForm .result-desc').text('Setting a role of space to your account.').css('color', 'rgb(51, 122, 183)');

	var next = this.next;
	CF.users('setSpaceRole', data, function(result){
		next(result);
	},
	function(error){
		var errorObj = JSON.parse(error);
		var errorInfo = JSON.parse(errorObj.error);
		openErrorPopup(errorInfo.description);
	});
});

var indexInit = function(){

	var html = $("#mainContent").html();

	if(html){
		$("#pageBody").empty();
		$("#pageBody").append(html);

		$('.paas-header').remove();
		$("#subContents").removeClass();
		$("#subContents").addClass('paas-account__wrap');
		$('.paas-lnbwrap').remove();

		$("#footer").remove();
	}
	return;
}

$(document).ready(function(){
	indexInit();
	formSubmit($('#signinForm'), function(data)
	{
		var type = $('#signinForm input[type="submit"]').attr('data-type');
		if(!type || type == 'signin'){
//			$('#signinForm .result-desc').text('Please, wait for sign in.').css('color', '#337ab7');
//			$('#signProgress').css('display', 'inline-block').parent().find('input').hide();
			login(data.username, data.password);
		}
		else{
			if(data.password != data.passwordConfirm)
			{
				$('#signinForm .result-desc').text('Both password is not accord each other.').css('color', '');
			}
			else
			{
				$('#signinForm .result-desc').text('Please, wait for sign up.').css('color', '#337ab7');
				$('#signProgress').css('display', 'inline-block').parent().find('input').hide();

				pumpkin.execute([{name : 'signup', params : data}, 'setOrgRole', 'setSpaceRole'], function(result)
				{
					if(result && result.code == 201)
					{
						login(data.username, data.password);
					}
					else
					{
						$('#signProgress').hide().next().next().next().show().next().show();
						$('#signinForm .result-desc').text(JSON.stringify(result)).css('color', '');
					}
				});
			}
		}
	});

	$('#signin').on('click', function(){
		$(this).prev().attr('data-type', 'signin').click();
	});

	$('#signup').on('click', function(){
		if($(this).attr('data-mode') == 'signup'){
			$(this).prev().prev().attr('data-type', 'signup').click();
		}
		else{
			$('#signinForm .input-group input').val('');
			$('#signinForm .input-group input:first').focus();
			$(this).attr('data-mode', 'signup').parent().prev().show().children('input').attr('required', '');
			$(this).removeClass('btn-default').addClass('btn-primary').prev().hide().end().next().show();
		}
	});

	$('#cancel').on('click', function(){
		$('#signinForm .input-group input').val('');
		$(this).hide().prev().removeClass('btn-primary').addClass('btn-default').prev().show();
		$(this).prev().removeAttr('data-mode').parent().prev().hide().children('input').removeAttr('required');
	});

});
