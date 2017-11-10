var request = require('request');
var WebSocket = require('ws');

var CFClient = function(data) {
	if (!data)
		data = {};
	this.uaaToken = data.uaaToken;
	this.username = data.username;
	this.userId = data.userId;
	this.endpoint = _config.endpoint;
};

CFClient.prototype.getData = function() {
	return {
		endpoint : this.endpoint,
		uaaToken : this.uaaToken,
		username : this.username,
		userId : this.userId
	};
};

CFClient.prototype.setUaaToken = function(token) {
	this.uaaToken = token;
};

CFClient.prototype.isLogin = function() {
	return this.uaaToken ? true : false;
};

CFClient.prototype.logout = function() {
	this.uaaToken = null;
	this.username = null;
};

CFClient.prototype.setUserInfo = function(username, password) {
	this.username = username;
	this.password = password;
};

CFClient.prototype.getUsers = function(done, error) {
	var param = {};
	param.url = this.endpoint.authorization + '/Users';
	param.method = 'get';
	param.headers = {};
	param.headers.Authorization = this.uaaToken.token_type + ' ' + this.uaaToken.access_token;

	request(param, function(err, response, body) {
		if (err) {
			console.log(err);
			if (error)
				error(err);
		} else {
			if (body) {
				body = JSON.parse(body);
				var resources = body.resources;
				for (var i = 0; i < resources.length; i++) {
					console.log(resources[i].userName, resources[i].id);
				}
			}
		}
	}.bind(this));
};

CFClient.prototype.getUser = function(email, done, error) {
	var param = {};
	param.url = this.endpoint.authorization + "/Users?filter=userName eq '" + email + "'";
	param.method = 'get';
	param.headers = {};
	param.headers.Authorization = this.uaaToken.token_type + ' ' + this.uaaToken.access_token;

	request(param, function(err, response, body) {
		if (err) {
			console.log(err);
			if (error)
				error(err);
		} else {
			if (body) {
				if (typeof body == 'object')
					done(body);
				else if (typeof body == 'string')
					done(JSON.parse(body));
			}
		}
	}.bind(this));
};

CFClient.prototype.deleteUser = function(id, done, error) {
	var param = {};
	param.url = this.endpoint.authorization + '/Users/' + id;
	param.method = 'DELETE';
	param.headers = {};
	param.headers.Authorization = this.uaaToken.token_type + ' ' + this.uaaToken.access_token;

	request(param, function(err, response, body) {
		if (err) {
			console.log(err);
			if (error)
				error(err);
		} else {
			done(body);
		}
	}.bind(this));
};

CFClient.prototype.changePassword = function(currentPassword, newPassword, done, error){
	var param = {};
	param.url = this.endpoint.authorization + '/Users/' + this.userId + '/password';
	param.method = 'put';
	param.headers = {};
	param.headers.Authorization = this.uaaToken.token_type + ' ' + this.uaaToken.access_token;
	param.json = {
		'oldPassword' : currentPassword,
		'password' : newPassword,
		'schemas' : ['urn:scim:schemas:core:1.0'
		]
	};

	request(param, function(err, response, body) {
		if (err) {
			console.log(err);
			if (error)
				error(err);
		} else {
			if (body) {
				done(body);
			}
		}
	}.bind(this));
};

CFClient.prototype.createUser = function(email, password, done, error) {
	var param = {};
	param.url = this.endpoint.authorization + '/Users';
	param.method = 'post';
	param.headers = {};
	param.headers.Authorization = this.uaaToken.token_type + ' ' + this.uaaToken.access_token;
	param.json = {
		'userName' : email,
		'emails' : [],
		'password' : password
	};

	param.json.emails.push({
		value : email
	});

	request(param, function(err, response, body) {
		if (err) {
			console.log(err);
			if (error)
				error(err);
		} else {
			if (body) {
				done(body);
			}
		}
	}.bind(this));
};

CFClient.prototype.inviteUser = function(done, error) {

	var param = {};
	param.url = this.endpoint.authorization + '/Groups';
	param.method = 'post';
	param.headers = {};
	param.headers.Authorization = this.uaaToken.token_type + ' ' + this.uaaToken.access_token;
	param.json = {
		'displayName' : 'scim.invite'
	};

	request(param, function(err, response, body) {
		if (err) {
			console.log(err);
			if (error)
				error(err);
		} else {
			if (body) {
				console.log('바디 : ', body);
			}
		}
	}.bind(this));
};

