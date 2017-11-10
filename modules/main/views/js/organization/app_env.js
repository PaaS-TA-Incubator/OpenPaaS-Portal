/**
 * Environment Variable Global Function
 * 2017-05-27
 */
(function(){
	_ee.on('setEnvironmentVariables', function(appInfo){
		var appGuid = _global.hash.apps;
		var environment = appInfo.entity.environment_json;
		
		if(appGuid){
			setUserProvided(appGuid, environment);
			CF.async({url : '/v2/apps/' + appGuid + '/env'}, function(result){
				if(result){
					$("#systemProvidedTextarea").html(JSON.stringify(result, null, 4));
					$("#envVariableTextDialog").html("<pre>" + JSON.stringify(result, null, 4) + "</pre>");
				}
				else{
					openErrorPopup("Environment Variables is not found");
				}
			},
			function(error){
				var errorObj = JSON.parse(error);
				var errorInfo = JSON.parse(errorObj.error);
				openErrorPopup(errorInfo.description);
			});
			
			// save action & edit action
			$("#envVariablesDialogSaveBtn").on('click', function(){
				openConfirmPopup("Environment Variables Save", "Are you sure?", "envVariablesDialogSave");
			});
			
			formSubmit($('#envVariablesDialog .env-form'), function(data){
				
				if(environment.hasOwnProperty(data.key)){
					openErrorPopup('Duplicated key');
					return;
				}
				
				if(data.key && data.value){
					environment[data.key] = data.value;
				}
				
				var trList = $("#userProvidedTextDialog").find("tbody > tr");
				for(var i=0; i<trList.length; i++){
					var dataKey = $(trList[i]).attr("data-key");
					
					if($($(trList[i]).find('td')[0]).text() == dataKey){
						var value = $(trList[i]).find('input').val();
						
						if(value && value != environment[dataKey]){
							environment[dataKey] = value;
						}
						else if(!value){
							delete environment[dataKey];
						}
					}
				}
				
				var param = {};
				param.url = '/v2/apps/' + appGuid;
				param.method = 'PUT';
				param.headers = {'Content-Type' : 'application/json'};
				param.form = {};
				param.form['environment_json'] = environment;
				
				CF.async(param, function(result){
					
					$('#envVariablesDialog .env-form input[name="key"]').val('');
					$('#envVariablesDialog .env-form textarea[name="value"]').val('');
					
					if(result){
						if(result.entity){
							setUserProvided(appGuid, result.entity.environment_json);
						}
						else{
							openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
						}
					}
					else{
						openErrorPopup("Unkown error");
					}
				},
				function(error){
					var errorObj = JSON.parse(error);
					var errorInfo = JSON.parse(errorObj.error);
					openErrorPopup(errorInfo.description);
				});
			});
		}
	});
	
	var setUserProvided = function(appGuid, environment){
		var html = "";
		var dialogHtml = "";
		var idx = 0;
		$("#userProvidedTextDialog").empty();
		for(var key in environment){
			if(idx > 0){
				html += "\n";
			}
			html += key + " : " + environment[key];
			idx++;
			dialogHtml = '<tr data-key=' + (key?key:"") +'><td style="width: 200px;">' + key + '</td>';
			dialogHtml += '<td><input type="text" style="width: 450px;" value="' + environment[key] +'"></td></tr>';
			
			$("#userProvidedTextDialog").append(dialogHtml);
		}
		
		$("#userProvidedTextarea").html(html);
	};
})();
