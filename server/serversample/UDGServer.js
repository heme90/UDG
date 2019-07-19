var http = require('http'); // Import Node.js core module
var fs = require('fs');
var url = require('url');
var mong = require('./scripts/udg_mongo.js')

var util = require('util');
var userService = require('./lib/users');
var responder = require('./lib/responseGenerator');
var staticFile = responder.staticFile('/public');

var server = http.createServer(function (req, res) {   //create web server
    var _url = req.url;
    var qurey = url.parse(_url, true).query;
    process.setMaxListeners(20);

    if (_url == '/') { //check the URL of the current request

        // set response header
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        // set response content    
        fs.readFile(__dirname + '/index.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
                return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
        });

    }
    else if (_url == '/mainpage.go') { //check the URL of the current request
        res.writeHead(302, { 'Location': '/' })
        // set response content    

    }
    else if (_url == '/mymap.go') { //check the URL of the current request

        // set response header
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        // set response content    
        fs.readFile(__dirname + '/mymap.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
                return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
        });

    }

    else if (_url == '/myfollowmap.go') { //check the URL of the current request

        // set response header
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        // set response content    
        fs.readFile(__dirname + '/followingmap.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
                return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
        });

    }
    else if (_url == "/signup.go") {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

        fs.readFile(__dirname + '/signup.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
                return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
        });

    }
    else if (_url == "/login.do") {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>로그인 스크립트의 코드입니다</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url == "/signup.do") {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>회원가입 스크립트의 코드입니다</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url == "/makemap.do") {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 생성 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url == "/savemap.do") {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 저장 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url == "/sharemap.do") {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 공유 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url == "/followmap.do") {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 팔로우 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url == "/searchmap.do") {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 검색 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }

    // 전체 회원
    else if (_url = /^\/users$/i.exec(req.url)) {
        
        userService.getUsers(function (error, data) {
            userList = util.inspect(data, {depth: 5});
            console.log(userList);
            console.log("==============전체회원==============");

            fs.readFile(__dirname + '/userlist.html', (err, data) => { // 파일 읽는 메소드
                if (err) {
                    return console.error(err); // 에러 발생시 에러 기록하고 종료
                }
                res.end(userList, 'utf-8'); // 브라우저로 전송
            });
        });

        // mong.userList(mong.db, function(){});
        
       /*
        mong.userList(mong.db, function(error, data) {
            userList = util.inspect(data, {depth: 5});
            console.log(userList);
            console.log("==============전체회원==============");

            fs.readFile(__dirname + '/userlist.html', (err, data) => { // 파일 읽는 메소드
                if (err) {
                    return console.error(err); // 에러 발생시 에러 기록하고 종료
                }
                res.end(userList, 'utf-8'); // 브라우저로 전송
            });
        });
        */
    }

    // 특정 회원
    else if (_url = /^\/users\/(\d+)$/i.exec(req.url)) {
        userService.getUser(_url[1], function (error, data) {
            userList = util.inspect(data, {depth: 5});
            console.log(userList);
            console.log("==============특정회원==============");

            fs.readFile(__dirname + '/userlist.html', (err, data) => { // 파일 읽는 메소드
                if (err) {
                    return console.error(err); // 에러 발생시 에러 기록하고 종료
                }
                res.end(userList, 'utf-8'); // 브라우저로 전송
            });

            /*
            var template = `
            <!doctype html>
            <html>
            <head>
            <title>테스트</title>
            </head>
            <body>
                <h1>유저 목록</h1><br>
                ${data}
            </body>
            </html>
            `;

            if (error) {
                return responder.send500(error, res); // 500오류 전송
            }
            if (!data) {
                return responder.send404(res); // 400오류 전송
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(template);
            return responder.sendJson(data, res); // 200 상태 코드와 함께 데이터 전송
            */
        });
    }





    else {
        // 정적 파일 전송 시도
        res.writeHead(200);
        res.end('Invalid Request!');
    }

    process.on('uncaughtException', function (err) {
        //예상치 못한 예외 처리
        console.log('uncaughtException 발생 : ' + err);
        res.writeHead(302, { 'Location': '/' })
    });

});

server.listen(1337, 'localhost'); //6 - listen for any incoming requests

console.log('Node.js web server at port 1337 is running..')