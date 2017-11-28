var request = require('request');
var uuid = require('node-uuid');
var async = require('async');
var uuid = require('node-uuid');
var nodeExcel = require('excel-export');

var CFClient = require('../../lib/CFClient');

module.exports = function(app) {
	var sockets = {};

	app.get('/excel_export', function(req, res, next){
		try{
			var confs = [];

		  	var excelDataListStr = req.query.excelDataList;
		  	var excelDataList = JSON.parse(excelDataListStr);

		  	for(var key in excelDataList){
		  		var rowList = [];
		  		var space = excelDataList[key];
		  		var conf ={};
		  		conf.stylesXmlFile = "excel_styles.xml";

		  		if(key == "total"){
			  		conf.name = key;
				  	conf.cols = [{
						caption:'Usage Charge Name',
				        type:'string',
				        width:160
					},{
						caption:'Total',
						 type:'number'
				  	}];

				  	console.log(key + " : " + typeof space);
				  	if(typeof space == 'array'){
				  		for(var j=0; j<space.length; j++){
				  			var item = [];
				  			var appItem = space[j];
				  			var usageValue = Number(appItem.totCharge);
				  			item.push(appItem.name);
				  			item.push(usageValue.toFixed(2));
				  			rowList.push(item);
				  		}
				  		conf.rows = rowList;
				  		confs.push(conf);
				  	}
				  	else{
				  		for(var key in space){
				  			var item = [];
				  			var appItem = space[key];
				  			var usageValue = Number(appItem.totCharge);
				  			item.push(appItem.name);
				  			item.push(usageValue.toFixed(2));
				  			rowList.push(item);
				  		}
				  		conf.rows = rowList;
				  		confs.push(conf);
				  	}
		  		}
		  		else{
		  			conf.name = key;
				  	conf.cols = [{
						caption:'App Name',
				        type:'string',
				        width:250
					},{
						caption:'State',
						type:'string',
						width:80
					},{
						caption:'Instances',
						type:'number'
					},{
						caption:'Memory',
						 type:'number'
				  	},{
						caption:'Usage',
						 type:'number'
				  	}];

				  	var appList = space.app_usage_arr;
				  	var spaceSum = 0;
				  	console.log(key + " : " + typeof appList);
				  	if(typeof appList == 'array'){
				  		for(var j=0; j<appList.length; j++){
				  			var item = [];
				  			var appItem = appList[j];
				  			var usageValue = Number(appItem.app_usage.toFixed(2));
				  			item.push(appItem.app_name);
				  			item.push((appItem.app_state ? appItem.app_state : (appItem.app_name == "CF_DELETED_APP" ? "DELETE" :  "UnKnown")));
				  			item.push(appItem.app_instance);
				  			item.push(appItem.app_memory);
				  			item.push(usageValue);
				  			spaceSum += usageValue;
				  			rowList.push(item);
				  		}
				  	}
				  	else{
				  		for(var key in appList){
				  			var item = [];
				  			var appItem = appList[key];
				  			var usageValue = Number(appItem.app_usage.toFixed(2));
				  			item.push(appItem.app_name);
				  			item.push((appItem.app_state ? appItem.app_state : (appItem.app_name == "CF_DELETED_APP" ? "DELETE" :  "UnKnown")));
				  			item.push(appItem.app_instance);
				  			item.push(appItem.app_memory);
				  			item.push(usageValue);
				  			spaceSum += usageValue;
				  			rowList.push(item);
				  		}
				  	}

				  	// space summary
				  	var item = [];
				  	var usageValue = Number(spaceSum);
				  	item.push("Space Summary");
				  	item.push("");
				  	item.push("");
				  	item.push("");
				  	item.push(usageValue.toFixed(2));
				  	rowList.push(item);

				  	conf.rows = rowList;
				  	confs.push(conf);
		  		}
		  	}

		  	var result = nodeExcel.execute(confs);

		  	// excel 파일 생성
		  	var fs = require('fs');
		  	var mime = require('mime');

			var fileName = "excel_export.xlsx";
		  	var mimeType = mime.lookup(result);

			res.setHeader('Content-Type', mimeType);
		  	res.setHeader("Content-Disposition", "attachment; filename=" + fileName);
		  	res.end(result, 'binary');
		}
		catch(err){
			var returnVal = {};
			returnVal.code = "error";
			returnVal.message = err.message;
			res.end(returnVal);
		}
	});

	app.post('/billing_report', function(req, res, next) {
		var cf = new CFClient(req.session.cfdata);
		var url = _config.billingReportUrl + req.body.url;

		if (!url) {
			res.status(500).send({
				error : 'Url is undefind'
			});
			return;
		}

		var param = {};
		param.url = url;
		param.method = 'GET';
		console.log("-----------------------------------------------------------------------------------------------------------------");
		console.log("url = " + param.url);

		request(param, function(err, response, data) {
			try {
				if (typeof data == 'object'){
					data = JSON.stringify(data);
				}
				req.session.cfdata = cf.getData();
				console.log("data = " + data);
				res.end(data);
			} catch (err) {
				console.log("Err = " + err);
				res.status(500).send({
					error : err
				});
			}
		}, function(code, error) {
			console.log("Error = " + error);
			res.status(code).send({
				error : error
			});
		});
	});

	app.post('/create_dashboard_link', function(req, res, next) {
		if (req.body.type == 'autoscalerDashboard') {
			res.end(_config.autoscalerDashboard + '?appId=' + req.body.credentials.appId + '&appName=' + req.body.credentials.appName + '&endpoint=' + req.body.credentials.api_url + '&username=' + req.session.cfdata.username);
		}
		else if(req.body.type == 'appAutoscalerDashboard'){
			res.end(_config.appAutoscalerDashboard + '?appId=' + req.body.credentials.appId + '&appName=' + req.body.credentials.appName + '&username=' + req.session.cfdata.username);
		}
		else {
			var url = _config[req.body.type];
			// if (!url) {
			// 	res.status(404).end('dashboard_url not found.');
			// 	return;
			// }

			if (url.lastIndexOf('/') != url.length - 1)
				url += '/';

			if (!req.session.tokens)
				req.session.tokens = {};

			var secret = uuid.v4();

			if (req.session.tokens[req.body.credentials.password]) {
				secret = req.session.tokens[req.body.credentials.password];
			} else {
				req.session.tokens[req.body.credentials.password] = {
					secret : secret
				};
			}

			var param = {};
			param.url = url + 'token';
			param.method = 'post';
			param.form = {
				secret : secret,
				credentials : req.body.credentials
			};

			request(param, function(err, response, body) {
				if (err) {

				} else {
					if (response.statusCode != 200) {
						res.status(response.statusCode).end('Cannnot found /token');
					} else {
						var token = body;
						res.end(url + '?token=' + token);
					}
				}
			});
		}
	});

	var clean = function(data) {
		data = data.split('\n\n');
		if (data.length > 1) {
			data.splice(0, 1);
		}
		var length = data.length;
		for (var i = 0; i < length; i++) {
			var value = data[i];
			value = value.substr(2, value.length - 1);
			var end = value.indexOf(String.fromCharCode(16));
			data[i] = value.substr(0, end);
		}
		return data.join('\n\n');
	};

	app.post('/cf_logs_tail', function(req, res, next) {
		var cf = new CFClient(req.session.cfdata);
		if (!cf.isLogin()) {
			res.statusCode = 302;
			res.end('signin');
			return;
		}

		var url = req.body.url;
		if (!url) {
			res.status(500).send({
				error : 'Url is undefind'
			});
			return;
		}

		if (!req.session.tailLogs)
			req.session.tailLogs = {};

		cf.getTailLog(url, function(socket) {
			var socketId = uuid.v4();

			sockets[socketId] = socket;
			req.session.tailLogs[socketId] = [];
			socket.on('open', function() {
				console.log('log socket connected');
			});
			socket.on('close', function() {
				console.log('log socket disconnected');
				sockets[socketId] = null;
			});
			socket.on('message', function(data) {
				req.session.tailLogs[socketId].push(clean(data.toString()));
				console.log("들어가고 있는데 : ", req.session.tailLogs[socketId]);
			});
			socket.on('error', function() {
				sockets[socketId] = null;
				req.session.tailLogs[socketId].push('-- socket error' + JSON.stringify(arguments));
				console.log("에러 : ", arguments);
			});

			res.end(socketId);
		}, function(error) {
			console.log(error);
			res.status(500).send({
				error : error
			});
		});
	});

	app.get('/logging_dashboard', function(req, res, next) {
		var url = _config.loggingDashboard;

		if (url.lastIndexOf('/') != url.length - 1)
			url += '/';

		var secret = uuid.v4();
		var appId = req.query.appId;

		if (!req.session.tokens)
			req.session.tokens = {};

		var secret = uuid.v4();

		var param = {};
		param.url = url + 'token';
		param.method = 'post';
		param.form = {
			secret : secret,
			appId : appId
		};

		request(param, function(err, response, body) {
			if (err) {
			} else {
				if (response.statusCode != 200) {
					res.status(response.statusCode).end('Cannnot found /token');
				} else {
					var token = body;
					res.end(url + '?token=' + token + '&appId=' + appId);
				}
			}
		});
	});

	app.get('/get_cf_logs_tail', function(req, res, next) {
		var socketId = req.query.socketId;
		if (req.session.tailLogs[socketId]) {
			var log = req.session.tailLogs[socketId];
			req.session.tailLogs[socketId] = [];
			res.send(log);
		} else {
			res.end();
		}
	});

	app.post('/cf_logs_tail_close', function(req, res, next) {
		var socketId = req.body.socketId;
		if (sockets && sockets[socketId]) {
			sockets[socketId].close();
			delete sockets[socketId];
		}

		res.end();
	});

	app.post('/get_dashboard_credentials', function(req, res, next) {
		var token = req.body.token;
		for ( var key in req.session.dashboard) {
			if (req.session.dashboard[key].token == token) {
				res.send(req.session.dashboard[key]);
				break;
			}
		}
	});

    // Sign-out
	app.get('/signout.do', function(req, res, next) {
	    // Session 제거
		req.session.destroy();
		// UAA Login 서버의 logout.do URL로 Redirection
		res.redirect(_config.endpoint.authorization + '/logout.do?redirect=http%3A%2F%2F' + req.headers.host);
	});

	app.get('/registration/:id', function(req, res, next) {
		var password = req.params.id;

		if (req.session && req.session.registration) {
			var cf = new CFClient(req.session.cfdata);
			cf.oldPassword = password;
			var data = req.session.registration[password];
			if (data)
				res.render('layout', {
					1 : 'signup_for_invite',
					id : data.id,
					username : data.username
				});
			else
				res.redirect('/expired');
		} else {
			res.redirect('/expired');
		}
	});

	app.get('/:type(signin|signup|expired)', function(req, res, next) {
		if (!req.session)
			req.session = {};

		if (!req.session.cfdata)
			req.session.cfdata = {};

		var cf = new CFClient(req.session.cfdata);
		if (cf.isLogin()) {
			res.redirect('/org_main');
		} else {
			rendering(req, res);
		}
	});

	// 모든 GET 호출에 대하여 Login 상태인지 확인한 후 Rendering
	app.get('/*', function(req, res, next) {
		if (!req.session)
			req.session = {};

		if (!req.session.cfdata)
			req.session.cfdata = {};

		var cf = new CFClient(req.session.cfdata);
		var path = req.path;

		if (path == '/login') {
			if (cf.isLogin()) {
				var goto = function(result) {
					if (result) {
						res.redirect('/org_main');
						return;
					} else {
						res.redirect('/notice');
						return;
					}
				};
				var error = function(err) {
					res.redirect(_config.endpoint.authorization + '/logout.do?redirect=http%3A%2F%2F' + req.headers.host);
					return;
				};
				cf.getOrg(goto, error);
				return;
			} else {
				var authCode = req.query.code;
				var done = function(result) {
	                req.session.cfdata = cf.getData();
				    var goto = function(result) {
						if (result) {
							res.redirect('/org_main');
							return;
						} else {
							res.redirect('/notice');
							return;
						}
					};
					var error = function(err) {
						res.redirect(_config.endpoint.authorization + '/logout.do?redirect=http%3A%2F%2F' + req.headers.host);
						return;
					};
					cf.getOrg(goto, error);
					return;
				};
				var error = function(err) {
					res.redirect(_config.endpoint.authorization + '/logout.do?redirect=http%3A%2F%2F' + req.headers.host);
					return;
				};
				cf.getAuthInfo(req, authCode, done, error);
			}
		} else {
			if (path == '/') {
				if (cf.isLogin()) {
				    var goto = function(result) {
						if (result) {
							res.redirect('/org_main');
							return;
						} else {
							res.redirect('/notice');
							return;
						}
					};
					cf.getOrg(goto);
					return;
				} else {
					res.redirect(_config.endpoint.authorization+'/oauth/authorize?response_type=code&client_id=' + _config.portalClientId + '&redirect_uri=http%3A%2F%2F' + req.headers.host + '%2Flogin');
					return;
				}
			}
			if (path.match(/^\/[a-z0-9\-\_\/]*$/)) {
				if (cf.isLogin() || path.indexOf('download') != -1) {
					rendering(req, res);
				} else {
					res.redirect(_config.endpoint.authorization + '/logout.do?redirect=http%3A%2F%2F' + req.headers.host);
					return;
				}
			} else {
				next();
			}
		}
	});

	app.post('/cf/users', function(req, res, next) {
		var url = req.body.url;
		var method = req.body.method;
		var headers = req.body.headers;
		var data = req.body.data;

		var client = new CFClient({
			endpoint : req.session.cfdata.endpoint
		});
		client.setUserInfo(_config.admin.username, _config.admin.password);
		client.login(function() {
			client.users(url, method, headers, data, function(result) {
				if (result)
					res.send(result);
			}, function(err) {
				res.send({
					error : err
				});
			});
		}, function(err) {
			res.send({
				error : err
			});
		});
	});

	app.post('/cf/signin', function(req, res, next) {
		var cf = new CFClient(req.session.cfdata);
		if (cf.isLogin()) {
			res.redirect('/org_main');
		} else {
			var username = req.body.id;
			var password = req.body.password;

			cf.oldPassword = password;

			cf.setUserInfo(username, password);

			var done = function(result) {
				req.session.cfdata = cf.getData();
				res.send({});
			};

			var err = function(err) {
				console.error('Error: ', err);
				res.status(500).send({
					error : err
				});
			};

			cf.login(done, err);
		}
	});

	app.post('/cf', function(req, res, next) {
		var cf = new CFClient(req.session.cfdata);
		if (!cf.isLogin()) {
			res.statusCode = 302;
			res.end('signin');
			return;
		}

		var url = req.body.url;
		if (!url) {
			res.status(500).send({
				error : 'Url is undefind'
			});
			return;
		}
		var method = req.body.method;
		var headers = req.body.headers;
		var data = req.body.form;

		cf.request(url, method, headers, data, function(data) {
			try {
				if (typeof data == 'object')
					data = JSON.stringify(data);

				req.session.cfdata = cf.getData();
				res.end(data);
			} catch (err) {
				console.log(err);
				res.status(500).send({
					error : err
				});
			}
		}, function(code, error) {
			res.status(code).send({
				error : error
			});
		});
	});

	app.post("/noti/inquiry", function(req, res, next) {
		var param = {
                method: 'GET',
                url: _config.notificationEndpoint + "%20AND%20" + "lastmodified>" + encodeURIComponent('"' + req.body.options.lastmodified + '"'),
                json: true
            		};
    request(param, function(err, response, body) {
    	if(err) {
				console.log(err);
    		res.status(err.code).end(JSON.stringify(err.message));
      }
    	if(response.statusCode == 200 || response.statusCode == 204) {
    		res.send(body.results);
    	}
    });
	});
};

