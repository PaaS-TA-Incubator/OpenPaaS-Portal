/**
 * Space Global Function
 * 2017-05-20
 */
(function(){
	_ee.on('setSpaceName', function(space){
		var that = this;
		var url = '/v2/spaces/' + space + '/summary';
		
		CF.async({url : url, method : 'get'}, function(result){
			if(result){
				$("#spaceName").text(result.name);
			}
		});
	});
	
})();