/**
 * Space List Main Page Function
 * 2017-05-17 
 */
(function(){
	var pumpkin = new Pumpkin();
	
	// Quota / Start / Stop / Down
	pumpkin.addWork('setSpaceDetailInfo', function(param){
		var that = this;
		var url = '/v2/spaces/' + param.spaceGuid + '/apps';
		
		CF.async({url : url, method : 'get'}, function(result){
			if(result.resources){
//				$("#tableTitle").text("(" + result.total_results + ") Apps");
				$("#listCount").text("(" + result.total_results +")");
				$("#listName").text(" Apps");
				
				_ee.emit('createAppsDefaultInfo', result.resources);
				
				if(result.resources.length > 0){
					_ee.emit('createAppList', result.resources);
					_ee.emit('tbodyClickEvent');
				}
				else{
					$("#appListTbody").html('<tr><td colspan="5" >No Apps..</td></tr>');
				}
			}
			else{
				$("#appListTbody").html('<tr><td colspan="5" >No Apps..</td></tr>');
			}
			that.next(param);
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
			$("#appListTbody").html('<tr><td colspan="5" >No Apps..</td></tr>');
		});
	});
	
	// Service Instance Count
	pumpkin.addWork('createServiceInfoInOrgMain', function(param){
		var that = this;
		
		var serviceInstanceUrl = '/v2/spaces/' + param.spaceGuid + '/service_instances';
		CF.async({url : serviceInstanceUrl}, function(result){
			commonPumpkin.execute([{name : 'getServiceInstancesListInSpace', params : {spaceGuid : param.spaceGuid}}], function(serviceList){
				var totalCount  = 0;
				
				if(serviceList.serviceInstances){
					totalCount = totalCount + serviceList.serviceInstances.length;
				}
				if(serviceList.userServiceInstances){
					totalCount = totalCount + serviceList.userServiceInstances.length;
				}
				$("#serviceTotNum").text(totalCount);
				that.next(serviceList);
			});
			/*if(result){
				$("#serviceTotNum").text(result.total_results);
			}*/
		});
	});
	
	_ee.on('hashchange', function(){
		
		if(!_global.hash.org){
			if($("#" + _global.hash.space).get(0).item){
				_global.hash.org = $("#" + _global.hash.space).get(0).item.organization.metadata.guid;				
			}
		}
		
		if(_global.hash.tab == 1){
			$("#appsContent").show();
			$("#securityGroupsContent").hide();
			_ee.emit('changeSpaceMainPage');
			_ee.emit('setSpaceMain');
		}
		else if(_global.hash.tab == 2){
			$("#appsContent").show();
			$("#securityGroupsContent").hide();
			$(".container-wrap").hide();
			$('#backgroundProgress').show();
			_ee.emit('changeServicePage');
		}
		else if(_global.hash.tab == 3){
			$("#appsContent").hide();
			$("#securityGroupsContent").show();
			_ee.emit("changeSecurityGroup", _global.hash.space);
		}
		else{
			if(_global.hash.space){
				$("#appsContent").show();
				$("#securityGroupsContent").hide();
				_ee.emit('changeSpaceMainPage');
				_ee.emit('setSpaceMain');
			}
		}
		_ee.emit("setSecurityGroupCount", _global.hash.space);
	});
	
	_ee.on('tbodyClickEvent', function(){
		$("#appListTbody").find('td').on('click', function(e){
			
			if($(this).find('a').length > 0){
				return ;
			}
			else{
				location.href = "/app_main#space=" + _global.hash.space + "&apps=" + $(this).parent()[0].id;
			}
		});
	});
	
	_ee.on('setSpaceMain', function(){
		_ee.emit('setSpaceName', _global.hash.space);
		pumpkin.execute([{name : 'setSpaceDetailInfo', params : {spaceGuid : _global.hash.space}}, {name : 'createServiceInfoInOrgMain'}], function(result){
			$(".container-wrap").show();
			$('#backgroundProgress').hide();
		});
	});
	
	// Service List에서 App List로 이동할때 변경되어야 하는 class & attribute
	_ee.on("changeSpaceMainPage", function(){
		$(".lay-item__center").addClass("selected");
		$(".lay-item__right").removeClass("selected");
		$(".lay-item__securityGroup").removeClass("selected");
		$("#createServiceBtn").hide();
		$("#searchBtn").hide();
		$("#appListTbody").empty();
		
		// Table Sort 기능 추가로 인해 table을 다시 그리지 않고 속성변경으로 수정함.
		$("#colgroupArea #col1_size").css("width", "120px");
		$("#colgroupArea #col2_size").css("width", "200px");
		$("#colgroupArea #col3_size").css("width", "");
		$("#colgroupArea #col4_size").css("width", "120px");
		$("#colgroupArea #col5_size").css("width", "120px");
		$("#colgroupArea #col6_size").css("width", "120px");
		
		$("#theadArea #th1_id").html("Status<span class='af-icon Icon'></span>");
		$("#theadArea #th2_id").html("App Name<span class='af-icon Icon'></span>");
		$("#theadArea #th3_id").attr("data-sortable", "string");
		$("#theadArea #th3_id").html("Route<span class='af-icon Icon'></span>");
		$("#theadArea #th4_id").attr("data-sortable", "number");
		$("#theadArea #th4_id").html("Instances<span class='af-icon Icon'></span>");
		$("#theadArea #th5_id").attr("data-sortable", "number").attr("colspan", "");
		$("#theadArea #th5_id").html("MemoryLimit<span class='af-icon Icon'></span>");
		$("#theadArea #th6_id").show();
		$("#theadArea #th6_id").html("Disk Limit<span class='af-icon Icon'></span>");
	});
	
	// Security Group
	_ee.on("changeSecurityGroup", function(spaceGuid){
		$(".lay-item__center").removeClass("selected");
		$(".lay-item__right").removeClass("selected");
		$(".lay-item__securityGroup").addClass("selected");
		_ee.emit("setSecurityGroup", spaceGuid);
	});
	
	$(document).ready(function(){
		
		$(".container-wrap").hide();
		$('#backgroundProgress').show();
		
		if(_global.hash.tab == 2){
//			$(".container-wrap").hide();
//			$('#backgroundProgress').show();
			_ee.emit('setSpaceName', _global.hash.space);
			CF.async({url : '/v2/spaces/' + _global.hash.space + '/apps', method : 'get'}, function(result){
				if(result.resources){
					_ee.emit('createAppsDefaultInfo', result.resources);
				}
			});
			
			pumpkin.execute([{name : 'createServiceInfoInOrgMain', params : {spaceGuid : _global.hash.space}}]);
			_ee.emit('changeServicePage');
		}
		else if(_global.hash.tab == 3){
			
			_ee.emit('setSpaceName', _global.hash.space);
			pumpkin.execute([{name : 'setSpaceDetailInfo', params : {spaceGuid : _global.hash.space}}, {name : 'createServiceInfoInOrgMain'}]);
			
			$("#appsContent").hide();
			$("#securityGroupsContent").show();
			_ee.emit("changeSecurityGroup", _global.hash.space);
			$(".container-wrap").show();
			$('#backgroundProgress').hide();
		}
		else{
			_ee.emit('setSpaceMain');
		}
		_ee.emit("setSecurityGroupCount", _global.hash.space);
		
		$(".lay-item__center").on('click', function(){
			location.hash = "#space=" + _global.hash.space + "&tab=1";
		});
		$(".lay-item__right").on('click', function(){
			location.hash = "#space=" + _global.hash.space + "&tab=2"; 
		})
		$(".lay-item__securityGroup").on('click', function(){
			location.hash = "#space=" + _global.hash.space + "&tab=3";
		});
		
		// Space Rename Event
		$("#renameSpaceBtn").on('click', function(){
			if(_global.hash.space){
				
				openConfirmPopup("Space Rename", "Are you sure space rename?");
				
				$("#confirmPopupBtn").on('click', function(){
					$("#rename-pop-space").close();
					$("#confirmPopup").close();
					var newSpaceName = $("#newSpaceNameTxt").val();
					
					CF.async({url : '/v2/spaces/' + _global.hash.space, method : 'PUT', form : {name : newSpaceName}}, function(result){
						if(result){
							if(result.entity){
								$("#spaceName").text(result.entity.name);
								$("#orgLi_" + _global.hash.org + " .lnb-sub #" + _global.hash.space + " a").text(result.entity.name);
								_ee.emit("setPageNavi", _global.hash.org, _global.hash.space);
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
		$("#deleteSpaceBtn").on('click', function(){
			if(_global.hash.space){
				
				openConfirmPopup("Space Delete", "This will permanently delete all of the apps and apps in this space.");
				
				$("#confirmPopupBtn").on('click', function(){
					$("#rename-pop").close();
					$("#confirmPopup").close();
					CF.async({url : '/v2/spaces/' + _global.hash.space, method : 'DELETE'}, function(result){
						if(result && result.code){
							openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
						}
						else{
							// 성공
							location.href = "/org_main#org=" + _global.hash.org;
						}
					});
				})				
			}
			else{
				openErrorPopup("Not Selected Spaces!");
			}
		});
		
		$(document).on("click", ".security-item", function(e) {
			var isShow = $(this).find(".security-item-content").css('display');
			if(isShow == "none"){
				$(this).find(".security-item-content").show();
				$(this).find(".security-item-header").addClass("expended");
			}
			else{
				$(this).find(".security-item-content").hide();
				$(this).find(".security-item-header").removeClass("expended");
			}
		});
		
		$("#sysLogUseYn").on('change', function(){
			var checkState = $("#sysLogUseYn").prop('checked');
			
			if(checkState){
				$("#syslogUrl").removeAttr("disabled");
				$("#syslogUrl").css("background", "#ffffff");
			}
			else{
				$("#syslogUrl").val('');
				$("#syslogUrl").attr("disabled", "disabled");
				$("#syslogUrl").css("background", "#d2d2d2");
			}
		});
		
		$('#createuser-pop').on('click', function() {
			var html = $("#credentialsTemplate").html();
			$("#credentialItemDiv").empty();
			$("#credentialItemDiv").append(html);
			
			openDialogPopupWithXBtn("createUserProviderDialog", "Create user-provided-service", 340, 600);
			
			_ee.emit("setServiceEventListener");
		});
		
		$("#dialogCnclBtn").on('click', function(){
			$("#rename-pop").close();
		});
		
		_ee.emit('setServiceEventListener');
	});
})();
