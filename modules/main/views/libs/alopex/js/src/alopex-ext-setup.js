//Multi-select 컴포넌트

$a.setup({
    defaultComponentClass: {
    	multiSelect: 'MultiSelect', multiselect: 'Multiselect',
    	splitter: 'Splitter',
    	fileUpload: 'FileUpload',
    	fileupload: 'Fileupload'
    }
});

$a.widget.multiSelect = $a.widget.multiselect = $a.inherit($a.widget.object, {
	widgetName: 'multiSelect',
	setters: ['multipleselect', 'refresh'],
	getters: ['isOpen', 'getChecked', 'getButton', 'widget', 'getMultiselectButton'],

	properties: {
	  multiple: true,
	  noneSelectedText: "선택하세요",
	  header: true,
	  minWidth: 180,
	  menuWidth:null,
	  selectedList: 2,
	  checkAllText: '전체선택',
	  uncheckAllText: '전체해제',
	  selectedText: '#개 선택됨',
	  classes: 'MultiSelect',
	  filter: true,
	  label: '필터',
	  placeholder: '검색어를 입력하세요',
	  checkedheader:true,
	  htmlBind: true	//2016-12-06: .html을 사용해서 특수문자가 깨지는 현상에 대한 option처리.(https://nexcore.skcc.com/support/issues/3377) 이 경우 span에 <b>test</b> 와 같은 형태를 bind할 수 없음.
	},

	init: function(el, options) { // 새로운 컴포넌트의 동작이나 마크업등을 설정하는 부분입니다. 사용자는 $el을 이용하여 커스텀하게 마크업, 스타일등을 만들어낼 수 있습니다.
		  var $el = $(el);
		  $el.attr('multiple', 'multiple');
		  el.opts = $.extend(true, {}, this.properties, options);
		  if (el.opts.filter){
			  $el.multiselect(el.opts).multiselectfilter(el.opts);
		  } else{
			  $el.multiselect(el.opts);
		  }

		  el.button = $(el).next('button.ui-multiselect')[0];
		  return;
	},
	refresh: function(el) {
		  $(el).multiselect('refresh');
	},
	getMultiselectButton: function(el) {
		return el.button;
	}
});

//splitter_panel
$a.widget.splitter = $a.inherit($a.widget.object, {
	widgetName: 'splitter',
	properties: {
		position: '50%',
		limit: 10,
		orientation: 'horizontal'
	},
	init: function(el, options){
		var opts = $.extend(true, {}, this.properties, options);
		$(el).split({
		    orientation: opts.orientation,
		    limit: opts.limit,
		    position: opts.position
		});
	}
});


