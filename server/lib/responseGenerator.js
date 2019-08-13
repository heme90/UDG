var fs = require('fs');

exports.send404 = function (response) {
    console.error("Resource not found");
    response.writeHead(404, {
        'Content-Type': 'text/plain'
    });
    response.end('Not Found');
}

exports.sendJson = function (data, response) {
    response.writeHead(200, {
        'Content-Type': 'applicaation/json'
    });
    response.end(JSON.stringify(data));
}

exports.send500 = function (data, response) {
    console.error(data.red);
    response.writeHead(500, {
        'Content-Type': 'text/plain'
    });
    response.end(data);
}

exports.staticFile = function (staticPath) {
    return function (data, response) {
        var readStream;

        // 라우트를 수정해서 /home과 /home.html 모두 동작하게 만든다.
        data = data.replace(/^(\/home)(.html)?$/i, '$1.html');
        data = '.' + staticPath + data;

        fs.stat(data, function (error, stats) {
            if (error || stats.isDirectory()) { // 파일이 존재하지 않거나 디렉터리라면
                return exports.send404(response);
            }

            // 파일이 존재하면 그 파일의 readStream 생성
            readStream = fs.createReadaStream(data);
            return readStream.pipe(response); // 파이프로 response 객체에 연결
        });
    }
}