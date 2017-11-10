/**
 * Common Function
 * 2017-06-02
 */
var commonPumpkin = new Pumpkin();

(function(){
	
	/* 선택한 Org의 Space 목록 조회 (Org 단건) */
	commonPumpkin.addWork('getOrgInfo', function(params){
		var that = this;
		var orgGuid = params.orgGuid;
		
		CF.async({url : '/v2/organizations/' + orgGuid, method : 'GET'}, function(result){
			if(result){
				that.next(result);
			}
			else{
				openErrorPopup('Organization is not found.');
			}
		});
	});
	
	/* 선택한 Org의 Space 목록 조회 (Org 단건) */
	commonPumpkin.addWork('getSpaceListByOrg', function(params){
		var that = this;
		var url = "/v2/organizations/" + params.orgGuid + "/spaces";
		// Space 목록을 가져오는 API호출
		CF.async({url : url}, function(result){
			if(result){
				if(result.resources){
					that.next(result);
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
			openErrorPopup(errorObj.error);
		});
	});
	
	commonPumpkin.addWork("getAppList", function(params){
		var that = this;
		var url ="";
		if(params.url){
			url = params.url;
		}
		else{
			url = '/v2/spaces/' + param.spaceGuid + '/apps';
		}
		
		// App List를 가져오는 API호출
		CF.async({url : url, method : 'GET'}, function(result){
			if(result){
				if(result.resources){
					that.next(result);
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
			openErrorPopup(errorObj.error);
		});
	});
	
	commonPumpkin.addWork('getServiceInstancesInfo', function(param){
		var that = this;
		var url = '/v2/service_instances/' + param.serviceGuid;
		var service = {};
		service.serviceGuid = param.serviceGuid;
		CF.async({url : url, method : 'get'}, function(result){
			if(result.entity){
				service.instances = result;
				
				if(result.entity.service_url){
					CF.async({url : result.entity.service_url}, function(result){
						if(result){
							if(result.entity){
								service.service = result;
								that.next(service);
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
						openErrorPopup(errorObj.error);
					});
				}
				else{
					that.next(service);
				}
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});
	
	commonPumpkin.addWork('getUserProvidedServiceInstancesInfo', function(param){
		var that = this;
		var error = this.error;
		var url = '/v2/user_provided_service_instances/' + param.serviceGuid;
		var service = {};
		CF.async({url : url, method : 'get'}, function(result){
			if(result.entity){
				service.instances = result;
				
				CF.async({url : result.entity.service_url}, function(result){
					if(result){
						if(result.entity){
							service.service = result;
							that.next(service);
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
					that.next(param);
//					var errorObj = JSON.parse(error);
//					var errorInfo = JSON.parse(errorObj.error);
//					openErrorPopup(errorObj.error);
				});
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});
	
	commonPumpkin.addWork('getBindingService', function(service){
		var that = this;
		var error = this.error;
		
		CF.async({url : service.instances.entity.service_bindings_url}, function(result){
			if(result){
				if(result.resources){
					service.bindings = result.resources;
					that.next(service);
				}
				else{
					error(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				error('Unknown Error');
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);;
		});
	});
	
	// Get Service List
	commonPumpkin.addWork('getServicesInstanceList', function(param){
		var that = this;
		var url = '/v2/spaces/' + param.spaceGuid + '/service_instances';
		var resultParam = {};
		resultParam.spaceGuid = param.spaceGuid;
		CF.async({url : url, method : 'get'}, function(result){
			if(result.resources){
				resultParam.serviceInstances = result.resources;
				that.next(resultParam);
			}
			else{
				that.next(resultParam);
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});
	
	commonPumpkin.addWork('getUserProvidedServiceInSpace', function(params){
		var that = this;
		var spaceGuid = params.spaceGuid;
		CF.async({url : '/v2/user_provided_service_instances'}, function(result){
			if(result){
				var list = result.resources;
				var instanceList = [];
				if(list){
					var idx = 0;
					for(var i=0; i<list.length; i++){
						if(list[i].entity.space_guid == spaceGuid){
							instanceList[idx++] = list[i];
						}
					}
				}
				params.userServiceInstances = instanceList;
				that.next(params);
			}
		});
	});
	
	commonPumpkin.addWork('getServiceInstancesListInSpace', function(params){
		var that = this;
		commonPumpkin.execute([{name : 'getServicesInstanceList', params : {spaceGuid : params.spaceGuid}}, {name : 'getUserProvidedServiceInSpace'}], function(serviceObj){
			if(serviceObj){
				that.next(serviceObj);
			}
			else{
				error(result.description ? result.description : JSON.stringify(result.error));
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});
	
	commonPumpkin.addWork("getAppState", function(param){
		var next = this.next;
		var error = this.error;
		var state = "";
		
		CF.async({url : '/v2/apps/' + param.appItem.metadata.guid + '/stats'}, function(result){
			if(result){
				if(result.description || result.error){
					if(result.code == 200003){
						state = "Stopped";
					}
					else{
						openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
						setTimeout(function(){
							appListCheckState(appItem);
						}, 3000);
					}
				}
				else{
					for(var key in result){
						if(result[key].state == 'RUNNING'){
							state = "Started";
						}
						else if(result[key].state == 'STARTING'){
							state = "Started";
						}
						else if(result[key].state == 'STOP'){
							state = "Stopped";
						}
						else{
							state = "Down";
						}
					}
				}
				next(state);
			}
		});
	});
})();