//file upload
$a.widget.fileUpload = $a.widget.fileupload = $a.inherit($a.widget.object, {
	widgetName: 'fileUpload',
	properties: {
		url : '',
		fileName : 'uploadFiles',
		multiple : true,
		dragDrop:false,
		dragdropWidth : '100%',
		allowDuplicates : false,
		showQueueDiv : false,
		sequential : true,
		sequentialCount : 1,
		autoSubmit : false,
		showCancel : true,
		showDone : true,
		showDelete: true,
		showDownload:true,
		showAbort : true,
		showPreview : true,
		//allowedTypes : "jpg,png,gif",
		//acceptFiles : "image/",
		dragDropStr : "<div class='fileupload-box'>여기에 파일을 끌어다 놓으세요</div>",
		multiDragErrorStr: "멀티 파일 Drag &amp; Drop 실패입니다.",
		duplicateErrorStr: "이미 존재하는 파일입니다.",
		extErrorStr:"허용되지 않는 확장자입니다.허용되는 확장자 : ",
		sizeErrorStr:"허용 파일 용량을 초과하였습니다. 최대 파일 용량 : ",
		maxFileCountErrorStr: "허용 파일 갯수를 초과하였습니다. 최대 파일 갯수 : ",
		uploadErrorStr:"업로드가 실패하였습니다.",
		uploadStr: '파일 추가',
		checkAllStr : '전체 선택',
		unCheckAllStr : '전체 해제',
		checkedDeleteStr : '선택 삭제',
		abortButtonClass: "Button",
		cancelButtonClass: "Button",
		uploadButtonClass: "Button",

		showFileCounter : false,
		showStatusAfterSuccess : true,
		onSelect : function(files){

		},
		onSuccess:function(files,data,xhr,pd)
		{

		},

	    selecttype : "basic"
	},
	setters: ['fileUpload', 'setOptions','startUpload','stopUpload','cancelAll','checkAll','unCheckAll','checkDelete','removeElement'],
	getters: ['getFileCount','getResponses'],
	init: function(el, options){

		var opts = $.extend(true, {}, this.properties, options);
		var varId ="output"+(new Date().getTime());
		var prvCon='';
		if (opts.selecttype== 'basic'){
			opts.dragDrop =false;
			opts.maxFileCount = 1;
			opts.multiple = false;
			opts.showDelete = false;
			opts.showDownload = false;
			opts.showPreview = false;
			opts.showProgress = false;
			opts.showFileCounter = false;

			opts.customProgressBar= function(obj,s)
			{
				this.statusbar = $("<div></div>");
				this.filename = $("<span class='onefile-text'></span>").appendTo(this.statusbar);
				var progressBox = $("<span></span>").appendTo(this.statusbar);
				this.progressDiv = $("<span>").appendTo(progressBox).hide();
				this.progressbar = $("<span>").appendTo(this.progressDiv);
				var btnBox = $("<div class='onefile-button'></div>").appendTo(this.statusbar);
				this.abort = $("<button class='Button Onlyicon abort'><span class='Icon Pause' data-position='top'></span></button>").appendTo(btnBox).hide();
				this.cancel = $("<button class='Button Onlyicon cancel'><span class='Icon Remove' data-position='top'></span></button>").appendTo(btnBox).hide();
				this.done = $("<button class='Button Onlyicon done'><span class='Icon Ok' data-position='top'></span></button>").appendTo(btnBox).hide();
				this.download = $("<button class='Button Onlyicon download'><span class='Icon Download' data-position='top'></span></button>").appendTo(btnBox).hide();
				this.del = $("<button class='Button Onlyicon del'><span class='Icon Trash' data-position='top'></span></button>").appendTo(btnBox).hide();
				$a.convert(this.statusbar);
				return this;
			}
			prvCon += '<div id="'+varId +'" class="onefile"></div>'
			$(el).after(prvCon);
		    opts.showQueueDiv=varId;
		    $(el).addClass("file-oneupload")

		} else{


			opts.customProgressBar= function(obj,s)
			{

				this.statusbar = $("<div class='preview-list'></div>");
				var contentBox = $("<div class='preview-contents'></div>").appendTo(this.statusbar);
				var fileBox = $("<div class='preview-title'></div>").appendTo(contentBox);
				var iCheckBox = $("<label class='ImageCheckbox'></label>").appendTo(fileBox)
				var checkbox = $("<input class='Checkbox'  type='checkbox' name='fileSelect"+varId+"'>").appendTo(iCheckBox);
				//this.preview = $("<img />").width(s.previewWidth).height(s.previewHeight).appendTo(fileBox).hide();
				this.preview = $("<img class='preview-img'/>").appendTo(iCheckBox).hide();

				this.filename = $("<span class='multifile-text'></span>").appendTo(fileBox);
				var progressBox = $("<div class='preview-progress'></div>").appendTo(contentBox);
				this.progressDiv = $("<div class='Progressbar'>").appendTo(progressBox).hide();
				this.progressbar = $("<div style='position: relative; left: 0px; height: 8px; border: 0px none rgb(0, 0, 0);'></div>").appendTo(this.progressDiv);
				var btnBox = $("<div class='preview-btn'></div>").appendTo(contentBox);
				this.abort = $("<button class='Button Onlyicon abort'><span class='Icon Pause' data-position='top'></span></button>").appendTo(btnBox).hide();
				this.cancel = $("<button class='Button Onlyicon cancel'><span class='Icon Remove' data-position='top'></span></button>").appendTo(btnBox).hide();
				this.done = $("<button class='Button Onlyicon done'><span class='Icon Ok' data-position='top'></span></button>").appendTo(btnBox).hide();
                this.download = $("<button class='Button Onlyicon download'><span class='Icon Download-alt' data-position='top'></span></button>").appendTo(btnBox).hide();
				this.del = $("<button class='Button Onlyicon del'><span class='Icon Trash' data-position='top'></span></button>").appendTo(btnBox).hide();
				$a.convert(this.statusbar);
				return this;
			}
			prvCon += '<div id="'+varId +'" class="preview-container"></div>'
			$(el).after(prvCon);
		    opts.showQueueDiv=varId;
		    opts.multiple = true;
		}
		el.uploadObj=$(el).uploadFile(opts);


	},
	setOptions: function(el, options) {
		el.uploadObj.update(options);
	},



	startUpload: function(el) {
		el.uploadObj.startUpload();
	},
	stopUpload: function(el) {
		el.uploadObj.stopUpload();
	},
	cancelAll: function(el) {
		el.uploadObj.cancelAll();
	},
	getFileCount : function(el){
		return el.uploadObj.getFileCount();
	},

	removeElement : function(el){
		el.uploadObj.remove();
	},
	getResponses : function(el){
		return el.uploadObj.getResponses();
	}
});
