/**
 * Confluence 공지사항 알림
   - 포탈에 공지사항을 제공할 수 있는 app(포탈과 별도 앱)
   - 포탈에서 공지사항을 가져갈수 있도록 api 제공
   - 제공 내용
     -> softlayer 공지사항 > softlayer api 사용
     -> paas 공지사항 > JIRA confluence api
 */
function lpad(s, padLength, padString){
    while(s.length < padLength) {
    	s = padString + s;
    }
    return s;
}

var cookiePack = {
		getLastNotifyDatetime: function(cookieKey) {
			var result = null;
			var cookie = document.cookie;
		    var cookies = cookie.split("; ");
		    for (var i=0; i < cookies.length; i++) {
		        var keys = cookies[i].split("=");
		        if (keys[0] == cookieKey) {
		            result = unescape(keys[1]);
		        }
		    }
		    return result;
		},
		setLastConfirmDatetime: function(cookieKey, addDay) {
			var date = new Date();
			if(addDay) {
				date.setDate(date.getDate() + addDay);
			}
			var datetime = date.toISOString();

			var expireDays = 30;
			date.setDate(date.getDate() + expireDays);

			document.cookie = cookieKey + "=" + datetime + ";" + "expires=" + date.toGMTString();
		},
		lpad: function (s, padLength, padString) {
		    while(s.length < padLength) {
		    	s = padString + s;
		    }
		    return s;
		},
		setNotificationInfo: function(cnt) {
			if(cnt > 0) {
				$("#noti_cnt").text(cnt);
				$("#notificationBar").show("fade", {}, 2000, null);
			}
		},
		inquiryNotifications: function(cookieKey) {

			// confluence rest api 호출하여 공지사항 조회
			// console.log(document.cookie);

			// 쿠키에 저장된 최종 확인 시간 조회
			var latestReadDateTime = this.getLastNotifyDatetime(cookieKey);

			// 쿠키에 최종 확인 시간이 미생성/삭제/누락된 경우, 최근 7일 사이에 작성된 글을 조회한다.
			if(latestReadDateTime == null) {
				this.setLastConfirmDatetime(cookieKey, -7);
				latestReadDateTime = this.getLastNotifyDatetime(cookieKey);
			}

			// console.log(latestReadDateTime);

			if(latestReadDateTime != null && latestReadDateTime != "") {

				var lastReadDate = new Date(latestReadDateTime);
				var searchDt = lastReadDate.getFullYear()
				               + "-" + this.lpad((lastReadDate.getMonth() + 1).toString(), 2, "0")
				               + "-" + this.lpad(lastReadDate.getDate().toString(), 2, "0")
				               + " " + lastReadDate.getHours()
				               + ":" + lastReadDate.getMinutes()
				               ;

				var callback = function(result) {
					if(result != null && result.length > 0) {
						cookiePack.setNotificationInfo(result.length);
					}
				}

				var options = {
						lastmodified: searchDt
					};

				$.ajax({
					type: "post",
					url:  "/noti/inquiry",
					data: {options: options},
					success: function (result) {
						callback(result);
					}
				});
			}
		}
	};

$(document).ready(function() {

	/* 설정된 시간만큼 공지사항을 조회하도록 한다. */

	var cookieKey = "notiKey";
	var intervalMillisec = 1000 * 60 * 10;	// 10분 주기
	//var intervalMillisec = 1000 * 30;		// 테스트 : 5초 주기
  if (notificationEndpoint != "#{notificationEndpoint}") {
  	// 최초 실행
  	cookiePack.inquiryNotifications(cookieKey);
  	// 설정된 주기마다 실행된다.
  	setInterval(function() {
  		cookiePack.inquiryNotifications(cookieKey);
  	}, intervalMillisec);
  }

	// 닫기 버튼을 누르면 쿠키에 최근 확인 시간이 저장되고, 알림바가 닫힘.
    $("#notificationCloseBtn").on("click", function() {
    	cookiePack.setLastConfirmDatetime(cookieKey);
    	$("#notificationBar").hide("blind", {}, 100, null);
    });

});
