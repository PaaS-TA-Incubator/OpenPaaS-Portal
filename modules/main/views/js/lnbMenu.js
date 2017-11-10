/**
 * Left Menu Function
 * 2017-05-15
 */
(function(){
	var pumpkin = new Pumpkin();
	pumpkin.addWork('getOrgList', function(){
		var that = this;

		CF.async({url : '/v2/organizations', method : 'get'}, function(result){
			if(result){
				var orgList = result.resources;

				if($(".paas-lnbwrap")){
					$(".paas-lnbwrap").remove();
				}

				var lnbNavHtml = $('#lnbMenuTemplate').html();
				$("#mainContent").prepend(lnbNavHtml);

				if(orgList){
					if (orgList.length == 0) {
						/* org가 없을때 link 제거 2017-10-13 jjh */
						var lnbItem  = '<li id="orgLi_noOrg" class="expandable">';
						lnbItem		+= '	<a href="#"><span class="lnb-tag">ORG</span>No ORG</a>';
						lnbItem		+= '	<ul class="lnb-sub" id=""></ul>';
						lnbItem		+= '</li>';
            $('#lnb_items').append(lnbItem);
          } else {
						for(var i=0; i<orgList.length; i++){
							var lnbItem = $('#lnbMenuItemTemplate').html();
							lnbItem = lnbItem.replace('{orgLiId}', 'orgLi_' + orgList[i].metadata.guid);
							lnbItem = lnbItem.replace('#', '#org=' + orgList[i].metadata.guid);
							lnbItem = lnbItem.replace('{orgName}', orgList[i].entity.name).replace('{guid}', orgList[i].metadata.guid);
							lnbItem = lnbItem.replace('{domains}', '/domains#org=' + orgList[i].metadata.guid);
							lnbItem = lnbItem.replace('{members}', '/members#org=' + orgList[i].metadata.guid);
							if (monitoringUrl != "/login/generic_oauth") {
								lnbItem = lnbItem.replace('{monitoring}', '<div class="lnb-sub__only" style="display:none;"><a href=' + monitoringUrl +' target="_blank">Monitoring</span></a></div>');
							} else {
								lnbItem = lnbItem.replace('{monitoring}', '');
							}
							lnbItem = $(lnbItem);

							lnbItem.get(0).item = orgList[i];

							orgList[i].element = lnbItem;

							$('#lnb_items').append(lnbItem);
						}

						// Space 목록을 조회하기 위해 Org 저장
						if(location.hash == null || location.hash == ''){
							_global.hash.org = location.hash;
						}
						else if(_global.hash.org == null || _global.hash.org == ''){
							_global.hash.org = orgList[0].metadata.guid;
						}
					}
					that.next(orgList);
				}
				else{
					that.error(result.description ? result.description : 'Organization is not found.');
				}
			}
			else{
				that.error('Organization is not found.');
			}
		});
	});

	/* 전체 Org의 Space 목록 조회 (org 다건) */
	pumpkin.addWork('getSpaceList', function(orgList){
		var template = '<li><a href="javascript:;" class="space-name">{name}</a></li>';
		var that = this;

		var forEach = new ForEach();

		forEach.sync(orgList, function(org, index){
			var done = this.done;
			CF.async({url : org.entity.spaces_url}, function(result){
				if(result){
					var space = null;
					var spaceList = result.resources;

					if(spaceList){
						for(var i=0; i<spaceList.length; i++){
							space = $(template.replace('{name}', spaceList[i].entity.name));

							$(space).attr('id', spaceList[i].metadata.guid);

							if(spaceList[i].metadata.guid == _global.hash.space){
								$(space).children('a').addClass('selected');
							}

							spaceList[i].organization = org;
							space.get(0).item = spaceList[i];

							$(org.element).children('ul').append(space);
						}
					}
					else{
						space = $(template.replace('{name}', result.description ? result.description : 'Empty').replace('href="#"', ''));
					}

					$(org.element).children('ul').append(space);

				}

				done(); // forEach next
			});
		}, function(){
			//forEach done
			that.next(); // pumpkin next
		});
	});

	_ee.on('regOrgMenuEvent', function(){
		// left sub menu toggle
		var lnbSub = $('.lnb-main > li');
		$(lnbSub).find('.lnb-sub').parent().addClass('expandable');

		if($(lnbSub).hasClass('expandable')){
			var lnbSubExpand = $('.lnb-main > li.expandable > a');
			$(lnbSubExpand).click(function(e){
				e.preventDefault();
				$(this).parent().find('.lnb-sub').slideToggle();
				$(this).parent().find('.lnb-sub__only').slideToggle();
				$(this).parent().toggleClass('expanded');
				$(this).toggleClass('selected');
			});
		};

		$("#lnb_items > .expandable > a").on('click', function(){
			var orgGuid = $(this).parent().children('ul')[0].id;

			// ORG가 없는경우..  2017-10-16
			if(!orgGuid){
				return ;
			}

			if(location.pathname != '/org_main'){
				_global.hash.org = $(this).parent().children('ul')[0].id;
				location.href = "/org_main#org=" +_global.hash.org;
			}
			else{
				if(orgGuid && orgGuid != _global.hash.org){

					if($(this).parent().hasClass('expanded')){
						var expandedItems = $(this).parent().parent().children('.expanded')
						for(var i=0; i<expandedItems.length; i++){
							if(expandedItems[i].id != $(this).parent()[0].id){
								$(expandedItems[i]).find('.lnb-sub').slideToggle();
								$(expandedItems[i]).find('.lnb-sub__only').slideToggle();
								$(expandedItems[i]).toggleClass('expanded');
								$(expandedItems[i]).find('>a').toggleClass('selected');
							}
						}

						_global.hash.org = $(this).parent().children('ul')[0].id;
						location.hash = "org=" + $(this).parent().children('ul')[0].id;
						_ee.emit('getOrgMain');
					}
				}
			}
		});

		$(".lnb-sub > li > a").on('click', function(){
			var space = $(this).parent('li')[0].id
			var org = $(this).parent('li').parent('ul')[0].id

			if(location.pathname != '/space_main'){
				location.href = "/space_main#space=" + space;
			}
			else{
				$("#" + space).parent().find('a').removeClass();
				$("#" + space + " > a").addClass('selected');
				var hash = "#space=" + space;
				location.hash = hash;
				_global.hash.org = org;
				_global.hash.space = space;
			}
		});

	});

	_ee.on('setLnbMenu', function(){

		if(location.pathname == '/'){
			return;
		}
		else{
			pumpkin.execute(['getOrgList', 'getSpaceList'], function(orgList){
				if($('#orgList ul > li:first').length == 0){
					$('.org-container').html('<div class="alert alert-warning">no spaces.</div>');
				}

				_ee.emit('regOrgMenuEvent');
				_ee.emit("setLnbInfo");
				_ee.emit('setExpendLnb');
			});
		}
	});

	// 현재 Focus된 org 메뉴 자동 확장
	_ee.on('setExpendLnb', function(){

		if(!location.hash && !_global.hash.org){
			var lnbList = $("#lnb_items").children('li');
			// 2017-10-16 JJH - ORG가 없는경우 null값 처리
			if(lnbList && lnbList[0].item && lnbList[0].item.metadata && lnbList[0].item.metadata.guid){
				_global.hash.org = lnbList[0].item.metadata.guid;
				location.hash = "#org=" + _global.hash.org;
			}
		}

		// Org menu 펼침
		if(_global.hash.org){
			var orgLiId =  $("#orgLi_" + _global.hash.org);
			if(orgLiId.hasClass('expandable')){
				orgLiId.find('.lnb-sub').slideToggle();
				orgLiId.find('.lnb-sub__only').slideToggle();
				orgLiId.toggleClass('expanded');
				orgLiId.find(" > a").toggleClass('selected');
			};
		}

		// Org 하위 space 선택
		if(_global.hash.space){
			if(!$("#" + _global.hash.space + " > a").hasClass('selected')){
				$("#" + _global.hash.space + " > a").toggleClass('selected');
			}
		}

		// Domain, Members 선택
		var urlPath = location.pathname.replace("/", "");
		if(urlPath == "domains"){
			var domainDom =  $("#orgLi_" + _global.hash.org).find('div').get(0);
			$(domainDom).find('>a').addClass("selected");
		}
		else if(urlPath == "members"){
			var memberDom =  $("#orgLi_" + _global.hash.org).find('div').get(1);
			$(memberDom).find('>a').addClass("selected");
		}

		_ee.emit('setPageNavi', _global.hash.org, _global.hash.space);
	});

	_ee.on("setLnbInfo", function(){
		if(location.hash){
			var hashLnbInfos = location.hash.split('&');

			if(hashLnbInfos != null && hashLnbInfos.length > 0){
				for(var i=0; i<hashLnbInfos.length; i++){
					var lnbInfo = hashLnbInfos[i];
					lnbInfo = lnbInfo.replace("#", "").trim();

					var items = lnbInfo.split("=");
					if(items && items.length){
						if(items[0] == "org"){
							_global.hash.org = items[1];
						}
						else if(items[0] == "space"){
							_global.hash.space = items[1];
							var org = $("#" + _global.hash.space)[0].item.organization.metadata.guid;
							if(!_global.hash.org || (org && org != _global.hash.org)){
								_global.hash.org = org;
							}
						}
						else if(items[0] == "apps"){
							_global.hash.apps = items[1];
						}
					}
				}
			}
		}
	})

	$(document).ready(function(){
		_ee.emit('setLnbMenu');
	});

})();
