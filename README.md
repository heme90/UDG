# 우리 동네 지도 (UDG)
meanstack 기반의 지도공유 플랫폼  
<br>

### 실행법
    
    -node.js 설치(10.xxx)
    -npm modules 설치
    -4.0.8 이상의 mongodb 설치 및 sample data 입력
    -node PROJECT/PATH/UDG/server/UDGserver.js
    
    
### 기능

    -유저별 지도 제작 및 공유
    -지도 팔로우 하기

### BM

    -우리동네를 잘 아는 인플루언서들의 지도 감상
    -콘텐츠 제공자, 플랫폼 제공자 상생구조

### 유즈케이스

    -타인이 공유한 지도 감상, 팔로우
    -나만의 지도 제작, 공유
    -팔로우한 지도 감상

### 개발 스택

    -web	: html/css/javascripts/angular.js
    -server : node.js/python
    -storage: mongodb/eth public chain

### 개발툴

    -Visual Studio Code, Window PowerShell or CMD or MAC, Remix ide, Ganache, Docker

### 협업툴

    -git, trello


### 개발 task

    -node.js를 이용한 서버 및 샘플 mvc 패턴 구축 및 테스트
    -html/css/javascripts/로 mainpage, map, mymap, followmap 4 페이지 구축 또는 angular.js 를 이용한 spa 구축
    -node-mongodb connection 구축한뒤 google 지도 api와 geojson를 통한 지도 기능 구현
    -구축된 app의 storage를 eth public chain에 배포

### 프로젝트 milestones

    *사용 데이터 명세화
    *node.js 또는 angular.js를 통한 웹 mvc 패턴의 구현 및 샘플 html파일로 테스트
    *페이지 view 템플릿 구성 및 기타 요구사항 완성
    *지도 api 및 mongodb geojson 모델을 통해 기능 3가지 구현
    *view에 데이터 매핑하여 앱 완성 뒤 블록체인 스토리지로 데이터 이전














