/**
 * 2017/05/22
 * Common Event Listener And Common javascript
 * jjh
 */
$(document).ready(function(){
	//dialog
	$('#dialog-rename').click(function(){
		$('#rename-pop').open({
		   title:"Rename Org",
		   width: 430,
		   height: 183
		 });
	});
	$('#dialog-rename-space').click(function(){
		$('#rename-pop-space').open({
		   title:"Rename Space",
		   width: 430,
		   height: 183
		 });
	});
	$('#dialog-rename-apps').on('click', function(){
		$('#rename-pop-apps').open({
		   title:"Rename Apps",
		   width: 430,
		   height: 183
		 });
	});
	$('#dialog-rename-service').click(function(){
		$('#rename-pop-service').open({
		   title:"Rename Service",
		   width: 430,
		   height: 183
		 });
	});

	// 20170522 - dialog Close
	$(".Dialog").find("[name='dialogCnclBtn']").on('click', function(){
		dialogInit();
		$(".Dialog").close();
	});
});

/**
 * popupName, title, type, height, width
 */
var openDialogPopup = function(popupName, title, height, width){
	$("#" + popupName).open({
	   title:title,
	   width: width,
	   height: height,
	 });
};

var openDialogPopupWithXBtn = function(popupName, title, height, width){
	$("#" + popupName).open({
		title:title,
		width: width,
		height: height,
		xButtonClickCallback : function(el){ // 우측 상단 X 버튼으로 닫을 경우 동작하는 콜백
			dialogInit();
			$("#sysLogUseYn").setChecked(false);
			$(".Dialog").close();
		}
	});
}

var openErrorPopup = function(errorText){
	if(errorText){
		$("#warningPopupText").text(errorText);
	}

	$("#alertPopup").open({
		title: "Error Popup",
		width: 430,
//        height: 190,
        title: false
	});

	$(".general-close.xButtonClick").on("click", function(){
		$("#alertPopup").close();
	});
};

var openWarringPopup = function(warringMessage){
	if(warringMessage){
		$("#warningPopupText").text(warringMessage);
	}

	$("#alertPopup").open({
		title: "Warring Popup",
		width: 430,
        height: 190,
        title: false
	});

	$(".general-close.xButtonClick").on("click", function(){
		$("#alertPopup").close();
	});
};

var openInfoPopup = function(infoMessage){
	if(infoMessage){
		$("#infoPopupText").text(infoMessage);
	}

	$("#infoPopup").open({
		title: "Infomation Popup",
		width: 430,
        title: false
	});

	$(".general-close.xButtonClick").on("click", function(){
		$("#infoPopup").close();
	});
}

var dialogInit = function(){
	$(".Dialog").find("input").val("");
}

var openConfirmPopup = function(popupTitle, contentText, type, data){

	var confirmMessage = contentText;
	var param = {};
	param.confirmType = (type ? type : "");
	param.data = (data ? data : "");

	if(contentText){
		$("#confirmPopupText").text(contentText);
	}
	else{
		$("#confirmPopupText").text("Warring!!!");
	}

	$("#popupTitle").text((popupTitle) ? popupTitle : "Confirm Popup");

	$("#confirmPopup").open({
		title: (popupTitle) ? popupTitle : "Confirm Popup",
		width: 430,
        title: false
	});

	$("#confirmPopup").get(0).item = param;

	$(".general-close.xButtonClick, #popupCnclBtn").on("click", function(){
		$("#confirmPopup").close();
	});
};

var addCount = function(targetId, isGualho){
	var text = $("#" + targetId).text();
	var count = text.replace("(", "").replace(")", "");
	count = Number(count) + 1;

	if(isGualho){
		$("#" + targetId).text("(" + count + ")");
	}
	else{
		$("#" + targetId).text(count);
	}
	return count;
}

