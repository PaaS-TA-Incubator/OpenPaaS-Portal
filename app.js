process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; //Disables HTTPS / SSL / TLS checking across entire node.js environment.

/**
 * import modules
 */
var express = require('express');
var bodyParser = require("body-parser");
var methodOverride = require('method-override');
var session = require('express-session');

global._config = {
	systemDomain : '',
	endpoint: {},
	redisDashboard: '',
	redis : {},
	loggingDashboard : '',
	monitoringUrl : ''
};

var vcapServices = process.env.VCAP_SERVICES;
if(vcapServices)
{
	vcapServices = JSON.parse(vcapServices);
	var redisService = vcapServices[process.env.REDIS_SERVICE_NAME];
	if(redisService){
		var credentials = redisService[0].credentials;
		_config.redis.host = credentials.host;
		_config.redis.port = credentials.port;
		_config.redis.password = credentials.password;
	}
}

/*
 * Environment Variables
 */
/* Systems */
if(process.env.USE_HTTPS)
	_config.usehttps = process.env.USE_HTTPS;
if(process.env.SYSTEM_DOMAIN)
	_config.systemDomain = process.env.SYSTEM_DOMAIN;
if(process.env.PORTAL_CLIENT)
	_config.portalClient = process.env.PORTAL_CLIENT;
/* Brand */
if(process.env.BRAND)
	_config.brand = process.env.BRAND;
if(process.env.COPYRIGHT)
	_config.copyright = process.env.COPYRIGHT;
/* Add-on Menus */
if(process.env.DOCS_URL)
	_config.docsUrl = process.env.DOCS_URL;
if(process.env.SUPPORT_URL)
	_config.supportUrl = process.env.SUPPORT_URL;
if(process.env.NOTICE_URL)
	_config.noticeUrl = process.env.NOTICE_URL;
if(process.env.NOTIFICATION_ENDPOINT)
	_config.notificationEndpoint = process.env.NOTIFICATION_ENDPOINT;
if(process.env.STATUS_URL)
	_config.statusUrl = process.env.STATUS_URL;
if(process.env.MONITORING_URL)
	_config.monitoringUrl = process.env.MONITORING_URL;
if(process.env.BILLING_REPORT_URL)
	_config.billingReportUrl = process.env.BILLING_REPORT_URL;
if(process.env.LOGGING_DASHBOARD)
	_config.loggingDashboard = process.env.LOGGING_DASHBOARD;
/* Services */
if(process.env.AUTOSCALER_SERVICE_NAME)
	_config.autoscalerServiceName = process.env.AUTOSCALER_SERVICE_NAME;
if(process.env.AUTOSCALER_DASHBOARD)
	_config.autoscalerDashboard = process.env.AUTOSCALER_DASHBOARD;
if(process.env.APP_AUTOSCALER_DASHBOARD)
	_config.appAutoscalerDashboard = process.env.APP_AUTOSCALER_DASHBOARD;
if(process.env.REDIS_SERVICE_NAME)
	_config.redisServiceName = process.env.REDIS_SERVICE_NAME;
if(process.env.REDIS_DASHBOARD)
	_config.redisDashboard = process.env.REDIS_DASHBOARD;
if(process.env.SWIFT_SERVICE_NAME)
	_config.swiftServiceName = process.env.SWIFT_SERVICE_NAME;
if(process.env.SWIFT_DASHBOARD)
	_config.swiftDashboard = process.env.SWIFT_DASHBOARD;
/* SMTP */
if(process.env.SMTP_USERNAME)
	_config.smtps.username = process.env.SMTP_USERNAME;
if(process.env.SMTP_PASSWORD)
	_config.smtps.password = process.env.SMTP_PASSWORD;
if(process.env.SMTP_HOST)
	_config.smtps.host = process.env.SMTP_HOST;
if(process.env.SMTP_SUBJECT)
	_config.smtps.subject = process.env.SMTP_SUBJECT;

if (_config.systemDomain) {
	_config.endpoint.api = "https://api." + _config.systemDomain;
	_config.endpoint.authorization = "https://login." + _config.systemDomain;
	_config.endpoint.logging = "wss://doppler." + _config.systemDomain + ":443";
} else {
	console.log('============ portal configuration exception ============');
	console.log('[Error] SYSTEM_DOMAIN is not found.');
	console.log('========================================================');
	return;
}

/**
 * set global variables
 */
global._path =
{
	home : __dirname,
	modules : __dirname + "/modules",
	libs : __dirname + "/libs"
};

global._redis = null;

//console.log = function(){};
//console.error = function(){};

/**
 * set process options
 */
/**
 * create express and imp
 */
var app = global._app = express();
var http = require('http').Server(app);
var server = http.listen(process.env.PORT || 3000, function()
{
	console.log('Listening on port %d', server.address().port);
});

/**
 * set template engine.
 */
var imp = require('nodejs-imp');
imp.setPattern(_path.modules + "/main/views/template/{{name}}.html");
imp.setPattern(_path.modules + "/{{prefix}}/views/template/{{name}}.html", "[a-z0-9\-\_]*");

var Renderer = require(_path.libs + "/Renderer");
imp.addRenderModule(Renderer.replacePath);

/**
 * set static dirs
 */
app.use('/modules', express.static(_path.modules));

/**
 * set middleware
 */
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function(req, res, next)
{
	if(_config.usehttps && req.protocol == 'http')
		res.redirect('https://' + req.headers.host);
	else
		next();
});

/**
 * set RedisStore
 */
if(_config.redis && _config.redis.host && _config.redis.port)
{
	var RedisStore = require('connect-redis')(session);
	//var redis = require("redis").createClient({host : '10.250.64.199', port : 6379});
	var redis = require("redis");
	var client = require("redis").createClient(_config.redis);

	client.on('connect', function()
	{
		console.log('connected to redis!!');
		global._redis = client;
	});

	app.use(session({
		store : new RedisStore({
			client : client
		}),
		secret : 'cf portal',
		saveUninitialized : true,
		resave : false,
		cookie : {
			expires : new Date(Date.now() + 1000 * 60 * 30), // 1000(ms) * 60 * 30 = 30min
			maxAge : 1000 * 60 * 30
		}
	}));
}
else{
	global._redis = null;
	app.use(session({
		secret : 'halloween',
		resave : true,
		saveUninitialized : true,
		cookie : {
			expires : new Date(Date.now() + 1000 * 60 * 30),
			maxAge : 1000 * 60 * 30
		}
	}));
}

app.use(methodOverride());
app.use(imp.render);

app.use(function(req, res, next) {
	if (!req.session){
		req.session = {
			cfdata : {}
		};
	}
	next();
});

/**
 * error handling
 */
app.use(function(err, req, res, next)
{
	console.error("=================================================");
	console.error("time : " + new Date().toString());
	console.error("name : Exception");
	console.error("-------------------------------------------------");
	console.error(err.stack);
	console.error("=================================================");

	res.statusCode = 500;
	res.send(err.stack);
});

process.on('uncaughtException', function (err)
{
	console.error("\n\n");
	console.error("=================================================");
	console.error("time : " + new Date().toString());
	console.error("name : UncaughtException");
	console.error("-------------------------------------------------");
	console.error(err.stack);
	console.error("=================================================\n\n");
});

var BinderLoader = require(_path.libs + "/BinderLoader");
BinderLoader.load(_path.modules);

imp.setBinderModules(BinderLoader.modules);

var routerLoader = require(_path.libs + "/RouterLoader");
routerLoader(_path.modules);
