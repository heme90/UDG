var http = require('http'); // Import Node.js core module
var fs = require('fs');
var url = require('url');
var server = http.createServer(function (req, res) {   //create web server
    var _url = req.url;
    var qurey = url.parse(_url,true).query;
    process.setMaxListeners(20);
    
    if (_url == '/') { //check the URL of the current request
        
        // set response header
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        // set response content    
        fs.readFile(__dirname + '/index.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
              return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
          });
    
    }
    else if (_url == '/mainpage.go') { //check the URL of the current request
        res.writeHead(302, {'Location' : '/'})
        // set response content    
    
    }
    else if (_url == '/mapsearch.go') { //check the URL of the current request
        
        // set response header
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        // set response content    
        fs.readFile(__dirname + '/searchmap.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
              return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
          });
    
    }

    else if (_url == '/mymap.go') { //check the URL of the current request
        
        // set response header
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
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
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        // set response content    
        fs.readFile(__dirname + '/follow.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
              return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
          });
    
    }
    else if (_url== "/signup.go") {
        
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        fs.readFile(__dirname + '/signup.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
              return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
          });
    
    }
    else if (_url == "/login.do") {
        
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write('<html><h1>로그인 스크립트의 코드입니다</h1><br/></html>','utf-8');
        res.end();
    
    }
    else if (_url == "/signup.do") {
        
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write('<html><h1>회원가입 스크립트의 코드입니다</h1><br/></html>','utf-8');
        res.end();
    
    }
    else if (_url == "/makemap.do") {
        
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write('<html><h1>지도 생성 스크립트</h1><br/></html>','utf-8');
        res.end();
    
    }
    else if (_url == "/savemap.do") {
        
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write('<html><h1>지도 저장 스크립트</h1><br/></html>','utf-8');
        res.end();
    
    }
    else if (_url == "/sharemap.do") {
        
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write('<html><h1>지도 공유 스크립트</h1><br/></html>','utf-8');
        res.end();
    
    }
    else if (_url == "/followmap.do") {
        
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write('<html><h1>지도 팔로우 스크립트</h1><br/></html>','utf-8');
        res.end();
    
    }
    else if (_url == "/searchmap.do") {
        
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write('<html><h1>지도 검색 스크립트</h1><br/></html>','utf-8');
        res.end();
    
    }
    else{
        res.end('Invalid Request!');
    }

    process.on('uncaughtException', function (err) {
        //예상치 못한 예외 처리
        console.log('uncaughtException 발생 : ' + err);
        res.writeHead(302, {'Location' : '/'})
    });

});


server.listen(1337,'localhost'); //6 - listen for any incoming requests

console.log('Node.js web server at port 1337 is running..')