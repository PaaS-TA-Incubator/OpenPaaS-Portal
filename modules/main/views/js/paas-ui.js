$(document).ready(function(){	
	//left sub menu toggle
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
});
