/**
 * Logs Function
 * 2017-05-24
 */
(function(){
	
	var pumpkin = new Pumpkin();
	
	_ee.on('app_detail_logs', function(appGuid){
		var loadingBar = $("#panelLoadingBarTemplate").html();
		$("#logTextArea").parent().append(loadingBar);
		$("#logTextArea").hide();
		
		getLogs(appGuid, function(logs){
			$("#logTextArea").html(logs);
			$("#logTextArea").parent().find("#panelLoadingBar").remove();
			$("#logTextArea").show();
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});
	
	_ee.on("app_detail_logs_dialog", function(appGuid){
		var loadingBar = $("#panelLoadingBarTemplate").html();
		$("#logsDialogDiv").parent().append(loadingBar);
		$("#logsDialogDiv").hide();
		
		getLogs(appGuid, function(logs){
			$("#logsDialogDiv").html(logs);
			$("#panelLoadingBar").remove();
			$("#logsDialogDiv").show();
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});
	
	// Go to Application Logging Dashboard를 클릭했을 때 발생하는 이벤트
	_ee.on('goLoggingDashboard', function(appGuid){
		var linkALD = $.ajax({url : '/logging_dashboard', type : 'get', data : {appId : appGuid}});
		linkALD.done(function(data){
			console.log("Data: ", data);
			window.open(data);
		});
		linkALD.fail(function(error){
			console.log("Error: ", error);
			openErrorPopup(error.responseText);
		});
	});
	
	var getLogs = function(appGuid, callback, error){
		CF.async({url : '/apps/' + appGuid + '/recentlogs'}, function(data){
		    appId = appGuid;
			data = JSON.parse(data);
			
			if(data.code == 200){
				data = data.body;
				try{
					data = data.split('\r\n\r\n\n\bgorouter');
			        if (data.length > 1) {
			            data.splice(0, 1);
			        }
			        var length = data.length;
			        for (var i = 0; i < length; i++){
			            var value = data[i];
			            value = value.substr(1, value.length - 1);

			            value = value.substr(0, value.indexOf(String.fromCharCode(16)));
			            while(value.indexOf(String.fromCharCode(3)) != -1)
			            	value = value.substr(value.indexOf(String.fromCharCode(3)) + 1);
			            while(value.lastIndexOf(String.fromCharCode(5)) != -1)
			            	value = value.substr(value.lastIndexOf(String.fromCharCode(5)) + 1);
			            while(value.indexOf(String.fromCharCode(4)) != -1)
			            	value = value.substr(value.lastIndexOf(String.fromCharCode(4)) + 1);
			            if(value.indexOf(String.fromCharCode(2)) != -1)
			            	value = value.substr(value.indexOf(String.fromCharCode(2)) + 1, value.length-1);
			            
			            data[i] = value;
			        }
			        data = data.join('\n');
			        
			        if(!data || data == "rep"){
			        	data = "-- No Log Message --"
			        }
					callback(data);
				}
				catch(err){
					console.error(err.stack);
				}
			}
			else{
				callback(data.body);
			}
		}, error, true);
	};
	
})();