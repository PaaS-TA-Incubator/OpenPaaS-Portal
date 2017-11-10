/**
 * http://usejsdoc.org/
 */
var excelListMap = {};
(function(){
	var pumpkin = new Pumpkin();
	
	pumpkin.addWork("appBillingReport", function(params){
		var that = this;
		var url = "/v1/org/" + params.orgGuid + "/space/" + params.spaceGuid;
		
		if(params.searchDate){
			url += "/from/" + params.searchDate.from + "/to/" + params.searchDate.to;
		}
		
		var result = $.ajax({url : '/billing_report', type : 'post', data : {url : url, method : 'GET', params : params}});
		result.done(function(data){
			if(data){
				if(typeof data == 'string'){
					data = JSON.parse(data);
				}
				
				/* 정지/삭제된 앱중 전월과 guid가 동일한 앱에 대해서 데이터를 필터링 후 리턴한다. (삭제 시 //end까지 제거하고 that.next(data) 주석 해제) */
				var spaceGuid = pumpkin.data.spacesGuid;
				pumpkin.setData({currentData : data, spaceGuid : spaceGuid});
				params.currentData = data;
				pumpkin.execute([{name : "fillteringBillingReport", params : params}], function(beforeData){
					var currentData = pumpkin.data.currentData;
					var fillterData = compareData(currentData, beforeData, pumpkin.data.spaceGuid);
					that.next(fillterData);
				});
				// end
				
//				that.next(data);
			}
		});
		result.fail(function(error){
			openErrorPopup(error.responseText);
		});
	});
	
	/* 정지/삭제된 앱중 전월과 guid가 동일한 앱에 대해서 데이터를 필터링 후 리턴한다. */
	pumpkin.addWork("fillteringBillingReport", function(params){
		var that = this;
		var url = "/v1/org/" + params.orgGuid + "/space/" + params.spaceGuid;
		var currentData = params.currentData;
		
		// 전월 날짜 셋팅
		if(!params.searchDateBefore){
			params.searchDateBefore = {};
			var year = params.searchDate.from.substring(0,4);
			var month = params.searchDate.from.substring(4,6);
			var day = (params.searchDate.from.length > 6 ) ? (params.searchDate.from.substring(6,8)) : '01' ;
			
			var beforeFromDate = new Date(year, month, day);
			beforeFromDate.setMonth(beforeFromDate.getMonth() - 1);								// 전월을 세팅(Date에서는 월이 기본적으로 +1되어서 설정되기때문에 전월을 구하려면 -2를 해야함)
			var setBeforeMonthDate = beforeFromDate.getFullYear() + (beforeFromDate.getMonth() < 10 ? "0" : "") + beforeFromDate.getMonth();
			
			if(params.searchDate.from == params.searchDate.to){
				params.searchDateBefore.from = setBeforeMonthDate;
				params.searchDateBefore.to = setBeforeMonthDate;
			}
			else{
				params.searchDateBefore.from = setBeforeMonthDate;
				
				year = params.searchDate.to.substring(0,4);
				month = params.searchDate.to.substring(4,6);
				day = (params.searchDate.to.length > 6 ) ? (params.searchDate.to.substring(6,8)) : '01' ;
				
				var beforeToDate = new Date(year, month, day);
				beforeToDate.setMonth(beforeToDate.getMonth() - 2);
				params.searchDateBefore.to = beforeToDate.getFullYear() + (beforeToDate.getMonth() < 10 ? "0" : "") + beforeToDate.getMonth();
			}
		}
		
		if(params.searchDateBefore){
			url += "/from/" + params.searchDateBefore.from + "/to/" + params.searchDateBefore.to;
		}
		
		var result = $.ajax({url : '/billing_report', type : 'post', data : {url : url, method : 'GET', params : params}});
		result.done(function(beforeData){
			if(beforeData){
				if(typeof beforeData == 'string'){
					beforeData = JSON.parse(beforeData);
				}
				
				that.next(beforeData);
			}
		});
		result.fail(function(error){
			openErrorPopup(error.responseText);
		});
	});
	
	var compareData = function(currentData, beforeData, spaceGuid){
		var newData = currentData;
		
		// 빠른 속도를 위해 전월 app list를 미리 추출한다.
		if(beforeData){
			var beforeApps = null;
			if(beforeData.monthly_usage_arr && beforeData.monthly_usage_arr[0] && beforeData.monthly_usage_arr[0].spaces){
				var beforeSpaces = beforeData.monthly_usage_arr[0].spaces;
				for(var j=0; j<beforeSpaces.length; j++){
					var beforeSpace = beforeSpaces[j];
					if(spaceGuid == beforeSpace.space_id){
						beforeApps = beforeSpace.app_usage_arr;
					}
				}
			}
			
			if(beforeApps && newData && newData.monthly_usage_arr && newData.monthly_usage_arr[0] && newData.monthly_usage_arr[0].spaces){
				var spaces = newData.monthly_usage_arr[0].spaces;
				for(var i=0; i<spaces.length; i++){
					var space = spaces[i];
					if(spaceGuid == space.space_id){
						var apps = space.app_usage_arr;
						
						var newApps = [];
						for(var appIdx=0; appIdx<apps.length; appIdx++){
							var app = apps[appIdx];
							
							if(app.app_state == "STOPPED" || app.app_state == "CF_DELETED_APP"){
								// app이 stop 이나 delete이면 전월의 guid와 비교해서 같으면 목록에서 제외한다.
								var isSame = false;
								for(var j=0; j<beforeApps.length; j++){
									var beforeApp = beforeApps[j];
									
									if(app.app_id == beforeApp.app_id && (beforeApp.app_state == "STOPPED" || beforeApp.app_state == "CF_DELETED_APP") ){
										isSame = true;
										break;
									}
								}
								
								if(!isSame){
									newApps.push(app);
									continue;
								}
							}
							else{
								newApps.push(app);
								continue;
							}
						}
						
						space.app_usage_arr = newApps;
					}
				}
			}
		}
		return newData;
	}
	/* 정지/삭제된 앱중 전월과 guid가 동일한 앱에 대해서 데이터를 필터링 후 리턴한다. - end */
	
	var createBillingStatementOption = function(orgCreateDate){
		var nowDate = new Date();
		var nowYear = nowDate.getFullYear();
		var nowMonth = nowDate.getMonth() + 1;
		
		var createDate = new Date(orgCreateDate);
		var createDateYear = createDate.getFullYear();
		var createDateMonth = createDate.getMonth() + 1;
		
		if(createDate > nowDate){
			openErrorPopup("Org created date is invalid");
		}
		else{
			var optionHtml = "";
			
			var compareDate = nowDate;
			var beforeMonthDate = "";
			if(compareDate.getFullYear() == nowYear && (compareDate.getMonth()+1) == nowMonth && nowDate.getDate() > 1){
				beforeMonthDate = new Date(nowYear, nowMonth-1);
			}
			else{
				beforeMonthDate = new Date(nowYear, nowMonth-2);
			}
			
			while(beforeMonthDate.getFullYear() >= createDateYear && (beforeMonthDate.getMonth()+1) >= createDateMonth){
				var optionValue = "";
				
				if(beforeMonthDate.getFullYear() == createDateYear && (beforeMonthDate.getMonth()+1) == createDateMonth){
					beforeMonthDate = createDate;
				}
				
				optionValue = getParsingDate(beforeMonthDate, "YYYYMM") + "-" + getParsingDate(beforeMonthDate, "YYYYMM");
				optionHtml += "<option value='" + optionValue + "'>" + (beforeMonthDate.toDateString() + " ~ " + compareDate.toDateString())+ "</option>";
				
				compareDate = beforeMonthDate;
				beforeMonthDate = new Date(compareDate.getFullYear(), compareDate.getMonth()-1);
			}
			
			$("#selectedOptionStatement").html(optionHtml);
			$("#selectedOptionStatement option:eq(0)").attr("selected", "selected");
			var selectedText = $("#selectedOptionStatement").getTexts()[0];
			$("#selectedOptionStatement").parent().find("span").text(selectedText);
		}
	};
	
	var createBillingReportAppList = function(spaceList){
		var panelLoadingBar = $("#panelLoadingBarTemplate").html();
		panelLoadingBar = $(panelLoadingBar).css("background-color", "#f1f1f1");
		$("#billingSpaceDetail").parent().append(panelLoadingBar);
		$("#billingSpaceDetail").hide();
		
		var cloneTemp = $($("#billingSpaceDetail > li")[0]).clone(true);
		$("#billingSpaceDetail").find('>li').remove();
		$("#billingSpaceDetail").append(cloneTemp);
		
		var orgTotalUsage = 0;
		if(spaceList.length < 1){
			var spaceListHtml = "<li>No Space</li>";
			$("#billingSpaceDetail").append(spaceListHtml);
		}
		else{
			var searchDate = parsingBillingStatement($("#selectedOptionStatement").getValues()[0]);
			var forEach = new ForEach();
			forEach.sync(spaceList, function(spaceItem, index){
				var done = this.done;
				var clone = $($("#billingSpaceDetail > li")[0]).clone(true);
				$(clone).css("display", "block");
				$(clone).find('a').text(spaceItem.entity.name);
				$(clone).find('a').get(0).item = spaceItem;
				$(clone).attr('id', 'billing_' + spaceItem.metadata.guid);
				clone.insertAfter($("#billingSpaceDetail").find('>li')[$("#billingSpaceDetail").find('>li').length-1]);
				
				var param = {};
				param.orgGuid = _global.hash.org;
				param.spaceGuid = spaceItem.metadata.guid;
				param.searchDate = searchDate;
				
				/* 정지/삭제된 앱중 전월과 guid가 동일한 앱에 대해서 데이터를 필터링 후 리턴한다. (삭제 시 pumpkin.setData 제거) */
				pumpkin.setData({spacesGuid : spaceItem.metadata.guid});
				pumpkin.execute([{name : "appBillingReport", params : param}], function(billingResult){
					var excelData = [];
					if(billingResult && billingResult.monthly_usage_arr && billingResult.monthly_usage_arr[0] 
							&& billingResult.monthly_usage_arr[0].spaces){
						var spaces = billingResult.monthly_usage_arr[0].spaces;
						var spacesTarget = null;
						
						// monthly_usage_arr 중 출력해야될 space만 추출 
						for(var i=0; i<spaces.length; i++){
							if(spaceItem.metadata.guid == spaces[i].space_id){
								spacesTarget = spaces[i];
//								orgTotalUsage += Number(spacesTarget.sum.toFixed(2));
								break;
							}
						}
						
						if(spacesTarget && spacesTarget.app_usage_arr){
							var appBillingReportList = spacesTarget.app_usage_arr;
							var trHtml = "";
							var spacesSum = 0;
							for(var i=0; i<appBillingReportList.length; i++){
								var appBillingReportItem = appBillingReportList[i];
								var roundUsage = Number(appBillingReportItem.app_usage.toFixed(2));
								trHtml += "<tr>";
								trHtml += "<td>" + appBillingReportItem.app_name + "</td>";
								trHtml += "<td>" + (appBillingReportItem.app_state ? appBillingReportItem.app_state : (appBillingReportItem.app_name == "CF_DELETED_APP" ? "DELETE" : "Unknown")) + "</td>";
								trHtml += "<td>" + appBillingReportItem.app_instance + "</td>";
								trHtml += "<td>" + appBillingReportItem.app_memory + "</td>";
								trHtml += "<td>" + roundUsage + "</td>";
								trHtml += "</tr>";
								spacesSum += roundUsage
//								excelData.push(appBillingReportItem);
							}
							
							// Space summary
							var spaceTotal = Number(spacesSum.toFixed(2));
							trHtml += "<tr>";
							trHtml += "<td colspan='4' style='text-align:center; font-weight:bold'>" + "Space Summary" + "</td>";
							trHtml += "<td>" + spaceTotal + "</td>";
							trHtml += "</tr>";
							
							$("#billing_" + spaceItem.metadata.guid).find('tbody').append(trHtml);
//							excelData['spaceData'] = spacesTarget;
							excelListMap[spaceItem.entity.name] = spacesTarget;
							orgTotalUsage += spaceTotal;
						}
						else{
							var trHtml = "<tr><td colspan='5' style='text-align:center;'>-- No Billing --</td></tr>";
							$(clone).find('tbody').append(trHtml);
						}
					}
					else{
						var trHtml = "<tr><td colspan='5' style='text-align:center;'>--No Billing--</td></tr>";
						$(clone).find('tbody').append(trHtml);
					}
					
					$("#totalUsageCharge").text(orgTotalUsage.toFixed(2) + " GB");
					done();
				});
			},
			function(){
				$("#panelLoadingBar").remove();
				$("#billingSpaceDetail").show();
			});
		}
	};
	
	var excelExportAction = function(){
		
		var total = {};
		var totalList = [];
		total.name = "Apps";
		total.totCharge = $("#totalUsageCharge").text().replace(" GB", "");
		totalList.push(total);
		excelListMap["total"] = totalList;
		
		$("#excelDataList").val(JSON.stringify(excelListMap));
		$('#excelExportForm').submit();
	}
	
	$(document).ready(function(){
		
		$(".container-wrap").hide();
		$('#backgroundProgress').show();
		
		var orgGuid = _global.hash.org;
		
		/* Billing Statement 현재 날짜 셋팅 */
		commonPumpkin.execute([{name:"getOrgInfo", params:{orgGuid : orgGuid}}], function(result){
			if(result.metadata){
				var orgCreateDate = result.metadata.created_at;
				createBillingStatementOption(orgCreateDate);
				
			}
			else{
				openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
			}
		});
		
		commonPumpkin.execute([{name : "getSpaceListByOrg", params : {orgGuid : orgGuid}}], function(spaceListObj){
			createBillingReportAppList(spaceListObj.resources);
			
			$(".container-wrap").show();
			$('#backgroundProgress').hide();
		});
		
		$("#selectedOptionStatement").on('change', function(){
			commonPumpkin.execute([{name : "getSpaceListByOrg", params : {orgGuid : orgGuid}}], function(spaceListObj){
				$(".container-wrap").hide();
				$('#backgroundProgress').show();
				
				createBillingReportAppList(spaceListObj.resources);
				
				$(".container-wrap").show();
				$('#backgroundProgress').hide();
			});
		});
		
		$("#excelExportBtn").on('click', function(){
			if(excelListMap){
				openConfirmPopup("Excel Export", 'Excel export path is your download fold and file name is "excel_export.xlsx". Are you sure excel export?', "excelExportAction")
			}
			else{
				openErrorPopup("Data loading is not yet complete. Please try again in a few minutes.");
				return ;
			}
		});
		
		$("#confirmPopupBtn").on('click', function(){
			$("#confirmPopup").close();
			var param = $("#confirmPopup").get(0).item;
			
			if(param){
				var confirmType = param.confirmType;
				var data = param.data;
				
				if(confirmType == "excelExportAction"){
					excelExportAction();
				}
			}
		});
	});
})();