// CF API 호출
CFClient.prototype.request = function(url, method, headers, data, done, error) {
	if (!url) {
		error('URL is undefined.');
		return;
	}

	var param = {};
	if (url.indexOf('/stream') != -1 || url.indexOf('/recentlogs') != -1)
		param.url = this.endpoint.logging.replace('wss', 'https') + url;
	else
		param.url = this.endpoint.api + url;

	param.method = method ? method : 'GET';
	param.headers = {};

	for ( var key in headers)
		param.headers[key] = headers[key];

	param.headers.Authorization = this.uaaToken.token_type + ' ' + this.uaaToken.access_token;
	if (param.headers['Content-Type'] && param.headers['Content-Type'].indexOf('application/json') != -1)
		param.json = data;
	else if (data)
		param.form = JSON.stringify(data);

	request(param, function(err, response, body) {
		if (err) {
			if (error)
				error(err);
		} else if (response.statusCode == 404 || response.statusCode == 500) {
			error(response.statusCode, body);
		} else if (response.statusCode == 401) {
			if ((url.indexOf('/stream') != -1 || url.indexOf('/recentlogs') != -1) || (body && body.indexOf && (body.indexOf('CF-InvalidAuthToken') != -1 || body.indexOf('Invalid authorization') != -1))) {
				// Login이 풀린 경우(UAA 토큰 만료)
				this.login(function() {
					param.headers.Authorization = this.uaaToken.token_type + ' ' + this.uaaToken.access_token;
					request(param, function(err, response, body) {
						if (err) {
							if (error)
								error(response.statusCode || 500, err);
						} else if (response.statusCode == 404) {
							error(response.statusCode, body);
						} else {
							if (url.indexOf('/stream') != -1 || url.indexOf('/recentlogs') != -1) {
								done({
									code : response.statusCode,
									body : body
								});
							} else {
								done(body ? JSON.parse(body) : '');
							}
						}
					});
				}.bind(this), error);

				return;
			} else {
				error(response.statusCode, body);
			}
		} else {

			if (url.indexOf('/stream') != -1 || url.indexOf('/recentlogs') != -1) {
				done({
					code : response.statusCode,
					body : body
				});
			} else {
				if (typeof body == 'string')
					done(body ? JSON.parse(body) : '');
				else
					done(body);
			}
		}
	}.bind(this));
};

CFClient.prototype.getTailLog = function(url, done, error) {
	try {
		if (!url) {
			error('URL is undefined.');
			return;
		}

		var socket = new WebSocket(this.endpoint.logging + url, {
			headers : {
				'Authorization' : this.uaaToken.token_type + ' ' + this.uaaToken.access_token
			}
		});

		done(socket);
	} catch (err) {
		console.log(err);
		error(err);
	}
};

// 인증 정보 받기
CFClient.prototype.getAuthInfo = function(req, authCode, done, error) {
	// GET Parameter로 전달받은 Code로 API를 호출하여 Access Token 받기
	var param = {};
	var uaaToken = '';
	var authInfo = {};
	param.url = _config.endpoint.authorization +'/oauth/token';
	param.headers = {
		'Authorization' : 'Basic ' + _config.portalClient,
		'Accept' : 'application/json',
		'Content-type' : 'application/x-www-form-urlencoded'
	};
	param.method = 'POST';
	param.form = {
		grant_type : 'authorization_code',
		response_type : 'token',
		code : authCode,
		redirect_uri : 'http://' + req.headers.host + '/login'
	};
	request(param, function(err, response, body) {
		var data = JSON.parse(body);
		if (data.error) {
			error(data);
		} else {
			uaaToken = data.access_token;
			param = {};
			param.url = _config.endpoint.authorization +'/userinfo';
			param.headers = {
				'Authorization' : 'Bearer ' + uaaToken
			}
			request(param, function(err, response, body) {
				var info = JSON.parse(body);
				this.username = info.user_name;
				this.userId = info.user_id;
				this.uaaToken = data;
				if (_redis != null) {
					_redis.set('cfdata_' + this.username, JSON.stringify(data));
				}
				done();
			}.bind(this));
		}
	}.bind(this));
};

// 사용자에게 권한이 할당된 ORG가 있는지 확인
CFClient.prototype.getOrg = function(goto, error) {
	var param = {};
	param.url = _config.endpoint.api + '/v2/organizations';
	param.headers = {
		'Authorization' : 'Bearer ' + this.uaaToken.access_token
	}
	request(param, function(err, response, body) {
		var data = JSON.parse(body);
		if (data.error_code) {
			error(data);
		} else {
			var orgs = data.total_results;
			goto(orgs);
		}
	});
};

// OrgManager가 일반 사용자를 Org로 초대 (기본으로 OrgAuditor 권한 부여)
CFClient.prototype.invite = function(orgId, inviteEmail, done, error) {
	var param = {};
	param.url = _config.endpoint.api + '/v2/organizations/' + orgId + '/users';
	param.method = 'PUT';
	param.headers = {
		'Authorization' : 'Bearer ' + this.uaaToken.access_token
	};
	param.form = JSON.stringify({
		username : inviteEmail
	});
	request(param, function(err, res, body) {
		param.url = _config.endpoint.api + '/v2/organizations/' + orgId + '/auditors';
		request(param, function(err, res, body) {
			var data = JSON.parse(body);
			if (data.error_code) {
				error(data);
			} else {
				done();
			}
		});
	});
}

//OrgManager가 Org 사용자를 Org에서 제거 (사용자 계정은 삭제되지 않고, Org에 대한 권한만 제거)
CFClient.prototype.deleteUserFromOrg = function(orgId, userId, done, error) {
	var param = {};
	param.headers = {
		'Authorization' : 'Bearer ' + this.uaaToken.access_token,
		'Content-type' : 'application/x-www-form-urlencoded'
	};
	param.method = 'DELETE';
	param.url = _config.endpoint.api + '/v2/organizations/' + orgId + '/managers/' + userId;
	request(param, function(err, res, body) {
		param.url = _config.endpoint.api + '/v2/organizations/' + orgId + '/billing_managers/' + userId;
		request(param, function(err, res, body) {
			param.url = _config.endpoint.api + '/v2/organizations/' + orgId + '/auditors/' + userId;
			request(param, function(err, res, body) {
					if (body) {
						var data = JSON.parse(body);
						error(data);
					} else {
					    done();
					}
			});
		});
	});
}

module.exports = CFClient;
