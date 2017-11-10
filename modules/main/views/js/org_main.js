/**
 * Organization Main Function
 * 2017-05-10
 */
(function(){
	var pumpkin = new Pumpkin();

	pumpkin.addWork('getFirstOrgId', function(){
		var that = this;
		CF.async({url : '/v2/organizations', method : 'get'}, function(result){
			if(result){
				var orgList = result.resources;

				 // Space 목록을 조회하기 위해 Org 저장
				 if(_global.hash.org == null || _global.hash.org == ''){
					 _global.hash.org = orgList[0].metadata.guid;
				 }
				 that.next();
			}
			else{
				this.error('Organization is not found.');
			}
		});
	});

	pumpkin.addWork('getOrgBaseInfo', function(param){
		var that = this;

		var orgGuid = param.orgGuid;

		CF.async({url : '/v2/organizations/' + orgGuid, method : 'GET'}, function(result){
			var params = {};
			if(result){
				var orgInfoTemp = $('#orgItemTemplate').html();
				orgInfoTemp = orgInfoTemp.replace('{orgName}', result.entity.name);
				$("#orgNameArea").html(orgInfoTemp);
				params.orgInfo = result;
				that.next(params);
			}
			else{
				openErrorPopup('Organization is not found.');
			}
		});
	});

	pumpkin.addWork('getOrgMemoryInfo', function(params){

		var that = this;
		var org = params.orgInfo;
		CF.async({url : org.entity.quota_definition_url}, function(result){
			if(result){
				var totalMemory = result.entity.memory_limit;

				if(totalMemory > 0){
					CF.async({url : '/v2/organizations/' + org.metadata.guid + '/memory_usage', method : 'GET'}, function(result){
						if(result){
							var useMemory = result.memory_usage_in_mb;
							var persent = (useMemory / totalMemory) * 100;
							persent = persent.toFixed(2);

							$("#orgProgressBar").attr('data-default', persent);
							$("#orgProgressBar").find('div').css('width', persent+'%');
							$("#orgProgressText").text(persent + '%');
							$("#totalUseMemory").text(useMemory + 'MB/' + totalMemory + 'MB');
						}
						else{
							$("#orgProgressBar").attr('data-default', '0');
							$("#orgProgressText").text('0%');
							$("#totalUseMemory").text('0MB/0MB');
						}
						that.next(org);
					});
				}
				else{
					$("#orgProgressBar").attr('data-default', '0');
					$("#orgProgressText").text('0%');
					$("#totalUseMemory").text('0MB/0MB');
					that.next(org);
				}
			}
			else{
				$("#orgProgressBar").attr('data-default', '0');
				$("#orgProgressText").text('0%');
				$("#totalUseMemory").text('0MB/0MB');
				that.next(org);
			}
		});
	});

	/* 선택한 Org의 Space 목록 조회 (Org 단건) */
	pumpkin.addWork('getSpaceListByOrg', function(org){
		$("#spaceList h3").empty();
		var that = this;

		// Space 목록을 가져오는 API호출
		CF.async({url : org.entity.spaces_url}, function(result){
			if(result){
				var space = null;
				var spaceList = result.resources;

				if(spaceList){

					var foreach = new ForEach();
					/* Space 목록을 화면에 Create */
					foreach.async(spaceList, function(spaceItem, index){
						var done = this.done;

						var html = $('#spaceInfoTemplate').html();
						pumpkin.execute([{name : 'createSpaceBaseInfoInOrgMain', params : {spaceItem : spaceItem, html : html}}, {name : 'createAppInfoInOrgMain'}, {name : 'createServiceInfoInOrgMain'}], function(result){
							if(result){
								$("#spaceList h3").prepend(result);
							}
						});
						done(); // forEach next
					});
					that.next(spaceList.length); // pumpkin next
				}
				else{
					that.next(0); // pumpkin next
				}
			}
		});
	});

	// Space Name
	pumpkin.addWork('createSpaceBaseInfoInOrgMain', function(param){
		var spaceItem = param.spaceItem;
		var html = param.html;
		var guid = spaceItem.metadata.guid
		var that = this;

		// html = html.replace("{guid}", guid);
		html = html.replace('{spaceName}', spaceItem.entity.name);
		param.html = html;
		that.next(param);
	});

	// Quota / Start / Stop / Down
	pumpkin.addWork('createAppInfoInOrgMain', function(param){
		var spaceItem = param.spaceItem;
		var html = param.html;
		var that = this;

		var appsUrl = spaceItem.entity.apps_url;
		CF.async({url : appsUrl}, function(result){
			if(result.resources){
				var appList = result.resources;
				var started = 0;
				var stopped = 0;
				var down = 0;
				var totalQuata = 0;
				var useQuata = 0;

				for(var i=0; i<appList.length; i++){
					if(appList[i].entity.state == 'STARTED'){
						started++;
						useQuata += appList[i].entity.memory * appList[i].entity.instances;
						totalQuata += appList[i].entity.memory * appList[i].entity.instances;
					}
					else if(appList[i].entity.state == 'STOPPED'){
						stopped++;
						totalQuata += appList[i].entity.memory * appList[i].entity.instances;
					}
					else{
						down++;
						totalQuata += appList[i].entity.memory * appList[i].entity.instances;
					}
				}

				var persent = 0;
				if(totalQuata != 0 && useQuata != 0){
					persent = (useQuata / totalQuata) * 100;
					persent = persent.toFixed(2);
					persent = Math.round(persent);
				}

				html = html.replace("{spaceQuota}", persent);
				html = html.replace("{appsTotNum}", appList.length);
				html = html.replace("{startedAppCount}", started).replace("{stoppedAppCount}", stopped).replace("{downAppCount}", down);

				html = html.replace(/{appsLink}/gi, "/space_main#space=" + spaceItem.metadata.guid);
				param.html = html;
			}
			else{

			}
			that.next(param);
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});

	// Service Instance Count
	pumpkin.addWork('createServiceInfoInOrgMain', function(param){
		var spaceItem = param.spaceItem;
		var html = param.html;
		var that = this;

		commonPumpkin.execute([{name : 'getServiceInstancesListInSpace', params : {spaceGuid : param.spaceItem.metadata.guid}}], function(serviceList){
			var totalCount  = 0;

			if(serviceList.serviceInstances){
				totalCount = totalCount + serviceList.serviceInstances.length;
			}
			if(serviceList.userServiceInstances){
				totalCount = totalCount + serviceList.userServiceInstances.length;
			}
			html = html.replace('{serviceTotNum}', totalCount);
			that.next(html);
		});
	});

	// Create Space
	pumpkin.addWork('createSpace', function(params){
		var next = this.next;
		CF.async({url : '/v2/spaces', method : 'POST', form : params.data}, function(result){
			if(result){
				if(result.entity){
					next(result);
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup('Unknown Error');
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});

	pumpkin.addWork('setSpaceManager', function(space){
		var next = this.next;
		next(space);
		CF.async({url : '/v2/spaces/' + space.metadata.guid + '/managers', method : 'PUT', form : {username : $('#username').attr('data-username')}}, function(result){
			if(result){
				if(result.entity){}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup('Unknown Error');
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});

	pumpkin.addWork('setSpaceDeveloper', function(space){
		var next = this.next;
		CF.async({url : '/v2/spaces/' + space.metadata.guid + '/developers', method : 'PUT', form : {username : $('#username').attr('data-username')}}, function(result){
			if(result){
				if(result.entity){
					next(space);
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup('Unknown Error');
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});

	_ee.on('getOrgMain', function(){
		/*pumpkin.execute([{name : 'getOrgBaseInfo', params : {orgGuid : _global.hash.org}}, {name : 'getOrgMemoryInfo'}, {name : 'getSpaceListByOrg'}], function(result){
			if(result < 1){
				$('#spaceList h3').html('<div class="alert alert-warning">no spaces.</div>');
			}
		}, function(workName, error){
			openErrorPopup(error.stack ? error.stack : error);
		});*/

		commonPumpkin.execute([{name : 'getOrgInfo', params : {orgGuid : _global.hash.org}}], function(orgInfo){
			if(orgInfo){
				var orgInfoTemp = $('#orgItemTemplate').html();
				orgInfoTemp = orgInfoTemp.replace('{orgName}', orgInfo.entity.name);
				$("#orgNameArea").html(orgInfoTemp);
			}
			else{
				openErrorPopup('Organization is not found.');
			}

			pumpkin.execute([{name : 'getOrgMemoryInfo', params : {orgInfo : orgInfo}}, {name : 'getSpaceListByOrg'}], function(result){
				if(result < 1){
					$('#spaceList h3').html('<div class="alert alert-warning">no spaces.</div>');
				}
			}, function(workName, error){
				openErrorPopup(error.stack ? error.stack : error);
			});
		}, function(workName, error){
			openErrorPopup(error.stack ? error.stack : error);
		});
	});

	$(document).ready(function(){
		if(billingReport != "#{billingReport}"){
			var usageReport = '<a href="javascript:;" class="billingReportLink" id="bilingReport">Usage Report</a>';
			$(".cloud-config__btn").parent().append(usageReport);
		}

		if(_global.hash.org == null || _global.hash.org != ''){
			pumpkin.execute(['getFirstOrgId'], function(){
				_ee.emit('getOrgMain');
			})
		}
		else{
			_ee.emit('getOrgMain');
		}

		// Create Space Btn Event
		$("#createSpaceForm #createSpaceBtn").on('click', function(){
			var param = {};
			param.name =$("#spaceNameTxt").val();;
			param.organization_guid = _global.hash.org;

			if(!param.name){
				openErrorPopup("Space Name required!");
				return;
			}

			if(!param.organization_guid){
				openErrorPopup("Select Organization!");
				return;
			}

			openConfirmPopup("Space Create", "Are you sure you want to create a [" + param.name + "] space?");

			$("#confirmPopupBtn").on('click', function(){
				$("#confirmPopup").close();
				pumpkin.execute([{name : 'createSpace', params : {data : param}}, 'setSpaceManager', 'setSpaceDeveloper'], function(space){
//					_ee.emit('getOrgMain');
					location.reload();
				});
			});
		});

		// Org Rename Event
		$("#renameOrgBtn").on('click', function(){
			$("#rename-pop").close();
			if(_global.hash.org){

				openConfirmPopup("Org Rename", "Are you sure modify?");

				$("#confirmPopupBtn").on('click', function(){
					$("#confirmPopup").close();
					var newOrgName = $("#newOrgNameTxt").val();

					CF.async({url : '/v2/organizations/' + _global.hash.org, method : 'PUT', form : {name : newOrgName}}, function(result){
						if(result){
							if(result.entity){
								$("#orgLi_" + _global.hash.org).find(" > a").html('<span class="lnb-tag">ORG</span>' + result.entity.name);
								$("#orgNameArea").html('<span class="content-tag">ORG</span>' + result.entity.name);
								$("#rename-pop").close();
							}
							else{
								openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
							}
						}
						else{
							openErrorPopup('Unknown Error');
						}
					},
					function(error){
						var errorObj = JSON.parse(error);
						var errorInfo = JSON.parse(errorObj.error);
						openErrorPopup(errorInfo.description);
					});
				});
			}
		});

		// Space Delete Event
		$("#deleteOrgBtn").on('click', function(){
			$("#rename-pop").close();
			if(_global.hash.org){

				openConfirmPopup("Org Delete", "This will permanently delete all of the spaces and apps in this org.");

				$("#confirmPopupBtn").on('click', function(){
					$("#confirmPopup").close();
					CF.async({url : '/v2/organizations/' + _global.hash.org, method : 'DELETE'}, function(result){
						if(result && result.description){
							openErrorPopup(result.description);
						}
						else if(result && result.code){
							openErrorPopup("Error Code : " + result.code);
						}
						else{
							// 성공
							location.href = "/org_main";
						}
					});
				})
			}
			else{
				openErrorPopup("Not Selected Org!");
			}
		});

		$("#dialogCnclBtn").on('click', function(){
			$("#rename-pop").close();
		});

		$("#bilingReport").on('click', function(){
			location.href = "/billing_report#org=" + _global.hash.org;
		});
	});
})();
