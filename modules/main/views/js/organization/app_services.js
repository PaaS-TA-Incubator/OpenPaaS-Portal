/**
 * Service Main & Global Function
 * 2017-05-20
 */
(function(){
	var pumpkin = new Pumpkin();

	// Get Service List
	pumpkin.addWork('getServicesInstanceList', function(param){
		var that = this;
		var url = '/v2/spaces/' + param.space + '/service_instances';

		CF.async({url : url, method : 'get'}, function(result){
			if(result.resources){
				that.next(result);
				that.data.services = result;
			}
			else{
				that.next();
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});

	pumpkin.addWork('getUserProvidedServiceInstances', function(){
		var that = this;
		var next = this.next;
		CF.async({url : '/v2/user_provided_service_instances'}, function(result){
			if(result){
				that.data.userProvidedServices = result;
				next(that.data);
			}
			else{
				next();
			}
		},
		function(error){
			next();
		});
	});

	// CreateServiceList
	pumpkin.addWork('createServiceList', function(serviceList){

		var that = this;
		$("#appListTbody").empty();
			var forEach = new ForEach();

			forEach.async(serviceList.resources, function(service, index){
				var done = this.done;

				var worker = new Pumpkin();
				worker.state = 0;
				worker.data = getServiceInstanceDetail.data;
				worker.works = getServiceInstanceDetail.works;

				var workList = [];
				workList.push({name : 'getServicePlan', params : service});
				workList.push({name : 'getBindingService', params : service});
				worker.executeAsync(workList, function(serviceInstance){

					var workThat = this;
					var serviceName = serviceInstance.service.entity.label;
					var instanceName = serviceInstance.entity.name;
					var boundApps = serviceInstance.bindings.length;

					var serviceListItemTemplate = '<tr id="' + serviceInstance.metadata.guid + '">';
					serviceListItemTemplate += "<td class='text-left-align'>" + serviceName +"</td>";
					serviceListItemTemplate += "<td class='text-left-align'>" + instanceName +"</td>";
					serviceListItemTemplate += "<td>" + boundApps +"</td>";

					if(serviceInstance.plan.entity.extra){
						var extra = JSON.parse(serviceInstance.plan.entity.extra);
						serviceInstance.plan.entity.extra = extra;

						if(extra.costs){
							var costs = extra.costs[0];
							serviceListItemTemplate += '<td class="text-left-align">' + '$' + costs.amount.usd + '/ ' + costs.unit + ' <br> (' + serviceInstance.plan.entity.name + ')</td>';
						}
						else if(extra.displayName){
							serviceListItemTemplate += '<td class="text-left-align">' + extra.displayName + ' <br> (' + serviceInstance.plan.entity.name + ')</td>';
						}
					}
					else{
						serviceListItemTemplate += '<td class="text-left-align">User Provided <br> (' + serviceInstance.plan.entity.name + ')</td>';
					}

					if(serviceInstance.plan.entity.extra){
						var extra = JSON.parse(serviceInstance.service.entity.extra);
						serviceInstance.plan.entity.extra = extra;
						serviceListItemTemplate += '<td class="text-left-align">' + extra.supportUrl + '</td>';
					}
					else{
						serviceListItemTemplate += '<td>-</td>';
					}

					serviceListItemTemplate += '<td class="serviceDelete"><button class="Button Default paas-btn__typea">Delete</button></td>';
					serviceListItemTemplate += "</tr>";

					serviceListItemTemplate = $(serviceListItemTemplate);
					serviceListItemTemplate.get(0).item = serviceInstance;

					serviceInstance.element = serviceListItemTemplate;

					$("#appListTbody").append(serviceListItemTemplate);

					$(serviceListItemTemplate).find('td').on('click', function(e){
						if(!$(this).hasClass("serviceDelete"))
							location.href="/service_detail#space=" + _global.hash.space + "&service=" + $(this).parent().get(0).id;
					});

					$(serviceListItemTemplate).find(".serviceDelete").on('click', function(e){
						var param = {};
						param.url = $(serviceListItemTemplate).get(0).item.metadata.url;
						param.target = $(serviceListItemTemplate);
						openConfirmPopup("Service Delete", "Are you sure you want to delete the Service?", "userProviderServiceDelete", param);
					});

					done();
				},
				function(workName, error){
					openErrorPopup(error.message);
				});
			},
			function(){
				getUserProvidedService(function(list){
					var listCnt = serviceList.total_results + list.length;
					if(listCnt < 1){
//						$("#tableTitle").text("(0) Service");
						$("#listCount").text("(0)");
						$("#listName").text(" Service");
						$("#appListTbody").append('<tr><td colspan="5" style="text-align:center;">no services</td></tr>');
					}
					else{
//						$("#tableTitle").text("(" + listCnt +") Service");
						$("#listCount").text("(" + listCnt +")");
						$("#listName").text(" Service");
					}
					that.next(serviceList);
				});
			});
//		}
	});

	var getUserProvidedService = function(callback){
		var guid = _global.hash.space;
		CF.async({url : '/v2/user_provided_service_instances'}, function(result){
			if(result){
				var list = result.resources;
				var resultList = [];
				var idx = 0;
				if(list){
					for(var i=0; i<list.length; i++){
						if(list[i].entity.space_guid != guid)
							continue;
						else{
							resultList[idx++] = list[i];
						}

						(function(instance){
							var template = '<tr id="' + instance.metadata.guid + '">';
							template += "<td class='text-left-align'>user-provided-service</td>";
							template += "<td class='text-left-align'>" + instance.entity.name +"</td>";

							instance.element = template;
							template = $(template);

							CF.async({url : instance.entity.service_bindings_url}, function(result){
								if(result){
									var bindings = result.resources;
									if(bindings){
										instance.bindings = bindings;
										template.append("<td>" + bindings.length +"</td>");
									}
									else{
										openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
									}

									template.append("<td class='text-left-align'></td>");
									template.append("<td class='text-left-align'></td>");
									template.append('<td class="serviceDelete"><button class="Button Default paas-btn__typea">Delete</button></td>');
								}
								else{
									openErrorPopup('Unknown Error');
								}

								$(template).find('td').on('click', function(e){
									if(!$(this).hasClass("serviceDelete"))
										location.href="/service_detail#space=" + _global.hash.space + "&service=" + $(this).parent().get(0).id;
								});

								$(template).find(".serviceDelete").on('click', function(e){
									var url = $(template).get(0).item.metadata.url;

									openConfirmPopup("Service Delete", "Are you sure you want to delete the Service?");

									$("#confirmPopupBtn").on('click', function(){
										$("#confirmPopup").close();
										CF.async({url : url, method : 'DELETE'}, function(result){
											if(result){
												if(result.code){
													openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
												}
												else{
													$(template).remove();
												}
											}
											else{
												$(template).remove();
											}
										});

										return false;
									});
								});
							});
							template.get(0).item = instance;

							$("#appListTbody").append(template);
						})(list[i]);
					}

					callback(resultList);
				}
				else
				{
					clone.find('.progress-row').hide();
					clone.find('tbody').append('<tr><td colspan="5" style="text-align: center; color: red;">' + (result.description ? result.description : JSON.stringify(result.error)) + '</td></tr>');
				}
			}
			else
			{
				clone.find('.progress-row').hide();
				clone.find('tbody').html('<tr><td colspan="5" style="text-align: center; color: red;">Unknown Error</td></tr>');
			}
		});
	};

	var getServiceInstanceDetail = new Pumpkin();
	getServiceInstanceDetail.addWork('getServicePlan', function(service){
		var next = this.next;
		var error = this.error;

		CF.async({url : service.entity.service_plan_url}, function(result){
			if(result){
				if(result.entity){
					service.plan = result;
					CF.async({url : result.entity.service_url}, function(result){
						if(result){
							if(result.entity){
								service.service = result;
								next();
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

	var deleteService = function(data){
		$("#confirmDelPopup").close();
		var url = data.url;
		var target = data.target;

		CF.async({url : url, method : 'DELETE'}, function(result){
			if(result){
				if(result.code){
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
				else{
					target.remove();
					minusCount("listCount", true);
					minusCount("serviceTotNum", false);
				}
			}
			else{
				target.remove();
				minusCount("listCount", true);
				minusCount("serviceTotNum", false);
			}
		});
	}

	getServiceInstanceDetail.addWork('getBindingService', function(service){
		var next = this.next;
		var error = this.error;

		CF.async({url : service.entity.service_bindings_url}, function(result){
			if(result){
				if(result.resources){
					service.bindings = result.resources;
					next(service);
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

	/* Service Binding Start */
	var serviceBindingPumpkin = new Pumpkin();

	// Binding Service List
	serviceBindingPumpkin.addWork('getBindingServiceByApp', function(param){
		var that = this;
		var next = this.next;

		CF.async({url : '/v2/apps/' + param.apps + '/service_bindings'}, function(result){
			if(result){
				if(result.resources){
					var serviceList = result.resources;
					next(serviceList);
				}
				else{
				}
			}
			else{
			}
		});
	});

	serviceBindingPumpkin.addWork('getServiceInstanceForServiceBinding', function(){
		var next = this.next;
		var error = this.error;

		CF.async({url : this.data.serviceBinding.entity.service_instance_url}, function(result){
			if(result){
				if(result.entity){
					next(result);
				}
				else{
					error(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				error('Service instance is not found.');
			}

		}, function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);;
		});
	});

	serviceBindingPumpkin.addWork('getServicePlan', function(serviceInstance){
		var next = this.next;
		var error = this.error;

		CF.async({url : '/v2/service_plans/' + serviceInstance.entity.service_plan_guid}, function(result){
			if(result){
				var servicePlan = result;
				if(servicePlan.entity){
					CF.async({url : servicePlan.entity.service_url}, function(result){
						if(result){
							next({serviceInstance : serviceInstance, servicePlan : servicePlan, service : result});
						}
						else{
							next({serviceInstance : serviceInstance, servicePlan : servicePlan});
						}
					},
					function(error){
						next({serviceInstance : serviceInstance, servicePlan : servicePlan, service : error});
					});
				}
				else{
					next({serviceInstance : serviceInstance, servicePlan : servicePlan});
				}
			}
			else{
				next({serviceInstance : serviceInstance});
			}
		},
		function(error){
			next({serviceInstance : serviceInstance, servicePlan : error});
		});
	});
	/* Service Binding End */

	_ee.on('changeServicePage', function(service){

		$("#appListTbody").empty();
		$("#appListTbody").hide();

		$(".lay-item__center").removeClass("selected");
		$(".lay-item__securityGroup").removeClass("selected");
		$(".lay-item__right").addClass("selected");
		$("#createServiceBtn").show();

		$("#colgroupArea #col1_size").css("width", "150px");
		$("#colgroupArea #col2_size").css("width", "150px");
		$("#colgroupArea #col3_size").css("width", "150px");
		$("#colgroupArea #col4_size").css("width", "");
		$("#colgroupArea #col5_size").css("width", "");
		$("#colgroupArea #col6_size").css("width", "");

		$("#theadArea #th1_id").html("Service<span class='af-icon Icon'></span>");
		$("#theadArea #th2_id").html("Instance Name<span class='af-icon Icon'></span>");
		$("#theadArea #th3_id").attr("data-sortable", "number");
		$("#theadArea #th3_id").html("Bound Apps<span class='af-icon Icon'></span>");
		$("#theadArea #th4_id").attr("data-sortable", "string");
		$("#theadArea #th4_id").html("Plan<span class='af-icon Icon'></span>");
		$("#theadArea #th5_id").attr("data-sortable", "string").attr("colspan", "2");
		$("#theadArea #th5_id").html("Link<span class='af-icon Icon'></span>");
		$("#theadArea #th6_id").hide();

		_ee.emit('setServicesListPage');
	});

	_ee.on('setServicesListPage', function(){
		$(".container-wrap").show();
		$('#backgroundProgress').hide();

		var loadingBarHtml = $("#listLoadingBarTemplate").html().replace("{colspan}", "7");
		$("#tableBody").append(loadingBarHtml);

		pumpkin.execute([{name : 'getServicesInstanceList', params : {space : _global.hash.space}}, {name : 'createServiceList'}], function(serviceInstanceList){
			if(serviceInstanceList){
				$("#searchBtn").show();
			}

			$("#listLoadingBar").remove();
			$("#appListTbody").show();
		});
	});

	_ee.on('setBindingService', function(){
		serviceBindingPumpkin.execute([{name : 'getBindingServiceByApp', params : {apps : _global.hash.apps}}], function(bindingServiceList){
			$('#bindingService').empty();
			$("#bsNumber").text("(" + bindingServiceList.length + ")");
			var forEach = new ForEach();
			forEach.async(bindingServiceList, function(service, index){
				var done = this.done;
				serviceBindingPumpkin.setData({serviceBinding : service});
				serviceBindingPumpkin.execute(['getServiceInstanceForServiceBinding', 'getServicePlan'], function(params){
					serviceName = params.service.entity.label;
					if (dashboards.indexOf(serviceName) != -1) {
						bindingService(service, done, "bindingService", "bindingServiceTemplate");
					} else {
						bindingService(service, done, "bindingService", "bindingServiceTemplateNoDashboard");
					}
				});
			},
			function(){
				if(bindingServiceList.length == 0){
//					$('#bindingService').append('<tr><td colspan="6" style="text-align: center;">no service bindings</td></tr>');
				}
			});
		});
	});

	/* Create Service Binding */
	var bindingService = function(serviceBinding, callback, targetName, templateName){
		var credentials = serviceBinding.entity.credentials;
		serviceBindingPumpkin.setData({serviceBinding : serviceBinding});
		serviceBindingPumpkin.execute(['getServiceInstanceForServiceBinding', 'getServicePlan'], function(params){
			var serviceInstance = params.serviceInstance;
			var servicePlan = params.servicePlan;
			var service = params.service;

			var template = $('#' + templateName).html();

			template = template.replace('{serviceName}', serviceInstance.entity.name);

			if(service){
				try{

					if(service.entity.label.toLowerCase().indexOf('autoscaler') != -1 || service.entity.label.toLowerCase().indexOf('Autoscaler') != -1 || service.entity.label.toLowerCase().indexOf('AutoScaler') != -1){
						if(credentials.app_id){
							credentials.appId = credentials.app_id;
						}
						else{
							credentials.appId = serviceBinding.entity.app_guid;
						}
						credentials.appName = $("#appName").text();
					}

					var imageName = setServiceImageName(service.entity.label);
					var dashboardUrl = setServiceDashboardUrl(service.entity.label);
					template = template.replace('{serviceImgName}', imageName);
					template = template.replace('{dashboard}', dashboardUrl);
				}
				catch(err){
					console.error(err.stack);
				}
			}
			else if(serviceInstance){
				var imageName = setServiceImageName(serviceInstance.entity.type);
				var dashboardUrl = setServiceDashboardUrl(serviceInstance.entity.type);
				template = template.replace('{serviceImgName}', imageName);
				template = template.replace('{dashboard}', dashboardUrl);
			}
			else{
				template = template.replace('{serviceImgName}', "sample-img");
				template = template.replace('{dashboard}', '');
			}

			var imageUrl = '';
			var supportUrl = '';
			var docsUrl = '';
			var description = '';

			if(service){
				if(service.entity){
					var extra = service.entity.extra;
					description = service.entity.label;

					if(extra){
						extra = JSON.parse(extra);

						if(extra.imageUrl)
							imageUrl = extra.imageUrl;

						supportUrl = extra.supportUrl;
						docsUrl = extra.documentationUrl;
					}
				}
			}

			if(typeof credentials == 'object'){
				var html = "";
				for(var key in credentials){
					html += '<pre>' + key + ' = ' + credentials[key] + '</pre>';
				}

				template = template.replace('{credentialsItems}', html);
				template = template.replace('{credentialsJson}', '<pre>' + JSON.stringify(credentials, null, 4) + '</pre>');
			}

			template = $(template.replace('{imgUrl}', imageUrl).replace('{description}', description).replace('{supportUrl}', supportUrl).replace('{docsUrl}', docsUrl));

			// Dash Board Open Event
			$(template).find('a[data-dashboard]').on('click', function(e){

				try{
					var that = this;
					if(!$(this).attr('data-dashboard')){
						// openWarringPopup("The dashboard does not exist.");
						return ;
					}
					else{
						var result = $.ajax({url : '/create_dashboard_link', type : 'post', data : {type : $(this).attr('data-dashboard'), credentials : credentials}});
						result.done(function(data){
							window.open(data);
						});
						result.fail(function(error){
							openErrorPopup(error.responseText);
						});
					}
				}
				catch(err){
					console.error(err);
				}

				e.preventDefault();
			});

			template.get(0).item = {serviceInstance : serviceInstance, servicePlan : servicePlan, service : service};

			// Credentials Event
			$(template).find('.view-detaile').on('click', function(){
				if(!this.isShown){
					$(this).parent().parent().next().show()
					this.isShown = true;
				}
				else{
					$(this).parent().parent().next().hide();
					this.isShown = false;
				}
			});

			// Unbind Event
//			var unbindButton = template.find('.unbind');
			$(template).find('a[act-type="unbind"]').on('click', function(e){
				var data = {};

				data.serviceBindingGuid = serviceBinding.metadata.guid;
				data.unbindTarget = $(this);

				openConfirmPopup("Service Unbind", "Are you sure you want to delete the binding?", "serviceUnbind", data);
			});

			$('#' + targetName).append(template);
			callback();
		},
		function(workName, error){
			openErrorPopup(error.message);
		});
	};

	_ee.on("setServiceBindingDialog", function(spaceGuid, appGuid){
		$("#bindServiceDialogTbody").empty();
		serviceBindingPumpkin.execute([{name : 'getBindingServiceByApp', params : {space : spaceGuid, apps : appGuid}}], function(bindingServiceList){
			pumpkin.data.serviceList = bindingServiceList;
			pumpkin.execute([{name : 'getServicesInstanceList', params : {space : _global.hash.space}}, {name : 'getUserProvidedServiceInstances'}], function(result){
				$("#bindServiceDialog").empty();
				$("#bindServiceDialog").append("<option value=''>Selected A New Bind Service</option>");
				$("#bindServiceDialog").parent().find('span').text("Selected A New Bind Service");
				var that = this;
				try{
					var alreadyBindings = {};
					if(that.data.serviceList){
						var list = that.data.serviceList;
						if(list){
							for(var i=0; i<list.length; i++){
								alreadyBindings[list[i].entity.service_instance_guid] = true;
							}
						}
					}

					if(this.data.services){
						var list = this.data.services.resources;
						if(list){
							for(var i=0; i<list.length; i++){
								if(alreadyBindings[list[i].metadata.guid])
									continue;

								var option = $('<option value="' + list[i].metadata.guid + '">' + list[i].entity.name + '</option>');
								option.get(0).item = list[i];

								$("#bindServiceDialog").append(option);
							}
						}
					}

					if(this.data.userProvidedServices){
						var list = this.data.userProvidedServices.resources;
						if(list){
							var space = $('#' + _global.hash.space).get(0);
							for(var i=0; i<list.length; i++){
								if(alreadyBindings[list[i].metadata.guid] || list[i].entity.space_guid != space.id)
									continue;

								var option = $('<option value="' + list[i].metadata.guid + '">' + list[i].entity.name + '</option>');
								option.get(0).item = list[i];

								$("#bindServiceDialog").append(option);
							}
						}
					}
				}
				catch(err){
					openErrorPopup(err.message);
				}
			},
			function(workName, error){
				openErrorPopup(error.message);
			});

			var forEach = new ForEach();
			forEach.async(bindingServiceList, function(service, index){
				var done = this.done;
				bindingService(service, done, "bindServiceDialogTbody", "serviceBindDialogTemplate");
			},
			function(){
				if(bindingServiceList.length == 0){
//					$(context).find('#services .service-table tbody').append('<tr><td colspan="4" style="text-align: center;">no service bindings</td></tr>');
				}
			});
		});
	});

	_ee.on("setServiceEventListener", function(){
		$(".paas-btn__plus").on('click', function(e){
			var clone = $(this).parent().clone();
			$(clone).insertBefore($(this).parent());

			$(clone).find('button').attr('class', 'paas-btn__minus').off('click').on('click', function()
			{
				$(this).parent().remove();
				var height = $("#createUserProviderDialog").css("height").replace("px", "");
				height = Number(height) - 31;
				$("#createUserProviderDialog").css("height", height + "px");
			});

			$(this).parent().find('input').val('');
			var height = $("#createUserProviderDialog").css("height").replace("px", "");
			height = Number(height) + 31;
			$("#createUserProviderDialog").css("height", height + "px");
		});
	});

	var serviceUnbindAct = function(data){
		var serviceBindingGuid = data.serviceBindingGuid;
		var unbindTarget = data.unbindTarget;

		CF.async({url : '/v2/service_bindings/' + serviceBindingGuid, method : 'DELETE'}, function(result){
			if(unbindTarget.hasClass("unbind")){
				unbindTarget.parent().remove();
				minusCount("bsNumber", true);
			}
			else if(unbindTarget.hasClass("unbind-sel")){
				var targetGuid;
				var isUserProviedService = false;
				if(unbindTarget.parent().parent().get(0).item.service){
					targetGuid = unbindTarget.parent().parent().get(0).item.service.metadata.guid;

				}
				else if(unbindTarget.parent().parent().get(0).item.serviceInstance){
					targetGuid = unbindTarget.parent().parent().get(0).item.serviceInstance.metadata.guid;
					isUserProviedService = true;
				}
				else{
					openErrorPopup("No match service item. Refresh Please");
					return ;
				}

				unbindTarget.parent().parent().remove();

				// main page에서도 삭제
				var bindList = $("#bindingService").find('li');
				for(var i=0; i<bindList.length; i++){
					var guid;
					if(isUserProviedService){
						if(bindList.get(i).item.serviceInstance){
							guid = bindList.get(i).item.serviceInstance.metadata.guid;
						}
						else{
							continue;
						}
					}
					else{
						if(bindList.get(i).item.service){
							guid = bindList.get(i).item.service.metadata.guid;
						}
						else{
							continue;
						}
					}

					if(targetGuid == guid){
						bindList.get(i).remove();
						minusCount("bsNumber", false);
					}
				}
			}
			return false;
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
			return false;
		});
	}

	$(document).ready(function(){

		$("#regUserProviderServiceBtn").on('click', function(){
			var userProviderServiceName = $("#serviceInstanceName").val();
			var userProviderServiceKey = $("#serviceInstanceNameKey").val();
			var userProviderServiceVal = $("#serviceInstanceNameValue").val();

			if(!userProviderServiceName){
				openErrorPopup("Input service-instance-name");
				$("#serviceInstanceName").focus();
				return false;
			}
			else if(!userProviderServiceKey){
				openErrorPopup("Input service-instance Key");
				$("#userProviderServiceKey").focus();
				return false;
			}
			else if(!userProviderServiceVal){
				openErrorPopup("Input service-instance Value");
				$("#userProviderServiceVal").focus();
				return false;
			}

			var param = {};
			param.userProviderServiceName = userProviderServiceName;
			param.userProviderServiceKey = userProviderServiceKey;
			param.userProviderServiceVal = userProviderServiceVal;
			openConfirmPopup("User-Provided-Service Create", "Create user-provided-service?", "regUserProviderSubmit", param);
		});

		formSubmit('#createUserProviderDialog', function(data){
			var credentials = {};
			if(typeof data.key != 'string'){
				for(var i=0; i<data.key.length; i++){
					if(data.key[i])
						credentials[data.key[i]] = data.value[i];
				}
			}
			else{
				if(data.key)
					credentials[data.key] = data.value;
			}

			var form = {};
			form.name = data.name;
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

			CF.async({url : '/v2/user_provided_service_instances', method : 'POST', form : form}, function(result){

				if(result){
					if(result.entity){
						result.bindings = [];
						var userProvidedserviceItemTemplate = '<tr id="' + result.metadata.guid + '">';
						userProvidedserviceItemTemplate += '<td class="text-left-align">user-provided-service</td>';
						userProvidedserviceItemTemplate += '<td class="text-left-align">' + result.entity.name + '</td>';
						userProvidedserviceItemTemplate += '<td>' + (result.bindings.length ? result.bindings.length : "0") +'</td>';
						userProvidedserviceItemTemplate += '<td class="text-left-align"></td>';
						userProvidedserviceItemTemplate += '<td class="text-left-align"></td>';
						userProvidedserviceItemTemplate += '<td class="serviceDelete"><button class="Button Default paas-btn__typea">Delete</button></td>';
						userProvidedserviceItemTemplate += "</tr>";

						userProvidedserviceItemTemplate = $(userProvidedserviceItemTemplate);
						userProvidedserviceItemTemplate.get(0).item = result;

						$(userProvidedserviceItemTemplate).find('td').on('click', function(e){
							if(!$(this).hasClass("serviceDelete"))
								location.href="/service_detail#space=" + _global.hash.space + "&service=" + $(this).parent().get(0).id;
						});

						$(userProvidedserviceItemTemplate).find(".serviceDelete").on('click', function(e){
							var url = $(userProvidedserviceItemTemplate).get(0).item.metadata.url;
							var param = {};
							param.url = url
							param.target = $(this).parent();

							openConfirmPopup("Service Delete", "Are you sure you want to delete the Service?", "userProviderServiceDelete", param);
						});

						$("#serviceInstanceName").val("");

						if($("#sysLogUseYn").prop('checked')){
							$("#sysLogUseYn").setChecked(false);
							$("#syslogUrl").val('');
							$("#syslogUrl").attr("disabled", "disabled");
							$("#syslogUrl").css("background", "#d2d2d2");
						}

						$("#appListTbody").append(userProvidedserviceItemTemplate);
						addCount("listCount", true);
						addCount("serviceTotNum", false);
						$("#createUserProviderDialog").close();
					}
					else{
						openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
					}
				}
				else{
					openErrorPopup('Unknown Error');
				}
			});
		});

		var userProvidedDeleteAct = function(url){
			CF.async({url : url, method : 'DELETE'}, function(result){
				if(result){
					if(result.code){
						openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
					}
					else{
						_ee.emit('setServicesListPage');
					}
				}
				else{
					_ee.emit('setServicesListPage');
				}
			},
			function(error){
				var errorObj = JSON.parse(error);
				var errorInfo = JSON.parse(errorObj.error);
				openErrorPopup(errorInfo.description);
			});
		}

		$("#dialogBindBtn").on('click', function(){
			var newBindServiceGuid = $("#bindServiceDialog").val();

			if(!newBindServiceGuid){
				openWarringPopup("Selected Bind Service.");
				return ;
			}

			var data = {};
			data.app_guid = _global.hash.apps;
			data.service_instance_guid = newBindServiceGuid;

			CF.async({url : '/v2/service_bindings', method : 'POST', headers : {'Content-Type' : 'application/x-www-form-urlencoded'}, form : data}, function(result){
				if(result){
					if(result.entity){
						bindingService(result, function(){},"bindServiceDialogTbody", "serviceBindDialogTemplate");
						bindingService(result, function(){}, "bindingService", "bindingServiceTemplate");
						addCount("bsNumber", true);
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

			if(param){
				var confirmType = param.confirmType;
				var data = param.data;

				if(confirmType == "userProviderServiceDelete"){
					deleteService(data);
				}
				else if(confirmType == "regUserProviderSubmit"){
					$('#createUserProviderDialog').submit();
				}
				else if(confirmType == "serviceUnbind"){
					serviceUnbindAct(data);
				}
			}
		});

		$(".Dialog").find("[name='dialogCnclBtn']").on('click', function(){
			$("#sysLogUseYn").setChecked(false);
		});
	});
})();
