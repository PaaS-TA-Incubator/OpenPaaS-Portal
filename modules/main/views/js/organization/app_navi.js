/**
 * Navigation Global Function
 * 2017-05-17
 */
(function(){
	var pumpkin = new Pumpkin();
	
	pumpkin.addWork('setOrgNavi', function(param){
		
		var that = this;
		if(param.org){
			CF.async({url : '/v2/organizations/' + param.org + '/summary', method : 'GET'}, function(result){
				if(result){
					var html = "<a href='/org_main#org=" + param.org + "'";
					if(!param.space){
						html += " class='selected'";
					}
					html += "><span class='history-tag'>ORG</span>" + result.name + "</a>";
//					$("#pageNavi").html(html);
					param.orgNavi = html;
					that.next(param);
				}
			});
		}
		else{
			that.next(param);
		}
	});
	
	pumpkin.addWork('setSpaceNavi', function(param){
		var that = this;
		if(param.space){
			CF.async({url : '/v2/spaces/' + param.space + '/summary', method : 'GET'}, function(result){
				if(result){
					var html = "<a href='/space_main#space=" + param.space + "'";
					if(!param.apps){
						html += " class='selected'";
					}
					html += "><span class='history-tag'>SPACE</span>" + result.name + "</a>";
					param.spaceNavi = html;
//					$("#pageNavi").append(html);
				}
				that.next(param);
			});
		}
		else{
			param.spaceNavi = "";
			that.next(param);
		}
	});
	
	_ee.on('setPageNavi', function(org, space){
		if(!org && !space){
			_ee.emit("setLnbInfo");
		}
		
		if(org || space){
			
			/*if(!org && space){
				var orgItem = $("#" + space).get(0).item.organization;
				if(orgItem){
					org = orgItem.metadata.guid;
					_global.hash.org = org;
				}
			}*/
			
			pumpkin.execute([{name : 'setOrgNavi', params : {org : org, space : space}}, 'setSpaceNavi'], function(param){
				$("#pageNavi").html(param.orgNavi + param.spaceNavi);
			});
		}
	});
	
})();