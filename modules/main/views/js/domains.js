/**
 * Application Main Function
 * 2017-05-29
 */
(function(){
	var pumpkin = new Pumpkin();
	
	_ee.on("getDomainList", function(orgGuid){
		pumpkin.execute([{name : 'getOrg', params : {guid : orgGuid}}, {name : 'getOrgDomainList'}]);
	});
	
	_ee.on("createDomainList", function(domainList, next){
		$('#domainTbody').empty();
		if(domainList){
			
			var forEach = new ForEach();
			forEach.async(domainList, function(domainItem, index){
				
				var done = this.done;
				var row = $('#domainListItem').html();
				var domainGuid = domainItem.metadata.guid;
				
				row = row.replace("{domainName}", domainItem.entity.name);
				row = $(row);
				row.get(0).item = domainItem;
				
				$(row).find('button[act-type="delete"]').on('click', function(e){
					var data = {};
					data.target = $(this).parent().parent();
					data.domainGuid = $(this).parent().parent().get(0).item.metadata.guid;
					openConfirmPopup("Domain Delete", "Are you sure you want to delete [" + domainItem.entity.name + "]?", "delete", data);
					
				});
				
				$('#domainTbody').append(row);
				done();
			});
		}
		next();
	});
	
	_ee.on("hashchange", function(){
		var orgGuid = _global.hash.org;
		_ee.emit("getDomainList", orgGuid);
	});
	
	pumpkin.addWork('getOrg', function(params){
		var next = this.next;
		CF.async({url : '/v2/organizations/' + params.guid}, function(result){
			if(result.entity){
				next({url : result.entity.domains_url});
			}
			else{
				openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
			}
		});
	});

	pumpkin.addWork('getOrgDomainList', function(params){
		var next = this.next;
		CF.async({url : params.url}, function(result){
			if(result){
				if(result.resources){
					var domainList = result.resources;
					_ee.emit("createDomainList", domainList, next);
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup("Unknown Error");
			}
		});
	});
	
	var createDomain = function(data){
		
		var domainText = $("#newDomainText").val();
		if(!domainText || data.name != domainText){
			return false;
		}
		
		CF.async({url : '/v2/domains', method : 'POST', form : data}, function(result){
			if(result){
				if(result.entity){
					_ee.emit("getDomainList", data.owning_organization_guid);
					$("#newDomainText").val("");
				}
				else{
					openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
				}
			}
			else{
				openErrorPopup("Unknown Error");
			}
		});
	}
	
	var setDeleteDomain = function(data){
		var guid = data.domainGuid;
		var target = data.target;
		
		CF.async({url : '/v2/domains/' + guid, method: 'DELETE'}, function(result){
			if(result && result.code){
				openErrorPopup(result.description ? result.description : JSON.stringify(result.error));
			}
			else{
				$(target).remove();
			}
		},
		function(error){
			var errorObj = JSON.parse(error);
			var errorInfo = JSON.parse(errorObj.error);
			openErrorPopup(errorInfo.description);
		});
	};
	
	$(document).ready(function(){
		var orgGuid = _global.hash.org;
		_ee.emit("getDomainList", orgGuid);
		
		$("#newDomainText").on('keyup', function(e){
			if(!$("#newDomainText").val()){
				$("#addDomainBtn").setEnabled("false");
				$("#cnclAddDomainBtn").setEnabled("false");
			}
			else{
				$("#addDomainBtn").setEnabled("true");
				$("#cnclAddDomainBtn").setEnabled("true");
			}
			
			if(e.keyCode == "13"){
				$("#addDomainBtn").click();
			}
		});
		
		$("#cnclAddDomainBtn").on('click', function(e){
			$("#newDomainText").val("");
			$("#addDomainBtn").setEnabled("false");
			$("#cnclAddDomainBtn").setEnabled("false");
		});
		
		$("#addDomainBtn").on('click', function(){
			var data = {};
			data.name = $("#newDomainText").val();
			data.owning_organization_guid = orgGuid;
			
			if(!data.owning_organization_guid){
				openWarringPopup("Enter domain name.");
				$("#newDomainText").focus();
			}
			openConfirmPopup("Domain Create", "Add domain about [" + data.name + "]?", "create", data);
		});
		
		$("#confirmPopupBtn").on('click', function(){
			$("#confirmPopup").close();
			var param = $("#confirmPopup").get(0).item;
			var confirmType = param.confirmType;
			var data = param.data;
			if(confirmType == "create"){
				createDomain(data);
			}
			else if(confirmType == "delete"){
				setDeleteDomain(data);
			}
			else{
				return false;
			}
		});
	});
})();