var rendering = function(req, res) {
	var split = req.path.split('/');

	var param = {};
	param['1'] = 'index';

	/* User */
	param.username = req.session.cfdata.username;
	if (req.session.cfdata.uaaToken) {
		param.accessToken = req.session.cfdata.uaaToken.access_token;
		param.loggingEndpoint = req.session.cfdata.endpoint.logging;
	}
	/* Systems */
	param.host = req.headers.host;
	param.endpoint = _config.endpoint;
	/* Brand */
	param.brand = _config.brand;
	param.copyright = _config.copyright;
	/* Add-on Menus */
	if (_config.docsUrl) {
		param.docsUrl = _config.docsUrl;
	} else {
		param.docsUrl = 'disabled';
	}
	if (_config.supportUrl) {
		param.supportUrl = _config.supportUrl;
	} else {
		param.supportUrl = 'disabled';
	}
	if (_config.noticeUrl) {
		param.noticeUrl = _config.noticeUrl;
	} else {
		param.noticeUrl = 'disabled';
	}
	param.notificationEndpoint = _config.notificationEndpoint;
	if (_config.statusUrl) {
		param.statusUrl = _config.statusUrl;
	} else {
		param.statusUrl = 'disabled';
	}
	param.monitoringUrl = _config.monitoringUrl + '/login/generic_oauth';
	if (_config.loggingDashboard) {
		param.loggingDashboard = _config.loggingDashboard;
	} else {
		param.loggingDashboard = 'disabled';
	}
	/* Services */
	param.dashboards = '';
	if (_config.autoscalerDashboard) {
		param.autoscalerDashboard = _config.autoscalerDashboard;
		param.dashboards += _config.autoscalerServiceName;
	}
	if (_config.redisDashboard) {
		param.redisDashboard = _config.redisDashboard;
		param.dashboards += _config.redisServiceName;
	}
	if (_config.swiftDashboard) {
		param.swiftDashboard = _config.swiftDashboard;
		param.dashboards += _config.swiftServiceName;
	}
	param.billingReport = _config.billingReportUrl;

	for (var i = 1; i < split.length; i++) {
		if (split[i].trim()) {
			param[i] = split[i];
		}
	}

	res.render('layout', param);
};
