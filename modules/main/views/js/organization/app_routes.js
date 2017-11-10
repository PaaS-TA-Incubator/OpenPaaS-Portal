/**
 * Routes Function
 * 2017-05-24
 */
(function(){
	var pumpkin = new Pumpkin();
	var getUrlPumpkin = new Pumpkin();
	
	pumpkin.addWork('getRouteMappings', function(){
		var error = this.error;
		var next = this.next;
		var appInfo = this.data.appInfo;
		var that = this;
		
		//현재 앱에 맵핑된 라우트를 가져온다.
		CF.async({url : '/v2/apps/' + appInfo.metadata.guid + '/routes'}, function(result){
			if(result){
				if(result.resources){
					
					var forEach = new ForEach();
					forEach.async(result.resources, function(routeMapping, index){
						var done = this.done;
						
						getUrlPumpkin.execute([{name : 'getDomain', params : {host : routeMapping.entity.host, domain_url : routeMapping.entity.domain_url}}], function(url){
							routeMapping.entity.url = url;
							done();
						},
						function(workName, error){
							that.data.urlList.push(error);
						});
					},
					function(){
						that.data.routeMappings = result.resources;
						next();
					});
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				next();
			}
		},
		function(err){
			error(err);
		});
	});
	
	getUrlPumpkin.addWork('getDomain', function(params){
		var next = this.next;
		var error = this.error;
		
		CF.async({url : params.domain_url}, function(result){
			if(result){
				if(result.entity){
					next('http://' + params.host + '.' + result.entity.name);
				}
				else{
					next(params.host + ' : ' + result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				next(params.host + ' : Domain is not found.');
			}
		},
		function(err){
			next(params.host + ' : ' + err);
		});
	});
	
	_ee.on('setRouteMappings', function(appInfo){
		$("#routesArea, #routesAreaDialog").empty();
		pumpkin.setData({appInfo : appInfo, urlList : []});
		pumpkin.execute(['getRouteMappings'], function(){
			var mappingList = this.data.routeMappings;
			var forEach = new ForEach();
			forEach.async(mappingList, function(mapping, index){
				var done = this.done;
				
				addRouteMapping(appInfo.metadata.guid, mapping.entity.url, mapping.metadata.url);
				done();
			},
			function(){
			});
		});
	});
	
	_ee.on('setDomainUrl', function(domainUrl){
		$("#domainOptionSelected").empty();
		$("#domainOptionSelected").append('<option value="">Selected Domain</option>');
		$("#domainOptionSelected").parent().find('span').text("Selected Domain");
		
		CF.async({url : domainUrl}, function(result){
			if(result){
				if(result.resources){
					var domainList = result.resources;
					var domainOptionList = [{}];
					for(var i=0; i<domainList.length; i++){
						var optionHtml = "";
						domainOptionList[i].domainGuid = domainList[i].metadata.guid;
						domainOptionList[i].domainName = domainList[i].entity.name;
						optionHtml = "<option value ='" + domainList[i].metadata.guid + "'>" + domainList[i].entity.name + '</option>';
						$("#domainOptionSelected").append(optionHtml);
						
						if(i == 0){
							$("#domainOptionSelected").setSelected(domainList[i].metadata.guid);
						}
					}
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup("Domains are not found");
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
		
	});
	
	_ee.on('RegMapRouteAct', function(spaceGuid, appGuid, newHostName, domainUrlGuid, domainName){
		CF.async({url : '/v2/routes?q=host:' + newHostName + '&q=domain_guid:' + domainUrlGuid}, function(result){
			if(result){
				if(result.resources){
					$("#newHostName").val("");
					$("#domainOptionSelected option:eq(0)").attr("selected", "selected");
					$("#domainOptionSelected").parent().find('span').text("Selected Domain");
					
					if(result.resources.length == 1){
						mapRoute(appGuid, result.resources[0].metadata.guid, newHostName, domainUrlGuid, domainName);
						return;
					}
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
					return;
				}
			}
			else{
				openErrorPopup('Unknown Error');
				return;
			}

			//만약 스페이스 라우트 목록에 라우트가 없다면 새로운 라우트를 먼저 만들고.
			CF.async({url : "/v2/routes", method : "POST", form : {space_guid : spaceGuid, domain_guid : domainUrlGuid, host : newHostName}}, function(result){
				if(result){
					if(result.entity){
						//스페이스 라우트 목록에 있는 라우트를 이 앱에 맵핑 하는것. 이 라우트는 다른 앱에도 맵핑될 수 있나봄?
						mapRoute(appGuid, result.metadata.guid, newHostName, domainUrlGuid, domainName);
						$("#newHostName").val("");
						$("#domainOptionSelected option:eq(0)").attr("selected", "selected");
						$("#domainOptionSelected").parent().find('span').text("Selected Domain");
						return;
					}
					else{
						openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
					}
				}
				else{
					openErrorPopup('Route adding fail.');
				}
			},
			function(error){
				var errorObj = JSON.parse(error);
				var errorInfo = JSON.parse(errorObj.error);
				openErrorPopup(errorInfo.description);
			});
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});
	
	var addRouteMapping = function(appGuid, url, mappingUrl){
		var template = $('#routesRowTemplate').html();
		var dialogTemplate = $('#routesDialogRowTemplate').html();
		
		template = $(template.replace(/{urlLink}/gi, url));
		dialogTemplate = $(dialogTemplate.replace(/{urlLink}/gi, url));
		
		template.find('.unmap').on('click', function(){
			
			var target = $(this);
			openConfirmPopup("Routes Unmap", "Are you sure Unmap?");
			
			$("#confirmPopupBtn").on('click', function(e){
				$("#confirmPopup").close();
				var that = this;
				CF.async({url : mappingUrl + '/apps/' + appGuid, method : 'DELETE'}, function(result){
					var removeTargetText = $(target.parent().find('a')[0]).text();
					target.parent().remove();
					
					var routeListLi = $("#routesAreaDialog").find('li');
					for(var i=0; i<routeListLi.length; i++){
						var url = $(routeListLi[i]).find('a>span').text();
						if(removeTargetText == url){
							$(routeListLi[i]).remove();
							break;
						}
					}
					
				},
				function(error){
					/*var errorObj = JSON.parse(error);
					var errorInfo = JSON.parse(errorObj.error);*/
					openErrorPopup(error.description);
				});
			});
		});
		
		dialogTemplate.find('.unmap').on('click', function(){
			
			var target = $(this);
			openConfirmPopup("Routes Unmap", "Are you sure Unmap?");
			
			$("#confirmPopupBtn").on('click', function(e){
				$("#confirmPopup").close();
				var that = this;
				CF.async({url : mappingUrl + '/apps/' + appGuid, method : 'DELETE'}, function(result){
					var removeTargetText = target.parent().find('a > span').text();
					target.parent().remove();
					var routeListLi = $("#routesArea").find('li');
					for(var i=0; i<routeListLi.length; i++){
						var url = $($(routeListLi[i]).find('a')[0]).text();
						if(removeTargetText == url){
							$(routeListLi[i]).remove();
							break;
						}
					}
				},
				function(error){
					openErrorPopup(error.description);
				});
			});
		});
		
		$("#routesArea").append(template);
		$("#routesAreaDialog").append(dialogTemplate);
	};
	
	var mapRoute = function(appGuid, routeGuid, newHostName, domainUrlGuid, domainName){
		CF.async({url : '/v2/routes/' + routeGuid + '/apps/' + appGuid, method : "PUT"}, function(result){
			if(result){
				if(result.entity){
					var url = 'http://' + newHostName + '.' + domainName;
					addRouteMapping(appGuid, url, result.metadata.url);
					return;
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup('Route mapping fail.')
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	};
	
})();