var minusCount = function(targetId, isGualho){
	var text = $("#" + targetId).text();
	var count = text.replace("(", "").replace(")", "");
	count = Number(count) - 1;

	if(isGualho){
		$("#" + targetId).text("(" + count + ")");
	}
	else{
		$("#" + targetId).text(count);
	}
	return count;
}

var setServiceImageName = function(label){
	var imageName = "";

	if(label.toLowerCase().indexOf('redis') != -1 || label.toLowerCase().indexOf('Redis') != -1){
		imageName = "redis_service";
	}
	else if(label.toLowerCase().indexOf('object') != -1 || label.toLowerCase().indexOf('Object') != -1){
		imageName = "object-storage";
	}
	else if(label.toLowerCase().indexOf('autoscaler') != -1 || label.toLowerCase().indexOf('Autoscaler') != -1 || label.toLowerCase().indexOf('AutosCaler') != -1){
		imageName = "autoscale_service";
	}
	else if(label.toLowerCase().indexOf('maria') != -1 || label.toLowerCase().indexOf('Maria') != -1 || label.toLowerCase().indexOf('mysql') != -1 || label.toLowerCase().indexOf('Mysql') != -1){
		imageName = "mariadb_service";
	}
	else if(label.toLowerCase().indexOf('rabbit') != -1 || label.toLowerCase().indexOf('Rabbit') != -1){
		imageName = "rabbitmq";
	}
	else if(label.toLowerCase() == "user_provided_service_instance"){
		imageName = "userprovided_service";
	}
	else{
		imageName = "sample-img";
	}
	return imageName;
}

var setServiceDashboardUrl = function(label){
	var dashboardUrl = "";

	if(label.toLowerCase().indexOf('redis') != -1 || label.toLowerCase().indexOf('Redis') != -1){
		dashboardUrl = 'redisDashboard';
	}
	else if(label.toLowerCase().indexOf('object') != -1 || label.toLowerCase().indexOf('Object') != -1){
		dashboardUrl = 'swiftDashboard';
	}
	else if(label.toLowerCase().indexOf('autoscaler') != -1 || label.toLowerCase().indexOf('Autoscaler') != -1 || label.toLowerCase().indexOf('AutosCaler') != -1){
		dashboardUrl = 'autoscalerDashboard';
	}
	else{
		dashboardUrl = '';
	}
	return dashboardUrl;
}

/*
 * Return Format
 * FormatType 1 : YYYYMM
 * FormatType 2 : YYYYMMDD
 * FormatType 3 : YYYY-MM
 * FormatType 4 : YYYY-MM-DD
 * FormatType 5 : Week Month Day Year (ex:Tue Jun 20 2017)
 */
var getParsingDate = function(date, formatType){
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	var resultDate = "";

	if(month < 10){
		month = "0" + month;
	}

	switch(formatType){
		case "YYYYMM":
			resultDate = year.toString() + month.toString();
			break;
		case "YYYYMMDD":
			resultDate = year.toString() + month.toString() + day.toString();
			break;
		case "YYYY-MM":
			resultDate = year.toString() + "-" + month.toString();
			break;
		case "YYYY-MM-DD":
			resultDate = year.toString() + "-" + month.toString() + "-" + day.toString();
			break;
		case "toDate":
			resultDate = date.toDateString();
			break;
		default:
			resultDate = date.toDateString();
			break;
	}
	return resultDate;
}

var parsingBillingStatement = function(statementVal){
	var statementArray = statementVal.split('-');
	var resultObj = {};

	if(statementArray.length == 2){
		resultObj.from = statementArray[0];
		resultObj.to = statementArray[1];
	}
	else{
		var nowDate = new Date();
		var nowDateYear = nowDate.getFullYear();
		var nowDateMonth = nowDate.getMonth() + 1;

		if(nowDateMonth < 10){
			nowDateMonth = "0" + nowDateMonth;
		}

		resultObj.from = nowDateYear + nowDateMonth;
		resultObj.to = nowDateYear + nowDateMonth;
	}

	return resultObj;
}
