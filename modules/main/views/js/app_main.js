/**
 * Application Main Function
 * 2017-05-10
 */
(function(){

	var optionList = ["256", "512", "1024", "2046"];
	var pumpkin = new Pumpkin();

	_ee.on("createSelectedOption", function(selectedTargetId, selectedValue){
		var optionHtml = "";
		var isHave = false;
		for(var i=0; i<optionList.length; i++){
			if(optionList[i] > selectedValue && optionList[i] != selectedValue && !isHave){
				optionHtml += "<option>" + selectedValue + "MB</option>";
				isHave = true;
			}
			else if(optionList[i] == selectedValue){
				isHave = true;
			}
			optionHtml += "<option>" + optionList[i] + "MB</option>"
		}
		optionHtml += "<option>Custom</option>"
		$("#" + selectedTargetId).html(optionHtml);

		$("#" + selectedTargetId).setSelected(selectedValue + "MB");
	});

	_ee.on("setAppInstanceStatus", function(appGuid){
		// Loading Bar
		var loadingBar = $("#panelLoadingBarTemplate_table").html();
		loadingBar = loadingBar.replace("{colspan}", "5");
		$("#instanceStatusArea").hide();
		$("#instanceStatusArea").parent().append(loadingBar);

		pumpkin.execute([{name : 'getAppInstanceStatus', params : {appGuid : appGuid}}], function(result){
			$("#instanceStatusArea").empty();
			var index = 0;
			for(var key in result){
				if(result[key].stats){
					var days = Math.floor(result[key].stats.uptime / 60 / 60 / 24);
					var remain = ((result[key].stats.uptime / 60 / 60 / 24) - days) * 24;
					var hours = Math.floor(remain);
					var min = Math.floor((remain - hours) * 60);

					var html = "";
					html = "<tr>";
					html += "<td>" + (index++) +"</td>";
					html += "<td>" + Math.round(result[key].stats.usage.cpu * 100) + "%</td>";
					html += "<td>" + Math.round(result[key].stats.usage.mem / 1024 / 1024) + "MB</td>";
					html += "<td>" + Math.round(result[key].stats.usage.disk / 1024 / 1024) + "MB</td>";
					html += "<td>" + (days > 0 ? days + 'd ' : '') + (hours > 0 ? hours + 'hr ' : '') + (min > 0 ? min + 'min' : '') + "</td>";
					html += "</tr>";

					$("#instanceStatusArea").append(html);
				}
			}
			$("#panelLoadingBar_table").remove();
			$("#instanceStatusArea").show();
		})
	});

	_ee.on("setAppInstanceStatusDialog", function(appGuid){
		// Loading Bar
		var loadingBar = $("#panelLoadingBarTemplate_table").html();
		loadingBar = loadingBar.replace("{colspan}", "5");
		$("#instanceStatusDialogList").hide();
		$("#instanceStatusDialogList").parent().append(loadingBar);

		pumpkin.execute([{name : 'getAppInstanceStatus', params : {appGuid : appGuid}}], function(result){
			$("#instanceStatusDialogList").empty();
			var index = 0;
			for(var key in result){
				if(result[key].stats){
					var days = Math.floor(result[key].stats.uptime / 60 / 60 / 24);
					var remain = ((result[key].stats.uptime / 60 / 60 / 24) - days) * 24;
					var hours = Math.floor(remain);
					var min = Math.floor((remain - hours) * 60);

					var html = "";
					html = "<tr>";
					html += "<td>" + (index++) +"</td>";
					html += "<td>" + Math.round(result[key].stats.usage.cpu * 100) + "%</td>";
					html += "<td>" + Math.round(result[key].stats.usage.mem / 1024 / 1024) + "MB</td>";
					html += "<td>" + Math.round(result[key].stats.usage.disk / 1024 / 1024) + "MB</td>";
					html += "<td>" + (days > 0 ? days + 'd ' : '') + (hours > 0 ? hours + 'hr ' : '') + (min > 0 ? min + 'min' : '') + "</td>";
					html += "</tr>";

					$("#instanceStatusDialogList").append(html);
				}
			}
			$("#panelLoadingBar_table").remove();
			$("#instanceStatusDialogList").show();
		})
	});

	pumpkin.addWork('getAppsInfo', function(){
		var that = this;
		_ee.emit('setAppName', _global.hash.apps);
		CF.async({url : '/v2/apps/' + _global.hash.apps}, function(result){
			if(result.entity){
				var appInfo = result.entity;

				_ee.emit('checkState', result);
				var buildPackName = appInfo.buildpack;
				if(buildPackName != "java_buildpack" && buildPackName != "nodejs_buildpack" && buildPackName != "php_buildpack" && buildPackName != "python_buildpack" && buildPackName != "ruby_buildpack"){
					buildPackName = "sample-img";
				}
				$("#buildpack-img").attr("src", "/modules/main/views/images/" + buildPackName + ".png");
				$("#paas-app__txt").html("Buildpack<br>" + buildPackName);

				$("#instancesNum").attr("data-value", appInfo.instances);
				$("#memoryLimit").attr("data-value", appInfo.memory + "MB");
				$("#diskLimit").attr("data-value", appInfo.disk_quota + "MB");

				$("#instancesNum").val(appInfo.instances);
				_ee.emit("createSelectedOption", "memoryLimit", appInfo.memory);
				_ee.emit("createSelectedOption", "diskLimit", appInfo.disk_quota);

				that.next(result);
			}
		});
	});

	pumpkin.addWork('getAppEvents', function(appInfo){
		var that = this;

		// 최초 한달간의 이벤트들을 불러온다.
		var today = new Date();
		today.setMonth(-1);
		var year = today.getFullYear();
		var month = today.getMonth() + 1;
		month = month < 10 ? '0' + month : month;
		var date = today.getDate();
		date = date < 10 ? '0' + date : date;

		CF.async({url : '/v2/events?order-direction=desc&q=actee:' + appInfo.metadata.guid + '&q=timestamp>' + year + '-' + month + '-' + date, method : 'GET'}, function(result){
			if(result){
				if(result.resources){
					var eventList = result.resources;
					var html = '';
					if(eventList){
						$("#eventsPanel").empty();
						for(var i=0; i<eventList.length; i++){
							var type = eventList[i].entity.type;
							var actor = eventList[i].entity.actor_name;
							var timestamp = eventList[i].entity.timestamp;
							var eventsItemTemplate = $("#eventsItemTemplate").html();
							// 하는김에 Dialog에도 값 저장
							var eventsDialogTemplate = $("#eventsDialogTemplate").html();

							type = (type.substring(type.lastIndexOf(".") + 1)) ? type.substring(type.lastIndexOf(".") + 1) : "";

							if(type.toLowerCase() == "started"){
								eventsItemTemplate = eventsItemTemplate.replace("{stateClass}", "play").replace("{state}", "play").replace("{stateNm}", "Stated");
								eventsDialogTemplate = eventsDialogTemplate.replace("{stateClass}", "play").replace("{state}", "play").replace("{stateNm}", "Stated");
							}
							else if(type.toLowerCase() == "stoped"){
								eventsItemTemplate = eventsItemTemplate.replace("{stateClass}", "stop").replace("{state}", "stop").replace("{stateNm}", "Stopped");
								eventsDialogTemplate = eventsDialogTemplate.replace("{stateClass}", "stop").replace("{state}", "stop").replace("{stateNm}", "Stopped");
							}
							else if(type.toLowerCase() == "crash"){
								eventsItemTemplate = eventsItemTemplate.replace("{stateClass}", "crash").replace("{state}", "crash").replace("{stateNm}", "Crashed");
								eventsDialogTemplate = eventsDialogTemplate.replace("{stateClass}", "crash").replace("{state}", "crash").replace("{stateNm}", "Crashed");
							}
							else if(type.toLowerCase() == "update"){
								eventsItemTemplate = eventsItemTemplate.replace("{stateClass}", "update").replace("{state}", "update").replace("{stateNm}", "Updated");
								eventsDialogTemplate = eventsDialogTemplate.replace("{stateClass}", "update").replace("{state}", "update").replace("{stateNm}", "Updated");
							}
							else if(type.toLowerCase() == "rename"){
								eventsItemTemplate = eventsItemTemplate.replace("{stateClass}", "rename").replace("{state}", "rename").replace("{stateNm}", "Rename");
								eventsDialogTemplate = eventsDialogTemplate.replace("{stateClass}", "rename").replace("{state}", "rename").replace("{stateNm}", "Rename");
							}
							else{
								eventsItemTemplate = eventsItemTemplate.replace("{stateClass}", "info").replace("{state}", "info").replace("{stateNm}", type);
								eventsDialogTemplate = eventsDialogTemplate.replace("{stateClass}", "info").replace("{state}", "info").replace("{stateNm}", type);
							}

							eventsItemTemplate = eventsItemTemplate.replace("{actor}", actor).replace("{timestamp}", timestamp);
							eventsDialogTemplate = eventsDialogTemplate.replace("{actor}", actor).replace("{timestamp}", timestamp);
							$("#eventsPanel").append(eventsItemTemplate);
							$("#eventDialogList").append(eventsDialogTemplate);
						}
					}
					$("#eventDialogLoadingBar").hide();
					$("#eventDialogList").show();
				}

				that.next(appInfo);
			}
		});
	});

	pumpkin.addWork('getAppInstanceStatus', function(params){
		var that = this;

		CF.async({url : '/v2/apps/' + params.appGuid + '/stats'}, function(result){
			if(result){
				that.next(result);
			}
		});
	});

	pumpkin.addWork('getAppBoundServices', function(appInfo){
		var that = this;

		CF.async({url : '/v2/spaces/' + appInfo.metadata.guid + '/service_instances'}, function(result){
			if(result){
				that.next();
			}
		})
	});

	_ee.on('checkedScallChange', function(){
		var originInstanceVal = $("#instancesNum").attr('data-value');
		var originMemoryVal = $("#memoryLimit").attr('data-value');
		var originDiskVal = $("#diskLimit").attr('data-value');

		var changeInstanceVal = $('#instancesNum').val();
		var changeMemoryVal = $('#memoryLimit').val();
		var changeDiskVal = $('#diskLimit').val();

		if(originMemoryVal){
			originMemoryVal = originMemoryVal.replace("MB", "");
		}
		if(originDiskVal){
			originDiskVal = originDiskVal.replace("MB", "");
		}
		if(changeMemoryVal){
			changeMemoryVal = changeMemoryVal.replace("MB", "");
		}
		if(changeDiskVal){
			changeDiskVal = changeDiskVal.replace("MB", "");
		}

		if(originInstanceVal == changeInstanceVal && originMemoryVal == changeMemoryVal && originDiskVal == changeDiskVal){
			if(!$("#scaleAppBtn").hasClass("Disabled")){
				$("#scaleAppBtn").addClass("Disabled");
				$("#scaleAppBtn").setEnabled(false);
			}

			if(!$("#scaleCnclBtn").hasClass("Disabled")){
				$("#scaleCnclBtn").addClass("Disabled");
				$("#scaleCnclBtn").setEnabled(false);
			}
		}
		else{
			if($("#scaleAppBtn").hasClass("Disabled")){
				$("#scaleAppBtn").removeClass("Disabled");
				$("#scaleAppBtn").setEnabled(true);
			}

			if($("#scaleCnclBtn").hasClass("Disabled")){
				$("#scaleCnclBtn").removeClass("Disabled");
				$("#scaleCnclBtn").setEnabled(true);
			}
		}
	});

	var dialogPumpkin = new Pumpkin();
	dialogPumpkin.addWork('setBuildpackDialogValue', function(){
		var that = this;
		CF.async({url : '/v2/apps/' + _global.hash.apps}, function(result){
			if(result.entity){
				var appInfo = result.entity;

				$("#buildpack_txt").text(appInfo.buildpack ? appInfo.buildpack : appInfo.detected_buildpack);
				$("#buildpack_cmd").text(appInfo.detected_start_command);

				CF.async({url : appInfo.stack_url}, function(stackResult){
					if(stackResult && stackResult.entity){
						$("#buildpack_stack").text(stackResult.entity.name + "(" + stackResult.entity.description + ")");
					}
					else{
						var errorText = stackResult.description ? stackResult.description : JSON.stringify(stackResult.error);
						openErrorPopup(errorText);
					}
				}, function(error){
					var errorObj = JSON.parse(error);
					var errorInfo = JSON.parse(errorObj.error);
					openErrorPopup(errorInfo.description);
				});
				that.next(result);
			}
		});
	});

	var bindScaleEvent = function(){
		$('#scalingForm input[data-id]').on('keyup', function(e){
			_ee.emit('checkedScallChange');
		});
		$('#scalingForm input[data-id]').on('change', function(e){
			_ee.emit('checkedScallChange');
		});

		$('#scalingForm select[data-id]').on('change', function(e){

			if($(this).val() == "Custom"){
				var thisId = $(this).parent().parent().find('.Divselect > select').attr('id');
				var thisVal = $(this).parent().parent().find('.Divselect > select').attr('data-value').replace('MB', '');
				$(this).parent().parent().find('.Divselect > select').attr('id', thisId + "_disabled");
				$(this).parent().parent().find('.Divselect').hide();

				$(this).parent().parent().find('.Spinner > input').attr('id', thisId);
				$(this).parent().parent().find('.Spinner > input').attr('data-value', thisVal);
				$(this).parent().parent().find('.Spinner > input').val(thisVal);
				$(this).parent().parent().find('.Spinner').show();
			}
			else{
				_ee.emit('checkedScallChange');
			}
		});

		$('#scaleAppBtn').on('click', function(e){
			openConfirmPopup("Scale Update", "Are you sure modify?", "updateScale");
		});

		$('#scaleCnclBtn').on('click', function(e){
			var originInstancesNum = $("#instancesNum").attr("data-value");
			var originMemoryLimitNum = $("#memoryLimit").attr("data-value");
			var originDiskLimitNum = $("#diskLimit").attr("data-value");

			if(!$("#memoryLimit").hasClass("Select")){
				var inputDiv = $("#memoryLimit").parent();
				var selectedDiv = $("#memoryLimit").parent().parent().find(".Divselect");
				originMemoryLimitNum = originMemoryLimitNum.replace("MB", "") + "MB";
				inputDiv.attr("data-value", "");
				inputDiv.val("");
				inputDiv.attr("id", "memoryLimit_disabled");
				selectedDiv.find('select').attr("id", "memoryLimit");
				inputDiv.hide();
				selectedDiv.show();
			}

			if(!$("#diskLimit").hasClass("Select")){
				var inputDiv = $("#diskLimit").parent();
				var selectedDiv = $("#diskLimit").parent().parent().find(".Divselect");
				originDiskLimitNum = originDiskLimitNum.replace("MB", "") + "MB";
				inputDiv.attr("data-value", "");
				inputDiv.val("");
				inputDiv.attr("id", "diskLimit_disabled");
				selectedDiv.find('select').attr("id", "diskLimit");
				inputDiv.hide();
				selectedDiv.show();
			}

			$("#instancesNum").val(originInstancesNum);
			$("#memoryLimit").setSelected(originMemoryLimitNum);
			$("#diskLimit").setSelected(originDiskLimitNum);
		});
	};

	var updateScale = function(){
		var updateInstance = $('#instancesNum').val();
		var updateMemory = $('#memoryLimit').val().replace("MB", "").trim();;
		var updateDisk = $('#diskLimit').val().replace("MB", "").trim();

		CF.async({url : '/v2/apps/' + _global.hash.apps, method : 'PUT', form : {instances : new Number(updateInstance), memory : new Number(updateMemory), disk_quota : new Number(updateDisk)}}, function(result){
			if(result){
				if(result.entity){

					$("#instancesNum").attr("data-value", result.entity.instances);
					$("#memoryLimit").attr("data-value", result.entity.memory + "MB");
					$("#diskLimit").attr("data-value", result.entity.disk_quota + "MB");

					_ee.emit('checkedScallChange');

					if($("#memoryLimit").hasClass("Select")){
						_ee.emit("createSelectedOption", "memoryLimit", result.entity.memory);
					}
					else{
						_ee.emit("createSelectedOption", "memoryLimit_disabled", result.entity.memory);
					}

					if($("#diskLimit").hasClass("Select")){
						_ee.emit("createSelectedOption", "diskLimit", result.entity.disk_quota);
					}
					else{
						_ee.emit("createSelectedOption", "diskLimit_disabled", result.entity.disk_quota);
					}
					_ee.emit('setAppInstanceStatus', _global.hash.apps);
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			$("#confirmPopup").close();

		},
		function(error){
			if(error.stack){
				console.error(error = error.stack);
			}
			else{
				var errorObj = JSON.parse(error);
				var errorInfo = JSON.parse(errorObj.error);
				openErrorPopup(errorInfo.description);
			}

			var desc = $($('#scaleResultTemplate').html().replace('{description}', error));
			desc.insertAfter(tr);
			desc.find('.glyphicon-remove').on('click', function(){
				desc.remove();
			});
		});
	};

	var createDialogs = function(){
		var spaceGuid = _global.hash.space;
		var appGuid = _global.hash.apps;

		$('#buildpack-popup').on('click', function() {
			openDialogPopup("buildpack", "Buildpack", 480, 794);
		});
		$('#openEventDialog').on('click', function() {
			openDialogPopup("eventDialog", "Events", 430, 794);
		});
		$('#openInstanceStatusDialog').on('click', function() {
			_ee.emit('setAppInstanceStatusDialog', _global.hash.apps);
			openDialogPopup("instanceStatusDialog", "Instance Status", 430, 794);
		});
		$("#openServiceBindDialog").on('click', function(){
			_ee.emit("setServiceBindingDialog", _global.hash.space, _global.hash.apps);
			openDialogPopup("serviceBindDialog", "Bind A New Service", 580, 794);
		});
		$("#openEnvVariablesDialog").on('click', function(){
			openDialogPopup("envVariablesDialog", "Environment Variables", 550, 794);
		});
		$("#openMapNewRouteDialog").on('click', function(){
			_ee.emit("setDomainUrl", $("#" + spaceGuid).get(0).item.organization.entity.domains_url);
			openDialogPopup("mapNewRouteDialog", "Map a new route", 460, 540);

			$("#newMapRouteActBtn").on('click', function(){
				var newHostName = $("#newHostName").val();
				var domainUrlGuid = $("#domainOptionSelected").val();
				var domainName = $("#domainOptionSelected option:selected").text();

				if(!newHostName){
					openWarringPopup("Enter A New Host Name.");
					return false;
				}
				if(!domainUrlGuid){
					openWarringPopup("Not Selected Domain Url");
					return false;
				}
				_ee.emit('RegMapRouteAct', spaceGuid, appGuid, newHostName, domainUrlGuid, domainName);
			});
		});

		$("#openLogsDialog").on('click', function(){
			_ee.emit('app_detail_logs_dialog', appGuid);
			openDialogPopup("logsDialog", "Logs", 550, 794);
		});

		$("#linkALD").on('click', function(){
			_ee.emit('goLoggingDashboard', appGuid);
		});
	};


	var renameApp = function(){
		$("#rename-pop-apps").close();
		var newAppName = $("#newAppName").val();

		CF.async({url : '/v2/apps/' + _global.hash.apps, method : 'PUT', form : {name : newAppName}}, function(result){
			if(result){
				if(result.entity){
					$("#appName").text(result.entity.name);
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
	}

	var deleteApp = function(){
		$("#rename-pop-apps").close();
		CF.async({url : '/v2/apps/' + _global.hash.apps, method : 'DELETE'}, function(result){
			if(result && result.code){
				openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
			}
			else{
				// 성공
				location.href = "/space_main#space=" + _global.hash.space;
			}
		});
	};

	$(document).ready(function(){
		$(".container-wrap").hide();
		$('#backgroundProgress').show();

		pumpkin.execute(['getAppsInfo', 'getAppEvents'], function(appInfo){
			_ee.emit('setAppInstanceStatus', appInfo.metadata.guid);
			_ee.emit('setBindingService');
			_ee.emit('setEnvironmentVariables', appInfo);
			_ee.emit('setRouteMappings', appInfo);
			_ee.emit('app_detail_logs', appInfo.metadata.guid);

			$(".container-wrap").show();
			$('#backgroundProgress').hide();
		});

		$("#stateChgBtn").on('click', function(){
			if(_global.hash.apps){
				if($("#" + $(this)[0].id).find(' > span').hasClass('app-play')){
					_ee.emit('startApp', _global.hash.apps);
				}
				else if($("#" + $(this)[0].id).find(' > span').hasClass('app-stop')){
					_ee.emit('stopApp', _global.hash.apps);
				}
			}
		});

		$("#reStartBtn").on('click', function(){
			_ee.emit('restartApp', _global.hash.apps);
		});

		bindScaleEvent();

		/* Create Dialog */
		dialogPumpkin.execute(['setBuildpackDialogValue']);
		createDialogs();

		$("#show").on('click', function(){
			$("#detail").show();
		});

		// App Rename Event
		$("#reNameAppBtn").on('click', function(){
			openConfirmPopup("App Rename", "Are you sure modify app name?", "renameApp");
		});

		$("#deleteAppBtn").on('click', function(){
			if(_global.hash.apps){
				openConfirmPopup("App Delete", "This will delete this app.", "deleteApp");
			}
			else{
				openErrorPopup("Not Selected App!");
			}
		});

		$("#instanceStatusRefresh").on('click', function(){
			_ee.emit('setAppInstanceStatus', _global.hash.apps);
		});

		$("#instanceStatusDialogRefresh").on('click', function(){
			_ee.emit('setAppInstanceStatusDialog', _global.hash.apps);
		});

		$("#logRefresh").on('click', function(){
			_ee.emit('app_detail_logs', _global.hash.apps);
		});

		$("#logDialogRefresh").on('click', function(){
			_ee.emit('app_detail_logs_dialog', _global.hash.apps);
		});

		$("#confirmPopupBtn").on('click', function(){
			$("#confirmPopup").close();
			var param = $("#confirmPopup").get(0).item;

			if(param){
				var confirmType = param.confirmType;
				var data = param.data;

				if(confirmType == "renameApp"){
					renameApp();
				}
				else if(confirmType == "deleteApp"){
					deleteApp()
				}
				else if(confirmType == "updateScale"){
					updateScale();
				}
				else if(confirmType == "envVariablesDialogSave"){
					$(".env-form").submit();
				}
			}
		});
		if (loggingDashboard == "disabled") {
			$("#linkALD").remove();
		}
	});
})();
