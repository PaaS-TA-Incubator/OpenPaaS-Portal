/**
 * Security Group Function
 * 2017-07-26
 */
(function(){
	
	var pumpkin = new Pumpkin();
	
	// Security Group Count
	_ee.on("setSecurityGroupCount", function(spaceGuid){
		
		getSecurityGroupList(spaceGuid, function(securityGroupList){
			$("#securityGroupTotNum").text(securityGroupList.length);
			$("#securityListCount").text("(" + securityGroupList.length + ")");
		},
		function(error){
			$("#securityGroupTotNum").text(0);
			$("#securityListCount").text("(0)");
		});
	});

	_ee.on('setSecurityGroup', function(spaceGuid){
		$("#securityGroups").empty();
		
		var loadingBarHtml = $("#panelLoadingBarTemplate").html();
		$(".nonTable__wrap").append(loadingBarHtml);
		$("#securityGroups").hide();
		
		getSecurityGroupList(spaceGuid, function(securityGroupList){
			_ee.emit("createSecurityGroup", securityGroupList);
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	});
	
	_ee.on('createSecurityGroup', function(securityGroupList){
		var htmlTemplate = "";
		
		for(var i=0; i<securityGroupList.length; i++){
			htmlTemplate = $("#securityGroupItemTemplate").html();
			htmlTemplate = $(htmlTemplate);
			var securityGroupItem = securityGroupList[i].entity;
			
			// name setting
			htmlTemplate.find(".security-item-name").text(securityGroupItem.name);
			
			// state setting
			var state = "";
			if(securityGroupItem.running_default){
				state += "running";
			}
			if(state){
				state += ", ";
			}
			if(securityGroupItem.staging_default){
				state += "staging";
			}
			htmlTemplate.find(".security-item-state").text(state);
			
			// rule setting
			var rules = securityGroupItem.rules;
			var ruleHtml = "";
			for(var r=0; r<rules.length; r++){
				var rule = rules[r];
				ruleHtml += '<div class="security-item-content-destination" style="margin-top:5px;">destination : ' + rule.destination + '</div>';
				if(rule.ports){
					ruleHtml += '<div class="security-item-content-port">port : ' + rule.ports + '</div>';
				}
				ruleHtml += '<div class="security-item-content-protocol">protocol : ' + rule.protocol + '</div>';
			}
			htmlTemplate.find(".security-item-content").append(ruleHtml);
			
			$("#securityGroups").append(htmlTemplate);
			
			if(i < securityGroupList.length-1){
				$("#securityGroups").append("<hr>");
			}
		}
		
		$("#panelLoadingBar").remove();
		$("#securityGroups").show();
	});
	
	var getSecurityGroupList = function(spaceGuid, callback, error){
		CF.async({url : '/v2/spaces/' + spaceGuid + '/security_groups', method : 'GET'}, function(data){
			if(data.resources){
				var securityGroupList = data.resources;
				callback(securityGroupList);
			}
			else{
				callback(data.body);
			}
		});
	}
})();