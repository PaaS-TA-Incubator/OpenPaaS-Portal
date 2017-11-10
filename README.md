# OpenPaaS Portal
OpenPaaS Portal은 PaaS-TA 사용자를 위한 웹 애플리케이션입니다. 사용자는 OpenPaaS 포탈을 통해 Org, Space, App, Service, Member를 관리할 수 있습니다. OpenPaaS Portal에서 제공하는 세부 기능은 아래와 같습니다:
- Org: Org 정보 조회, Org명 변경
- Space: Space 생성/삭제, Space 정보 조회, Space명 변경
- App: App 정보 조회, App 동작/중단, App명 변경, App 스케일 업/다운, App 스케일 인/아웃, Service 바인딩/언바인딩, Route 맵핑/언맵핑, App 삭제
- Service: Service Instance 생성/삭제, Service Instance 정보 조회, Service Instance명 변경, Service Instance 플랜 변경
- Member: Org/Space별 사용자 조회, 사용자 초대/제거, 사용자 권한 부여/제거

## 배포 방법

### 사전 준비
1. PaaS-TA 배포
   - https://github.com/PaaS-TA/Guide-2.0-Linguine-#플랫폼-설치-가이드
2. OpenPaaS Portal을 위한 UAA Client 생성
   - PaaS-TA Controller Manifest 파일에 아래 내용을 추가하여 배포합니다.
      ```sh
      properties:
         ...
         uaa:
            ...
            clients:
               ...
               portal_client:
                  name: portal_client
                  authorities: uaa.none,doppler.firehose
                  authorized-grant-types: refresh_token,password,client_credentials,authorization_code
                  autoapprove: true
                  redirect-uri: http://console.{APP-DOMAIN}/login
                  signup_redirect_url: https://console.{APP-DOMAIN}
                  scope: cloud_controller.admin_read_only,openid,routing.router_groups.write,scim.read,cloud_controller.admin,uaa.user,cloud_controller.read,password.write,routing.router_groups.read,cloud_controller.write,network.admin,doppler.firehose,scim.write
                  secret: {PORTAL-CLIENT-SECRET}
                  app-launch-url: https://console.{APP-DOMAIN}
                  show-on-homepage: true
      ```

### OpenPaaS Portal 배포
1. 소스 코드 내려 받기
   ```sh
   $ git clone
   $ cd openpaas
   ```

2. manifest.yml 작성
   ```sh
   ---
   applications:
   - name: console
     command: node app.js
     buildpack: nodejs_buildpack
     env:
       ## System Variables
       CF_STAGING_TIMEOUT: 25                          //필수
       CF_STARTUP_TIMEOUT: 15                          //필수
       SYSTEM_DOMAIN: {SYSTEM-DOMAIN}                  //필수
       PORTAL_CLIENT: {BASE64-ENCODED-CLIENTID:SECRET} //필수
       ## Brand
       BRAND: {BRAND-NAME}
       COPYRIGHT: {COPYRIGHT}
       ## Add-on Menus
       DOCS_URL: {DOCUMENTATION-URL}
       SUPPORT_URL: {SUPPORT-URL}
       NOTICE_URL: {NOTICE-URL}
       NOTIFICATION_ENDPOINT: {NOTIFICATION-ENDPOINT}
       STATUS_URL: {STATUS-URL}
       MONITORING_URL: {MONITORING-URL}
       BILLING_REPORT_URL: {BILLING-REPORT-URL}
       LOGGING_DASHBOARD: {LOGGING-DASHBOARD-URL}
       ## Services
       AUTOSCALER_SERVICE_NAME: {AUTOSCALER-SERVICE-NAME}
       AUTOSCALER_DASHBOARD: {AUTOSCALER-DASHBOARD}
       REDIS_SERVICE_NAME: {REDIS-SERVICE-NAME}
       REDIS_DASHBOARD: {REDIS-DASHBOARD}
       SWIFT_SERVICE_NAME: {SWIFT-SERVICE-NAME}
       SWIFT_DASHBOARD: {SWIFT-DASHBOARD}
     services:
       - {REDIS-SERVICE-INSTANCE}                     //필수
   ```
3. Portal 배포
   ```sh
   $ cf push
   ```

## 사용 방법
아래 가이드 참조
- https://sk-paas.atlassian.net/wiki/spaces/DOCS/pages/327926/Portal
