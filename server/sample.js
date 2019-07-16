var http = require('http'); // Import Node.js core module
var fs = require('fs');
var url = require('url');
var server = http.createServer(function (req, res) {   //create web server
    var _url = req.url;
    var qurey = url.parse(_url,true).query;
    if (req.url == '/') { //check the URL of the current request
        
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
    else if (req.url == "/comment") {
        
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write('<html><h1>지도 주석 페이지의 html입니다</h1><br/></html>','utf-8');
        res.end();
    //comment.do?comm=aaa 형식으로 요청한뒤 값이 들어오는지 확인해주세요
    }else if (_url = '/comment.do' ) {
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        res.write('<h1>지도 주석 페이지의 실행 스크립트입니다</h1><br/>'
        + qurey.comm + ' 을 주석으로 등록합니다','utf-8');
    
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

/*

    if (_url = '/' ) {

        res.end(fs.readFileSync('C:\\MyNode\\nodetest\\index.html','utf-8'))
    
    }
    
    if (_url = '/comment' ) {
       
        res.write('<h1>지도 주석 페이지의 html입니다</h1><br/>');
    
    } 
    
    if (_url = '/comment.do' ) {
        
        res.write('<h1>지도 주석 페이지의 실행 스크립트입니다</h1><br/>'
        + req['comm']+ ' 을 주석으로 등록합니다');
    
    }
    
    if (_url = '/share.do' ) {
        
        res.write('<h1>지도 공유 페이지의 실행 스크립트입니다</h1><br/>'
        + req['user'] + ' 의 ' + req['mapnum'] + ' 번 지도를 공유합니다');
    
    }
    
    if (_url = '/follow.do' ) {
      
        res.write('<h1>지도 팔로우 페이지의 실행 스크립트 입니다</h1><br/>'
        + req['globalmapnum'] + ' 번 지도를 팔로우합니다');
    
    }
*/


server.listen(1337,'localhost'); //6 - listen for any incoming requests

console.log('Node.js web server at port 1337 is running..')