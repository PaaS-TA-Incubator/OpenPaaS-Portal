/**
 * Application Main Function 2017-05-29
 */
(function() {
	var pumpkin = new Pumpkin();

	_ee.on("getMembersList", function(orgGuid) {
		pumpkin.execute([{
			name : 'getOrg',
			params : {
				guid : orgGuid
			}
		}, {
			name : 'getSpacesList'
		}
		]);
	});

	_ee.on("setSelectedOption", function(orgItem, spaceList) {
		var optionHtml = "<optgroup label='Org'> <option value='" + orgItem.metadata.guid + "'>" + orgItem.entity.name + "</option> </optgroup>"
		$("#selectedOptionSpace").prepend(optionHtml);

		var optGroupSpaces = '<optgroup label="Spaces">';
		for (var i = 0; i < spaceList.length; i++) {
			var optSpace = "<option value='" + spaceList[i].metadata.guid + "'>" + spaceList[i].entity.name + "</option>"
			optGroupSpaces = optGroupSpaces + optSpace;
		}
		optGroupSpaces = optGroupSpaces + "</optgroup>";
		$("#selectedOptionSpace").append(optGroupSpaces);

		$("#selectedOptionSpace").setSelected(orgItem.metadata.guid);
	});

	pumpkin.addWork('getOrg', function(params) {
		var next = this.next;
		CF.async({
			url : '/v2/organizations/' + params.guid
		}, function(result) {
			if (result.entity) {
				pumpkin.setData({
					orgItem : result
				});
				next({
					guid : result.metadata.guid
				});
			} else {
				openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
			}
		});
	});

	pumpkin.addWork('getSpacesList', function(params) {
		var that = this;
		CF.async({
			url : '/v2/organizations/' + params.guid + '/spaces'
		}, function(result) {
			if (result.resources) {
				_ee.emit("setSelectedOption", that.data.orgItem, result.resources);
				that.next(result.resources);
			} else {
				openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
			}
		});
	});

	var pumpkinForList = new Pumpkin();
	pumpkinForList.addWork('getUsersForCheck', function(params) {
		var next = this.next;
		var error = this.error;

		CF.async({
			url : '/v2/' + params.dataName + '/' + params.guid + '/' + params.type
		}, function(result) {
			if (result) {
				if (result.resources) {
					var userList = result.resources;
					for (var i = 0; i < userList.length; i++) {

						if ($('#' + params.tableName + ' tbody tr[data-guid="' + userList[i].metadata.guid + '"]').length > 0) {
							$('#' + params.tableName + ' tbody tr[data-guid="' + userList[i].metadata.guid + '"] .' + this.type).get(0).checked = true;
							$('#' + params.tableName + ' tbody tr[data-guid="' + userList[i].metadata.guid + '"] .' + this.type).parent().addClass("Checked");
							continue;
						}

						var template = $('#membersItemTemplate').html();
						template = template.replace('{guid}', userList[i].metadata.guid).replace('{username}', userList[i].entity.username);

						var row = $(template);
						row.get(0).item = userList[i];

						$('#' + params.tableName + ' tbody').append(row);

						if (!this.check) {
							var input = $(row).find('.' + this.type).get(0);
							if (input) {
								// $(row).find('.' +
								// this.type).setChecked(true);
								$(input).parent().addClass("Checked");
								$(input).attr("checked", "checked");
							}
						}
					}

					var check = this.check;

					$('#' + params.tableName + ' tbody tr input[type="checkbox"]').off('change').on('change', function() {
						var username = $(this).parent().parent().parent().get(0).item.entity.username;
						params.username = username;

						if (this.checked == true)
							params.method = 'PUT';
						else
							params.method = 'DELETE';

						var type = $(this).attr('class').replace("Checkbox", "").trim();
						if (type == 'managers') {
							params.type = 'managers';
						} else if (type == 'auditors') {
							params.type = 'auditors';
						} else {
							if (params.dataName == 'spaces' || check)
								params.type = 'developers';
							else
								params.type = 'billing_managers';
						}

						if (check) {
							params.dataName = 'spaces';
							params.guid = $('#selectedOptionSpace').val();
						}

						$(this).parent().hide();
						$(this).parent().parent().append('<img alt="" src="modules/main/views/images/loading_list.gif" width="24" height="24">');
						
						if (this.checked) {
							$(this).checked = true;
							$(this).parent().addClass("Checked");
						} else {
							$(this).checked = false;
							$(this).parent().removeClass("Checked");
						}
						params.that = this;
						updateMemberAssociation.execute([{
							name : 'update',
							params : params
						}
						], function(params) {

						}, function(workName, error) {
							openErrorPopup(error.description ? error.description : JSON.stringify(error));
						});
					});
					
					next();
				} else {
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			} else {
				openErrorPopup('Unknown Error');
			}
		}.bind({
			type : params.type,
			check : params.check
		}), function(error) {
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});

	// 사용자 권한 Update
	var updateMemberAssociation = new Pumpkin();
	updateMemberAssociation.addWork('update', function(params) {
		var next = this.next;
		var error = this.error;

		if (!params.guid) {
			params.guid = $("#selectedOptionSpace").val();
		}

		CF.async({
			url : '/v2/' + params.dataName + '/' + params.guid + '/' + params.type,
			method : params.method,
			form : {
				username : params.username
			}
		}, function(result) {
			if (result) {
				// 권한을 부여할 수 있는 권한이 없는 경우(Manager가 아닌 경우) - Check를 해제시킴
				if (result.code) {
					$(params.that).checked = false;
					$(params.that).parent().removeClass("Checked");
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				} else {
					$(params.that).parent().show();
					$(params.that).parent().parent().find('img').remove();
					next(params);
				}
			} else {
				if (params.method == 'PUT') {
					openErrorPopup('Unknown Error');
				} else {
					$(params.that).parent().show();
					$(params.that).parent().parent().find('img').remove();
					next(params);
				}
			}
		}, function(error) {
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});

	// Org 사용자 제거
	var deleteMember = function() {
		$(this).on('click', function() {
			var tr = $(this).parent().parent();
			var user = tr.get(0).item;
			if (!user) {
				openWarringPopup("Selected user.")
				return false;
			}

			openConfirmPopup("User Delete", 'Are you sure you want to delete "' + user.entity.username + '"?');

			$("#confirmPopupBtn").on('click', function() {
				$("#confirmPopup").close();
				CF.users('deleteUserFromOrg', {
					userId : user.metadata.guid,
					orgId : $('#selectedOptionSpace').val()
				}, function(result) {
					tr.remove();
				}, function(error) {
					var errTemp = JSON.stringify(error.error);
					var err = JSON.parse(errTemp);
					openErrorPopup(err.description);
				});
			});
		});
	};

	var loadOrganizationMembers = function(guid) {
		$("#spaceTable").hide();
		$('#orgTable #membersListTbody').empty();
		$('#orgTable').show();

		var workList = [{
			name : 'getUsersForCheck',
			params : {
				guid : guid,
				tableName : 'orgTable',
				dataName : 'organizations',
				type : 'managers'
			}
		}, {
			name : 'getUsersForCheck',
			params : {
				guid : guid,
				tableName : 'orgTable',
				dataName : 'organizations',
				type : 'billing_managers'
			}
		}, {
			name : 'getUsersForCheck',
			params : {
				guid : guid,
				tableName : 'orgTable',
				dataName : 'organizations',
				type : 'auditors'
			}
		}
		];

		pumpkinForList.executeAsync(workList, function() {
			$('#orgTable tbody button[btn-type="remove"]').show();
			$('#orgTable tbody button[btn-type="remove"]').each(deleteMember);
		});
	};

	var loadSpaceMembers = function(guid) {
		$("#orgTable").hide();
		$('#spaceTable #membersListTbody').empty();
		$("#spaceTable").show();

		var workList = [{
			name : 'getUsersForCheck',
			params : {
				guid : guid,
				tableName : 'spaceTable',
				dataName : 'spaces',
				type : 'managers'
			}
		}, {
			name : 'getUsersForCheck',
			params : {
				guid : guid,
				tableName : 'spaceTable',
				dataName : 'spaces',
				type : 'developers'
			}
		}, {
			name : 'getUsersForCheck',
			params : {
				guid : guid,
				tableName : 'spaceTable',
				dataName : 'spaces',
				type : 'auditors'
			}
		}
		];
		pumpkinForList.executeAsync(workList, function() {
			var orgGuid = _global.hash.org;
			var workList = [{
				name : 'getUsersForCheck',
				params : {
					guid : orgGuid,
					tableName : 'spaceTable',
					dataName : 'organizations',
					type : 'managers',
					check : true
				}
			}, {
				name : 'getUsersForCheck',
				params : {
					guid : orgGuid,
					tableName : 'spaceTable',
					dataName : 'organizations',
					type : 'billing_managers',
					check : true
				}
			}, {
				name : 'getUsersForCheck',
				params : {
					guid : orgGuid,
					tableName : 'spaceTable',
					dataName : 'organizations',
					type : 'auditors',
					check : true
				}
			}
			];
			pumpkinForList.state = 0;
			pumpkinForList.executeAsync(workList, function() {});
		});
	};

	$(document).ready(function() {

		var orgGuid = _global.hash.org;
		_ee.emit("getMembersList", orgGuid);

		$("#selectedOptionSpace").on('change', function(e) {
			var selectedGuid = $("#selectedOptionSpace").val();

			// Org Member
			if ($("#selectedOptionSpace option:eq(0)").val() == selectedGuid) {
				loadOrganizationMembers(orgGuid);
			}
			// Space Member
			else {
				if (selectedGuid == '') {
					if (this.init)
						return;

					this.init = true;
					$('#spaceTable').hide();
					$('#orgTable').show();

					var guid = $('#orgSelect').val();
					loadOrganizationMembers(guid);

					var that = this;

					$('#selectedOptionSpace').html('<option value="">Spaces Loading...</option>').attr('disabled', '');
					pumpkin.execute([{
						name : 'getSpaces',
						params : {
							guid : guid
						}
					}
					], function() {
						$('#selectedOptionSpace').removeAttr('disabled');
						that.init = false;
					});
				} else {
					loadSpaceMembers(selectedGuid);
				}
			}
		});

		$("#inviteBtn").on('click', function() {
			var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			var inviteEmail = $("#inviteEmail").val();
			if (!inviteEmail) {
				openWarringPopup("Input invite E-mail");
				$("#inviteEmail").focus();
				return;
			}

			for (var i = 0; i < inviteEmail.length; i++) {
				if (!re.test(inviteEmail)) {
					openWarringPopup('"' + inviteEmail + '" must be email pattern.');
					return false;
				}
			}

			CF.users('invite', {
				target : inviteEmail,
				orgId : orgGuid
			}, function(result) {
				if (result) {
					if (result.code == 201) {
						var guid = $('#selectedOptionSpace').val();
						loadOrganizationMembers(guid);
					}
				}
			}, function(error) {
				var errTemp = JSON.stringify(error.error);
				var err = JSON.parse(errTemp);
				console.log("Err: ", err.error_code);
				if (err.error_code == "CF-UserNotFound") {
					openErrorPopup("You have not signed up");
				} else {
					openErrorPopup("You have not permission.");
				}
			});
		});
	});
})();
