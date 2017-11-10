/**
 * Service Detail & Global Function
 * 2017-06-01
 */

(function(){
	var pumpkin = new Pumpkin();

	_ee.on("setServiceBaseInfo", function(serviceInfo){
		$("#serviceName").text(serviceInfo.instances.entity.name);
		if(serviceInfo.service){
			$("#serviceLabel").text(serviceInfo.service.entity.label);
			if(serviceInfo.service.entity.label.toLowerCase().indexOf('redis') != -1 || serviceInfo.service.entity.label.toLowerCase().indexOf('Redis') != -1){
				$("#apps-pop").find(">img").attr("src", "/modules/main/views/images/redis_service.png");
			}
			else if(serviceInfo.service.entity.label.toLowerCase().indexOf('object') != -1 || serviceInfo.service.entity.label.toLowerCase().indexOf('Object') != -1){
				$("#apps-pop").find(">img").attr("src", "/modules/main/views/images/object-storage.png");
			}
			else if(serviceInfo.service.entity.label.toLowerCase().indexOf('autoscaler') != -1 || serviceInfo.service.entity.label.toLowerCase().indexOf('Autoscaler') != -1 || serviceInfo.service.entity.label.toLowerCase().indexOf('AutoScaler') != -1){
				$("#apps-pop").find(">img").attr("src", "/modules/main/views/images/autoscale_service.png");
			}
			else{
				$("#apps-pop").find(">img").attr("src", "/modules/main/views/images/sample-img.png");
			}
		}
		else{
			$("#serviceLabel").text("user-provided-service");
			$("#apps-pop").find(">img").attr("src", "/modules/main/views/images/userprovided_service.png");
		}

	});

	_ee.on("createBindAppList", function(bindingList){

		$(".bs-number").text("(" + bindingList.length + ")");

		var forEach = new ForEach();
		forEach.async(bindingList, function(bindInfo, index){
			var done = this.done;
			var url = bindInfo.entity.app_url;

			CF.async({url : url, method : 'get'}, function(result){
				if(result){
					if(result.entity){
						var template = $("#bindAppListTemplate").html();
						var buildPackImg = result.entity.buildpack;
						template = template.replace("{BindAppName}", result.entity.name);

						if(buildPackImg != "java_buildpack" && buildPackImg != "nodejs_buildpack" && buildPackImg != "php_buildpack" && buildPackImg != "python_buildpack" && buildPackImg != "ruby_buildpack"){
							buildPackImg = "sample-img";
						}

						template = template.replace("{imgName}",buildPackImg);

						template = $(template);
						template.get(0).item = bindInfo;
						$("#bindAppListUl").append(template);

						$(template).find(".move-appDetail").on('click', function(){
							var thisItem = $(this).parent().get(0).item;
							location.href = "/app_main#space=" + _global.hash.space + "&apps=" + thisItem.entity.app_guid;
						});

						$(template).find(".more-detail").on('click', function(){
							var data = {};
							var thisItem = $(this).parent().get(0).item;
							data.thisItem = thisItem;
							data.target = $(template);
							openConfirmPopup("Binding Delete", "Are you sure you want to delete the binding?", "deleteBinding", data);
						});
						done();
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
	});

	_ee.on("createPlan", function(service){
		$("#rightTitle").text("Plan");
		if(!service.service){
			return;
		}

		CF.async({url : service.service.entity.service_plans_url}, function(result){
			if(result){
				if(result.resources){
					var planList = result.resources;

					for(var i=0; i<planList.length; i++){
						var plansHtml = $("#plansInfoTemplate").html();

						plansHtml = plansHtml.replace(/{planName}/gi, planList[i].entity.name);

						if(planList[i].entity.extra){
							planList[i].entity.extra = JSON.parse(planList[i].entity.extra);
							if(planList[i].entity.extra.costs){
								plansHtml = plansHtml.replace("{costs}", planList[i].entity.extra.costs[0].amount.usd).replace("{costs}", planList[i].entity.extra.costs[0].unit);
							}

							var bullets = planList[i].entity.extra.bullets;
							if(bullets){
								var html = '<ul>';
								for(var j=0; j<bullets.length; j++){
									html += '<li>- ' + bullets[j] + '</li>';
								}

								html += '</ul>';

								plansHtml = plansHtml.replace("{bullets}", html);
							}
						}

						plansHtml = $(plansHtml);
						plansHtml.get(0).item = planList[i];

						$(plansHtml).find('input[name="plansRadioBtn"]').on('click', function(){
							var data = {};
							var selectedBtn = $(this);
							data.selectedBtn = selectedBtn;
							data.serviceGuid = _global.hash.service;
							data.planItem = $(selectedBtn).parent().parent().parent().get(0).item;

							if(!$(selectedBtn).parent().hasClass("Checked")){
								openConfirmPopup("Plan Change", "Do you change the plan?", "changePlan", data);
							}
						});

						$("#planTable tbody").append(plansHtml);
					}
				}
			}

			CF.async({url : service.instances.entity.service_plan_url}, function(result){
				if(result){
					var radioList = $("#planTable tbody").find('input[name="plansRadioBtn"]');
					for(var i=0; i<radioList.length; i++){
						var item = $(radioList[i]).parent().parent().parent().get(0).item;
						if(item && item.metadata.guid == result.metadata.guid){
							$(radioList[i]).parent().addClass("Checked");
						}
					}
				}
			});
		});
	});

	_ee.on("createCredentials", function(service){
//		$("#rightTitle").text("Credentials");
//		$("#sysLogTitle").show();
		$("#sysLogContent").show();
		$("#rightTitle").text("Environment Variables");
		$("#modifyUserProvidedBtn").show();
		$("#credentialsTitle").show();
		$("#planTable").css("border-collapse", "initial");

		var template = $("#credentialsTemplate").html();
		var credentials = service.instances.entity.credentials;
		var syslogDrainUrl = service.instances.entity.syslog_drain_url;

		if(syslogDrainUrl){
			$("#sysLogUseYn").setChecked(true);
			$("#syslogUrl").val(syslogDrainUrl);
		}

		template = $(template);

		if(typeof credentials == 'object'){
			var idx = 0;
			for(var key in credentials){
				var html = '<div>';
				html += '<input class="Textinput credential-input" placeholder="key" id="serviceInstanceNameKey" name="key" value="' + key + '">';
				html += '<input class="Textinput credential-input" placeholder="value" id="serviceInstanceNameValue" name="value" value="' + credentials[key] + '">';
				html += '<button class="paas-btn__minus">삭제</button>';
				html += '</dev>';
				$(template).find('td').append(html);
			}
			var html = '<div>';
			html += '<input class="Textinput credential-input" placeholder="key" id="serviceInstanceNameKey" name="key" value="">';
			html += '<input class="Textinput credential-input" placeholder="value" id="serviceInstanceNameValue" name="value" value="">';
			html += '<button class="paas-btn__plus">생성하기</button>';
			html += '</dev>';
			$(template).find('td').append(html);
		}

		$("#planTable").find('tbody').html(template);

		$("#planTable").find(".paas-btn__plus").on('click', function(e){
			var clone = $(this).parent().clone();
			$(clone).insertBefore($(this).parent());

			$(clone).find('button').attr('class', 'paas-btn__minus').off('click').on('click', function(){
				$(this).parent().remove();
			});

			$(this).parent().find('input').val('');
			return false;
		});

		$("#planTable").find(".paas-btn__minus").on('click', function(e){
			$(this).parent().remove();
			return false;
		});
	});

	_ee.on("createAppSelectedOption", function(spaceGuid){
		var next = this.next;
		CF.async({url : '/v2/spaces/' + spaceGuid + '/apps'}, function(result){
			if(result){
				if(result.resources){
					$('#bindAppSelected').html('<option value="">Select an App</option>');
					$("#bindAppSelected").parent().find("span").text("Select an App");

					var appList = result.resources;
					for(var i=0; i<appList.length; i++){
						$('#bindAppSelected').append('<option value="' + appList[i].metadata.guid + '">' + appList[i].entity.name + '</option>');
					}
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}

				$("#bindAppSelected").on('change', function(){
					if($("#bindAppSelected").val()){
						$("#bindAppBtn").setEnabled(true);
					}
					else{
						$("#bindAppBtn").setEnabled(false);
					}
				});
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

	var bindingService = function(bindInfo, callback){
		var bindAppName = $("#bindAppSelected option:selected").text();
		var imageName = bindInfo.entity.buildpack;
		var template = $("#bindAppListTemplate").html();

		if(imageName != "java_buildpack" && imageName != "nodejs_buildpack" && imageName != "php_buildpack" && imageName != "python_buildpack" && imageName != "ruby_buildpack"){
			imageName = "sample-img";
		}

		template = template.replace("{BindAppName}", bindAppName);
		template = template.replace("{imgName}", imageName);

		template = $(template);
		template.get(0).item = bindInfo;
		$("#bindAppListUl").append(template);

		$(template).find(".more-detail").on('click', function(){
			var data = {};
			data.thisItem = $(this).parent().get(0).item;
			data.target = $(template);

			openConfirmPopup("Binding Delete", "Are you sure you want to delete the binding?", "deleteBinding", data);

		});
		callback();
	};

	var changePlan = function(serviceGuid, plan, selectedBtn){

		CF.async({url : '/v2/service_instances/' + serviceGuid, method : 'PUT', headers : {'Content-Type' : 'application/x-www-form-urlencoded'}, form : {service_plan_guid : plan.metadata.guid}}, function(result){
			if(result){
				if(result.entity){
					if(!$(selectedBtn).parent().hasClass("Checked")){
						$(selectedBtn).parent().addClass("Checked");
					}

					var radioLabels = $(selectedBtn).parent().parent().parent().parent().find('.ImageRadio');
					for(var i=0; i<radioLabels.length; i++){
						var label = radioLabels[i];

						if($(label).find('input[name="plansRadioBtn"]').val() != $(selectedBtn).val() && $(label).hasClass("Checked")){
							$(label).removeClass("Checked");
						}
					}
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
	};

	var deleteBinding = function(data){
		var target = data.target;
		CF.async({url : data.thisItem.metadata.url, method : 'DELETE'}, function(result){

			if(result && result.code){
				openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
			}
			else{
				target.remove();
				var bindCnt = $(".bs-number").text().replace("(", "").replace(")", "");
				bindCnt = Number(bindCnt);
				bindCnt--;
				$(".bs-number").text("(" + bindCnt + ")");
			}
		});
	}

	var renameService = function(data){
		$("#rename-pop-service").close();
		$("#confirmPopup").close();
		var url = data.url;
		var newServiceName = data.newServiceName;

		CF.async({url : url, method : 'PUT', form : {name : newServiceName}}, function(result){
			if(result){
				if(result.entity){
					$("#serviceName").text(newServiceName);
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

	var deleteService = function(data){
		$("#rename-pop-service").close();

		var url = data.url;
		CF.async({url : url, method : 'DELETE'}, function(result){
			if(result && result.code){
				openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
			}
			else{
				// 성공
				location.href = "/space_main#space=" + _global.hash.space + "&tab=2";
			}
		});
	}

	$(document).ready(function(){
		$(".container-wrap").hide();
		$('#backgroundProgress').show();

		var serviceInstanceInfo = {};
		commonPumpkin.execute([{name : 'getServiceInstancesInfo', params : {spaceGuid: _global.hash.space, serviceGuid : _global.hash.service}}, {name : 'getBindingService'}], function(serviceInfo){
			_ee.emit("setServiceBaseInfo", serviceInfo);
			_ee.emit("createBindAppList", serviceInfo.bindings);

			if(serviceInfo.instances.entity.type == "user_provided_service_instance"){
				_ee.emit("createCredentials", serviceInfo);
			}
			else{
				_ee.emit("createPlan", serviceInfo);
			}
			serviceInstanceInfo = serviceInfo;
			_ee.emit("createAppSelectedOption", _global.hash.space);
		});

		// Service Rename Event
		$("#renameServiceBtn").on('click', function(){
			if(serviceInstanceInfo.instances){

				var data = {};
				data.url = serviceInstanceInfo.instances.metadata.url;
				data.newServiceName = $("#newServiceNameTxt").val();
				openConfirmPopup("Service Rename", "Are you sure modify?", "renameService", data);
			}
			else{
				openErrorPopup('Lost service info. agin please');
			}
		});

		// Space Delete Event
		$("#deleteServiceBtn").on('click', function(){
			if(serviceInstanceInfo.instances){

				var data = {};
				data.url = serviceInstanceInfo.instances.metadata.url;
				openConfirmPopup("Service Delete", "This will permanently delete this service.", "deleteService", data);

			}
			else{
				openErrorPopup("Lost service info. agin please");
			}
		});

		$("#bindAppBtn").on('click', function(){
			var data = {};
			var selectedAppGuid = $("#bindAppSelected").val();

			if(!selectedAppGuid){
				openWarringPopup("Selected App");
				return false;
			}

			data.service_instance_guid = _global.hash.service;
			data.app_guid = selectedAppGuid;
			CF.async({url : '/v2/service_bindings', method : 'POST', headers : {'Content-Type' : 'application/x-www-form-urlencoded'}, form : data}, function(result){
				if(result){
					if(result.entity){
						bindingService(result, function(){
							var bindCnt = $(".bs-number").text().replace("(", "").replace(")", "");
							bindCnt = Number(bindCnt);
							bindCnt++;
							$(".bs-number").text("(" + bindCnt + ")");
						});
					}
					else{
						openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
					}
				}
				else{
					openErrorPopup("Unknown Error");
				}
			},
			function(error){
				var errorObj = JSON.parse(error);
				var errorInfo = JSON.parse(errorObj.error);
				openErrorPopup(errorInfo.description);
			});
		});

		$("#modifyUserProvidedBtn").on('click', function(){
			openConfirmPopup("Credentials Update", "Are you modify user-provided-service?", "modifyCredentials");
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

		formSubmit('#serviceDetailCredentialsForm', function(data){
			var credentials = {};
			if(typeof data.key != 'string'){
				for(var i=0; i<data.key.length; i++){
					if(data.key[i])
						credentials[data.key[i]] = data.value[i];
				}
			}
			else{
				if(data.key){
					credentials[data.key] = data.value;
				}
			}

			var form = {};
			form.name = $("#serviceName").text();
			form.credentials = credentials;
			form.space_guid = _global.hash.space;

			if(data.sysLogUseYn && data.sysLogUseYn == "on"){
				var sysLogUrl = data.syslogUrl;

				if(sysLogUrl.startsWith("syslog://")){
					form.syslog_drain_url = sysLogUrl;
				}
				else{
					form.syslog_drain_url = "syslog://" + sysLogUrl;
				}
			}
			else{
				form.syslog_drain_url = '';
			}

			var url = '/v2/user_provided_service_instances/' + _global.hash.service;
			CF.async({url : url, method : 'PUT', form : form}, function(result){
				if(result){
					if(result.entity){
						var service = {};
						service.instances = result
						_ee.emit("createCredentials", service);
						openInfoPopup("Complete modify user provided service");
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

		$("#confirmPopupBtn").on('click', function(){
			$("#confirmPopup").close();
			var param = $("#confirmPopup").get(0).item;
			var confirmType = param.confirmType;
			var data = param.data;

			if(confirmType == "renameService"){
				renameService(data);
			}
			else if(confirmType == "deleteService"){
				deleteService(data);
			}
			else if(confirmType == "deleteBinding"){
				deleteBinding(data);
			}
			else if(confirmType == "changePlan"){
				changePlan(data.serviceGuid, data.planItem, data.selectedBtn);
			}
			else if(confirmType == "deleteService"){
				deleteService(data.serviceGuid, data.planItem, data.selectedBtn);
			}
			else if(confirmType == "modifyCredentials"){
				$("#serviceDetailCredentialsForm").submit();
			}
			else{
				return false;
			}
		});
		$(".container-wrap").show();
		$('#backgroundProgress').hide();
	});
})();
