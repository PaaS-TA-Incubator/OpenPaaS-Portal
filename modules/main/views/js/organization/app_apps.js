/**
 * Appication Global Function
 * 2017-05-17 
 */
(function(){
	var updateAppState = new Pumpkin();
	
	updateAppState.addWork('startApp', function(param){
		
		var next = this.next;
		var error = this.error;
		
		CF.async({url : '/v2/apps/' + param.appGuid, method : 'PUT', headers : {'Content-Type' : 'application/x-www-form-urlencoded'}, form : {state : 'STARTED'}}, function(result){
			if(result){
				if(result.entity && result.entity.state == 'STARTED'){
//					app.entity.state = result.entity.state;
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup('Unknown Error.');
			}
			checkState(result);
			next();
		});
	});
	
	updateAppState.addWork('stopApp', function(param){
		
		var next = this.next;
		var error = this.error;
		
		CF.async({url : '/v2/apps/' + param.appGuid, method : 'PUT', headers : {'Content-Type' : 'application/x-www-form-urlencoded'}, form : {state : 'STOPPED'}}, function(result){
			if(result){
				if(result.entity && result.entity.state == 'STOPPED'){
					checkState(result);
					next();
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup('Unknown Error.');
			}
		});
	});
	
	updateAppState.addWork('restartApp', function(param){
		
		var next = this.next;
		var error = this.error;
		
		_ee.emit('setStartingStateBtn');
		CF.async({url : '/v2/apps/' + param.appGuid + '/restage', method : 'POST'}, function(result){
			if(result){
				if(result.entity && result.entity.state == 'STARTED'){
					result.restart = true;
					checkState(result);
					next();
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup('Unknown Error.');
			}
		});
	});
	
	updateAppState.addWork("getAppState", function(param){
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
	
	_ee.on('startApp', function(appGuid){
		var that = this;
		updateAppState.execute([{name : 'startApp', params : {appGuid : appGuid}}], function(state){
			
		});
	});
	
	_ee.on('stopApp', function(appGuid){
		var that = this;
		updateAppState.execute([{name : 'stopApp', params : {appGuid : appGuid}}], function(state){
			
		});
	});
	
	_ee.on('restartApp', function(appGuid){
		var that = this;
		updateAppState.execute([{name : 'restartApp', params : {appGuid : appGuid}}], function(state){
			
		});
	});
	
	_ee.on('setRunningStateBtn', function(){
		$("#stateChgBtn").removeClass();
		$("#stateChgBtn").addClass("Button paas-iconbtn");
		
		$("#stateChgBtn > span").removeClass();
		$("#stateChgBtn > span").addClass("paas-icon app-stop");
		$("#stateChgBtn").attr("title", "Stop");
		
		$("#reStartBtn").removeClass();
		$("#reStartBtn").addClass("Button paas-iconbtn");
		$("#reStartBtn").attr("title", "Restart");
		
		$(".dash-app__control > span").removeClass();
		$(".dash-app__control > span").addClass("dash-app__status status-running");
		$(".dash-app__control > span").text("Running");
	});
	
	_ee.on('setStartingStateBtn', function(){
		$("#stateChgBtn").removeClass();
		$("#stateChgBtn").addClass("Button paas-iconbtn Disabled");
		
		$("#stateChgBtn > span").removeClass();
		$("#stateChgBtn > span").addClass("paas-icon app-stop");
		$("#stateChgBtn").attr("title", "Stop");
		
		$("#reStartBtn").removeClass();
		$("#reStartBtn").addClass("Button paas-iconbtn Disabled");
		$("#reStartBtn").attr("title", "Can not restart");
		
		$(".dash-app__control > span").removeClass();
		$(".dash-app__control > span").addClass("dash-app__status status-started");
		$(".dash-app__control > span").text("Starting");
	});
	
	_ee.on('setStopStateBtn', function(){
		$("#stateChgBtn").removeClass();
		$("#stateChgBtn").addClass("Button paas-iconbtn");
		
		$("#stateChgBtn > span").removeClass();
		$("#stateChgBtn > span").addClass("paas-icon app-play");
		$("#stateChgBtn").attr("title", "Start");
		
		$("#reStartBtn").removeClass();
		$("#reStartBtn").addClass("Button paas-iconbtn Disabled");
		$("#reStartBtn").attr("title", "Can not restart");
		
		$(".dash-app__control > span").removeClass();
		$(".dash-app__control > span").addClass("dash-app__status status-stopped");
		$(".dash-app__control > span").text("Stopped");
	});
	
	_ee.on('setCrashedStateBtn', function(){
		$("#stateChgBtn").removeClass();
		$("#stateChgBtn").addClass("Button paas-iconbtn");
		
		$("#stateChgBtn > span").removeClass();
		$("#stateChgBtn > span").addClass("paas-icon app-play");
		$("#stateChgBtn").attr("title", "Start");
		
		$("#reStartBtn").removeClass();
		$("#reStartBtn").addClass("Button paas-iconbtn Disabled");
		$("#reStartBtn").attr("title", "Can not restart");
		
		$(".dash-app__control > span").removeClass();
		$(".dash-app__control > span").addClass("dash-app__status status-crashed");
		
		$(".dash-app__control > span").text("Crashed");
	});

	_ee.on('createAppsDefaultInfo', function(appList){
		var started = 0;
		var stopped = 0;
		var down = 0;
		var totalQuata = 0;
		var useQuata = 0;
		
		var foreach = new ForEach();
		foreach.async(appList, function(appItem, index){
			var done = this.done;
			commonPumpkin.execute([{name : 'getAppState', params : {appItem : appItem}}], function(state){
				if(state == 'Started'){
					started++;
					useQuata += appItem.entity.memory * appItem.entity.instances;
					totalQuata += appItem.entity.memory * appItem.entity.instances;
				}
				else if(state == 'Stopped'){
					stopped++;
					totalQuata += appItem.entity.memory * appItem.entity.instances;
				}
				else{
					down++;
					totalQuata += appItem.entity.memory * appItem.entity.instances;
				}
				done();
			});
		},
		function(){
			var persent = 0;
			if(totalQuata != 0 && useQuata != 0){
				persent = (useQuata / totalQuata) * 100;
				persent = persent.toFixed(2);
				persent = Math.round(persent);
			}
			
			$("#spaceQuota").text(persent + "%");
			$("#appsTotNum").text(appList.length);
			$("#startedAppCount").text(started);
			$("#stoppedAppCount").text(stopped);
			$("#downAppCount").text(down);
		});
		
//		for(var i=0; i<appList.length; i++){
//			if(appList[i].entity.state == 'STARTED'){
//				started++;
//				useQuata += appList[i].entity.memory * appList[i].entity.instances;
//				totalQuata += appList[i].entity.memory * appList[i].entity.instances;
//			}
//			else if(appList[i].entity.state == 'STOPPED'){
//				stopped++;
//				totalQuata += appList[i].entity.memory * appList[i].entity.instances;
//			}
//			else{
//				down++;
//				totalQuata += appList[i].entity.memory * appList[i].entity.instances;
//			}
//		}
		
//		var persent = 0;
//		if(totalQuata != 0 && useQuata != 0){
//			persent = (useQuata / totalQuata) * 100;
//			persent = persent.toFixed(2);
//			persent = Math.round(persent);
//		}
//		
//		$("#spaceQuota").text(persent + "%");
//		$("#appsTotNum").text(appList.length);
//		$("#startedAppCount").text(started);
//		$("#stoppedAppCount").text(stopped);
//		$("#downAppCount").text(down);
	});
	
	_ee.on('createAppList', function(appList){
		$("#appListTbody").empty();
		$("#appListTbody").hide();
		
		// loading bar
		var loadingBarHtml = $("#listLoadingBarTemplate").html().replace("{colspan}", "7");
		$("#tableBody").append(loadingBarHtml);
		
		var foreach = new ForEach();
		var appItemLength = appList.length-1;
		
		foreach.async(appList, function(appItem, index){
			var done = this.done;
			var lev1Idx = index;
			_ee.emit('setAppItemInfos', appItem);
			CF.async({url : appItem.entity.routes_url, method : 'get'}, function(result){
				if(result.resources){
					
					var routeList = result.resources;
					var routeHtml = "";
					
					forEach = new ForEach();
					var routeListLength = routeList.length-1;
					
					forEach.async(routeList, function(route, index){
						var lev2Idx = index;
						var routeDone = this.done;
						var host = route.entity.host;
						var domainUrl = route.entity.domain_url;
						
						CF.async({url : domainUrl}, function(domain){
							if(domain){
								if(domain.entity){
									var routeText = "";
									routeText += "http://" + host + "." + domain.entity.name;
									routeText = '<a href="' + routeText + '" target="_blank">' + routeText + '</a>';
									if($("#route_" + appItem.metadata.guid).text()){
										$("#route_" + appItem.metadata.guid).append("<br>");
									}
									$("#route_" + appItem.metadata.guid).append(routeText);
								}
							}
							routeDone();
						});
					});
				}
				done();
			});
		},
		function(){
			$("#listLoadingBar").remove();
			$("#appListTbody").show();
		});
	});
	
	_ee.on('setAppName', function(appGuid){
		var that = this;
		var url = '/v2/apps/' + appGuid + '/summary';
		
		CF.async({url : url, method : 'get'}, function(result){
			if(result){
				$("#appName").text(result.name);
			}
		});
	});
	
	_ee.on('setAppItemInfos', function(appItem){
		var appListItemTemplate = $("#appListItemTemplate").html();
		appListItemTemplate = appListItemTemplate.replace("<tr>", '<tr id="' + appItem.metadata.guid + '">');
		appListItemTemplate = appListItemTemplate.replace("status_", "status_" + appItem.metadata.guid);
		appListItemTemplate = appListItemTemplate.replace("appName_", "appName_" + appItem.metadata.guid);
		appListItemTemplate = appListItemTemplate.replace("route_", "route_" + appItem.metadata.guid);
		appListItemTemplate = appListItemTemplate.replace("diskLimit_", "diskLimit_" + appItem.metadata.guid);
		appListItemTemplate = appListItemTemplate.replace("instance_", "instance_" + appItem.metadata.guid);
		appListItemTemplate = appListItemTemplate.replace("memory_", "memory_" + appItem.metadata.guid);
		
		$("#appListTbody").append(appListItemTemplate);
		
//		var state = appListCheckState(appItem);
		commonPumpkin.execute([{name : 'getAppState', params : {appItem : appItem}}], function(state){
			if(state == 'Started'){
				$("#status_" + appItem.metadata.guid).attr("class", "dash-app__status status-running");
				$("#status_" + appItem.metadata.guid).text("Started");
			}
			else if(state == 'Stopped'){
				$("#status_" + appItem.metadata.guid).attr("class", "dash-app__status status-stopped");
				$("#status_" + appItem.metadata.guid).text("Stopped");
			}
			else{
				$("#status_" + appItem.metadata.guid).attr("class", "dash-app__status status-down");
				$("#status_" + appItem.metadata.guid).text("Down");
			}
		});
		
		$("#appName_" + appItem.metadata.guid).text(appItem.entity.name);
		$("#diskLimit_" + appItem.metadata.guid).text(appItem.entity.disk_quota);
		$("#instance_" + appItem.metadata.guid).text(appItem.entity.instances);
		$("#memory_" + appItem.metadata.guid).text(appItem.entity.memory);
	});
	
	_ee.on('checkState', function(app){
		checkState(app);
	});
	
	var checkState = function(app){
		var appGuid = app.metadata.guid;
		
		CF.async({url : '/v2/apps/' + appGuid + '/stats'}, function(result){
			if(result){
				if(result.description || result.error){
					if(result.code == 200003){
						_ee.emit('setStopStateBtn');
					}
					else{
						setTimeout(function(){
							_ee.emit('setStartingStateBtn');
							checkState(app);
						}, 3000);
					}
				}
				else{
					var isRunning = true;
					var runningCount = 0;
					var startingCount = 0;
					var totalCount = 0;
					
					for(var key in result){
						if(result[key].state == 'RUNNING'){
							runningCount++;
						}
						else if(result[key].state == 'STARTING'){
							startingCount++;
						}
						
						totalCount++;
					}
					
					if(runningCount > 0){
						if(startingCount == 0){
							_ee.emit('setRunningStateBtn');
						}
						else{
							//running도 있고 starting이 있고.
							setTimeout(function(){
								_ee.emit('setStartingStateBtn');
								checkState(app);
							}, 3000);
						}
					}
					else{
						// Restart인 경우 starting status를 유지하기 위함.
						if(app.restart){
							if(startingCount == 0){
								setTimeout(function(){
									_ee.emit('setStartingStateBtn');
									checkState(app);
								}, 3000);
							}
							else{
								checkState(app);
							}
						}
						
						else if(startingCount == 0){
							//running 없고 starting도 없고 down.
							_ee.emit('setCrashedStateBtn');
						}
						else{
							//running 없고 starting 있고.
							_ee.emit('setStartingStateBtn');
							checkState(app);
						}
					}
				}
			}
			else{
				_ee.emit('setCrashedStateBtn');
			}
		});
	};
	
	var appListCheckState = function(appItem){
		var state = "";
		
		CF.async({url : '/v2/apps/' + appItem.metadata.guid + '/stats'}, function(result){
			if(result){
				if(result.description || result.error){
					if(result.code == 200003){
						$("#status_" + appItem.metadata.guid).attr("class", "dash-app__status status-stopped");
						$("#status_" + appItem.metadata.guid).text("Stopped");
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
							$("#status_" + appItem.metadata.guid).attr("class", "dash-app__status status-running");
							$("#status_" + appItem.metadata.guid).text("Started");
							state = "Started";
						}
						else if(result[key].state == 'STARTING'){
							$("#status_" + appItem.metadata.guid).attr("class", "dash-app__status status-running");
							$("#status_" + appItem.metadata.guid).text("Started");
							state = "Started";
						}
						else if(result[key].state == 'STOP'){
							$("#status_" + appItem.metadata.guid).attr("class", "dash-app__status status-stopped");
							$("#status_" + appItem.metadata.guid).text("Stopped");
							state = "Stopped";
						}
						else{
							$("#status_" + appItem.metadata.guid).attr("class", "dash-app__status status-down");
							$("#status_" + appItem.metadata.guid).text("Down");
							state = "Down";
						}
					}
				}
			}
		});
		return state;
	}
	
})();