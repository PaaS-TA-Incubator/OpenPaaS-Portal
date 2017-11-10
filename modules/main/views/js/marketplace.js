/**
 * Application Main Function
 * 2017-05-31
 */
(function(){
	var pumpkin = new Pumpkin();

	pumpkin.addWork('setServicePlan', function(params){
		var next = this.next;
		var error = this.error;

		var service = params.service;
		$("#plansTable tbody").empty();
		CF.async({url : service.entity.service_plans_url}, function(result){
			if(result){
				if(result.resources){
					var planList = result.resources;

					for(var i=0; i<planList.length; i++){
						var plansHtml = $("#plansInfoTemplate").html();

						plansHtml = plansHtml.replace(/{planName}/gi, planList[i].entity.name);

						if(planList[i].entity.extra){
							planList[i].entity.extra = JSON.parse(planList[i].entity.extra);
							if(planList[i].entity.extra.costs){
								plansHtml = plansHtml.replace("{costs}", "$" + (planList[i].entity.extra.costs[0].amount.usd ? planList[i].entity.extra.costs[0].amount.usd : (planList[i].entity.extra.costs[0].amount.KRW ? planList[i].entity.extra.costs[0].amount.KRW : 0)));
								plansHtml = plansHtml.replace("{unit}", planList[i].entity.extra.costs[0].unit);
							}
							else{
								plansHtml = plansHtml.replace("{costs} / {unit}", "");
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
						else if(!planList[i].entity.extra && planList[i].entity.free){
							plansHtml = plansHtml.replace("{costs} / {unit}", "");
							plansHtml = plansHtml.replace("{bullets}", "-" + planList[i].entity.description);
						}

						plansHtml = $(plansHtml);
						plansHtml.get(0).item = planList[i];

						$(plansHtml).find('input[name="plansRadioBtn"]').on('click', function(){
							if(!$(this).parent().hasClass("Checked")){
								$(this).parent().addClass("Checked");
							}

							var radioLabels = $(this).parent().parent().parent().parent().find('.ImageRadio');
							for(var i=0; i<radioLabels.length; i++){
								var label = radioLabels[i];

								if($(label).find('input[name="plansRadioBtn"]').val() != $(this).val() && $(label).hasClass("Checked")){
									$(label).removeClass("Checked");
								}
							}
							$("#selectedPlan_planName").text($(this).val());
//							$("#selectedPlanDiv").show();
							$("#selectedPlanForm").get(0).item = $(this).parent().parent().parent().get(0).item;
							$("#selectedPlanForm").get(0).item.service = service;
						});

						$("#plansTable tbody").append(plansHtml);
					}
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
		function(err){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});

	var setMarketServiceList = function(){
		CF.async({url : '/v2/services'}, function(result){
			if(result){
				if(result.resources){
					var serviceList = result.resources;
					var forEach = new ForEach();
					forEach.async(serviceList, function(service, index){
						var done = this.done;

						if(service.entity.active){
							var extra = service.entity.extra;
							var img = '';
							var name = service.entity.label;
							var longDescription = '';

							if(extra){
								extra = JSON.parse(extra);
								service.entity.extra = extra;
								longDescription = extra.longDescription;
							}
							if(name.indexOf('maria') != -1 || name.indexOf('Maria') != -1 || name.indexOf('mysql') != -1 || name.indexOf('Mysql') != -1){
								img = "mariadb_service.png";
							}
							else if(name.indexOf('mongo') != -1 || name.indexOf('Mongo') != -1){
								img = "mongodb_service.png";
							}
							else if(name.indexOf('object') != -1 || name.indexOf('Object') != -1){
								img = "object-storage.png";
							}
							else if(name.indexOf('rabbit') != -1 || name.indexOf('Rabbit') != -1){
								img = "rabbitmq.png";
							}
							else if(name.indexOf('redis') != -1 || name.indexOf('Redis') != -1){
								img = "redis_service.png";
							}
							else if(name.indexOf('autoscaler') != -1 || name.indexOf('Autoscaler') != -1 || name.indexOf('AutoScaler') != -1){
								img = "autoscale_service.png";
							}
							else{
								img = "sample-img.png";
							}

							var description = service.entity.description;
							var html = $('#marketItemTemplate').html();
							html = html.replace('{imageUrl}', img).replace('{name}', name).replace('{description}', longDescription || description);

							var target = $(html);
							target.get(0).item = service;
							$('#marketServiceList').append(target);

							$(target).find('.btn-view').on('click', function(e){
//								if($("#plansDiv").css("display") == "none"){
									$("#plansDiv").show();
//									$("#selectedPlanDiv").hide();
									$(target).parent().parent().parent().find("a").removeClass("selected");
									$(target).parent().addClass("selected");

									pumpkin.execute([{name : 'setServicePlan', params : {service : service}}], function(){
										setOrgSelectedBox();
									},
									function(workName, error){
										var errorObj = JSON.parse(error);
										var errorInfo = JSON.parse(errorObj.error);
										openErrorPopup(errorInfo.description);
									});
//								}
//								else{
//									$("#plansDiv").hide();
//								}
							});

							done();
						}
					},
					function(){
						$('.marketplace-progress').hide();

						$('#marketServiceList .view-plans').on('click', function(){
							var text = $(this).text();
							if(text == 'View plans')
								$(this).text('Hide plans').parent().parent().next().css('display', 'table');
							else
								$(this).text('View plans').parent().parent().next().hide();
						});
					});

					$(".container-wrap").show();
					$('#backgroundProgress').hide();
				}
				else{
					$(".container-wrap").show();
					$('#backgroundProgress').hide();
					openErrorpopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				$(".container-wrap").show();
				$('#backgroundProgress').hide();
				openErrorpopup("Unknown Error");
			}
		},
		function(error){
			$(".container-wrap").show();
			$('#backgroundProgress').hide();
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	}

	var setOrgSelectedBox = function(){
		CF.async({url : '/v2/organizations'}, function(result){
			if(result){
				if(result.resources){
					$('#selectedPlan_orgSelect').html('<option value="">Select a organization</option>');

					var orgList = result.resources;
					for(var i=0; i<orgList.length; i++){
						$('#selectedPlan_orgSelect').append('<option value="' + orgList[i].metadata.guid + '">' + orgList[i].entity.name + '</option>');
					}
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}

				$("#selectedPlan_orgSelect").on('change', function(){
					var orgGuid = $(this).val();
					if(orgGuid){
						setSpaceSelectedBox(orgGuid);
					}
					else{
						$("#selectedPlan_spaceSelect").empty();
						$("#selectedPlan_spaceSelect").parent().find("span").text("");
						$("#selectedPlan_appSelect").empty();
						$("#selectedPlan_appSelect").parent().find("span").text("");
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
	};

	var setSpaceSelectedBox = function(orgGuid){
		$("#selectedPlan_spaceSelect").empty();
		$("#selectedPlan_spaceSelect").parent().find("span").text("");
		$("#selectedPlan_appSelect").empty();
		$("#selectedPlan_appSelect").parent().find("span").text("");

		CF.async({url : '/v2/organizations/' + orgGuid + '/spaces'}, function(result){
			if(result){
				if(result.resources){
					$('#selectedPlan_spaceSelect').html('<option value="">Select a Spaces</option>');
					$("#selectedPlan_spaceSelect").parent().find("span").text("Select a Spaces");

					var spaceList = result.resources;
					for(var i=0; i<spaceList.length; i++){
						$('#selectedPlan_spaceSelect').append('<option value="' + spaceList[i].metadata.guid + '">' + spaceList[i].entity.name + '</option>');
					}
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}

				$("#selectedPlan_spaceSelect").on('change', function(){
					var spaceGuid = $(this).val();
					if(orgGuid){
						setAppSelectedBox(spaceGuid);
					}
					else{
						$("#selectedPlan_appSelect").empty();
						$("#selectedPlan_appSelect").parent().find("span").text("");
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
	};

	var setAppSelectedBox = function(spaceGuid){
		$("#selectedPlan_appSelect").empty();
		$("#selectedPlan_appSelect").parent().find("span").text("");

		CF.async({url : '/v2/spaces/' + spaceGuid + '/apps'}, function(result){
			if(result){
				if(result.resources){
					$('#selectedPlan_appSelect').html('<option value="">Select a app to bind(optional)</option>');
					$("#selectedPlan_appSelect").parent().find("span").text("Select a app to bind(optional)");

					var appList = result.resources;
					for(var i=0; i<appList.length; i++){
						$('#selectedPlan_appSelect').append('<option value="' + appList[i].metadata.guid + '">' + appList[i].entity.name + '</option>');
					}
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}

				$("#selectedPlan_appSelect").on('change', function(){

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
	};

	var moveServicePage = function(orgGuid, spaceGuid){
		location.href = "/space_main#space=" + spaceGuid + "&tab=2";
	}

	var initPlan = function(){
		$("#selectedPlan_planName").val("");
		$("#selectedPlan_orgSelect option:eq(0)").attr("selected", "selected");
		$("#selectedPlan_orgSelect").parent().find('span').text("Select a organization");
		$("#selectedPlan_spaceSelect option:eq(0)").attr("selected", "selected");
		$("#selectedPlan_spaceSelect").parent().find('span').text("Select a Spaces");
		$("#selectedPlan_appSelect option:eq(0)").attr("selected", "selected");
		$("#selectedPlan_appSelect").parent().find('span').text("Select a app to bind(optional)");
	}

	$(document).ready(function(){
		$(".container-wrap").hide();
		$('#backgroundProgress').show();

		setMarketServiceList();

		$("#addActBtn").on('click', function(){

			if(!$("#selectedPlan_planName").text()){
				openWarringPopup("Select a Plan.");
				return false;
			}
			if(!$("#selectedPlan_instanceName").val()){
				openWarringPopup("Enter an Instance name.");
				return false;
			}
			if(!$("#selectedPlan_orgSelect").val()){
				openWarringPopup("Select an Organizations");
				return false;
			}
			if(!$("#selectedPlan_spaceSelect").val()){
				openWarringPopup("Select an Space");
				return false;
			}

			openConfirmPopup("Service Instance Create", "Create a new service instance?", "createNewService");

		});

		$("#marketCnclBtn").on('click', function(){
			$("#plansDiv").hide();
		});

		formSubmit($('#selectedPlanForm'), function(data){

			var plan = $('#selectedPlanForm').get(0).item;
			data.service_plan_guid = plan.metadata.guid;
			data.parameters = {};
			data.tags = plan.service.entity.tags;

			/*$('.modal-form .parameters').each(function(){
				var key = $(this).children('.key').val();
				var value = $(this).children('.value').val();

				if(key)
					data.parameters[key] = value;
			});*/

			CF.async({url : '/v2/service_instances', method : 'POST', form : data}, function(result){
				if(result){
					if(result.entity){
						var param = {};
						param.orgGuid = $("#selectedPlan_orgSelect").val();
						param.spaceGuid = $("#selectedPlan_spaceSelect").val();

						if(data.appGuid){
							CF.async({url : '/v2/service_bindings', method : 'POST', form : {service_instance_guid : result.metadata.guid, app_guid : data.appGuid}}, function(result){

								if(result){
									if(result.entity){

										$("#selectedPlan_planName").val("");
										$("#selectedPlan_orgSelect option:eq(0)").attr("selected", "selected");
										$("#selectedPlan_orgSelect").parent().find('span').text("Selected Domain");
										$("#selectedPlan_spaceSelect option:eq(0)").attr("selected", "selected");
										$("#selectedPlan_spaceSelect").parent().find('span').text("Selected Domain");
										$("#selectedPlan_spaceSelect option:eq(0)").attr("selected", "selected");
										$("#selectedPlan_spaceSelect").parent().find('span').text("Selected Domain");
										$("#selectedPlan_spaceSelect option:eq(0)").attr("selected", "selected");
										$("#selectedPlan_spaceSelect").parent().find('span').text("Selected Domain");

										openConfirmPopup("Move Service", "Complate a service instance created. Do you move on Service page?", "gotoServicePage", param);
									}
									else{
										openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
									}
								}
								else{
									openErrorPopup('Unknown Error by creation service binding.');
								}
							},
							function(error){
								var errorObj = JSON.parse(error);
								var errorInfo = JSON.parse(errorObj.error);
								openErrorPopup(errorInfo.description);
							});
						}
						else{
							openConfirmPopup("Move Service", "Complate a service instance created. Do you move on Service page?", "gotoServicePage", param);
						}
					}
					else{
						openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
					}
				}
				else{
//					$('.modal-form .small-progress').hide().next().next().show().next().show();
//					$('#modalMessage').text('Unknown Error');
				}
			},
			function(error){
				var errorObj = JSON.parse(error);
				var errorInfo = JSON.parse(errorObj.error);
				openErrorPopup(errorInfo.description);
			});
		});

		/*$('#cancelModal').on('click', function(){
			var first = $('.parameters:first');
			$('.parameters').remove();

			$('.form-row:last').append(first);

			$('#selectPlanDialog').modal('hide');

			$('.modal-form input[type="text"]').val('');
			$('.modal-form select').html('');
			$('#modalMessage').text('');
		});*/

		$("#confirmPopupBtn").on('click', function(){
			$("#confirmPopup").close();
			var param = $("#confirmPopup").get(0).item;

			if(param){
				var confirmType = param.confirmType;
				var data = param.data;

				if(confirmType == "createNewService"){
					$("#selectedPlanForm").submit();
				}
				else if(confirmType == "gotoServicePage"){
					moveServicePage(data.orgGuid, data.spaceGuid);
				}
			}
		});
	});

})();
