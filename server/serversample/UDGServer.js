var http = require('http'); // Import Node.js core module
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
//var mong = require('./scripts/udg_mongo.js')
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
// Connection URL
const mongourl = 'mongodb://localhost:27017';
var util = require('util');
var userService = require('./lib/users');
//var responder = require('./lib/responseGenerator');
//var staticFile = responder.staticFile('/public');

//var sessions = require("client-sessions");

let session;



const client = new MongoClient(mongourl, {useNewUrlParser: true});
let db;
client.connect(function(err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  db = client.db('udg');

  //여기서 테스트를 원하는 function 호출
});


//1. signin.do : find user by id, pw for login
const signin = function (db, id, pw, callback) {
    // get user collection 
    // find user by id, pw
    db.collection("user").find({ $and: [{ id: id }, { pw: pw }] }).toArray(function (err, userinfo) {
        assert.equal(err, null);
        console.log("found user :");
        console.log(userinfo); //dcenter : [Array]
        // return the result
        return callback(null, userinfo);
    });
}


//2. signup.do : insert new user info when signing up
const signup = function (db, id, pw, email, callback) {
    //get user collection
    var collection = db.collection('user');
    //insert new userinfo
    collection.insertOne({ id: id, pw: pw, email: email }, function (err, result) {
        if (err) {
            console.error("에러", err);
        } else {
            console.log('Inserted the new user')
        }
    });
}

//3-1. add a map in udgmap collection 
const addmap_udg = function (db, newmap, callback) {
    var collection = db.collection('udgmap');
    collection.find().sort({ mapno: -1 }).limit(1).next().then((found) => {
        const maxno = found.mapno;
        console.log(maxno);
        return maxno
    })
        .then((maxno) => {
            collection.insertOne({
                mapno: maxno + 1,
                id: newmap.id, // newmap 원형은 아래 참고 
                mapname: newmap.mapname,
                center: [newmap.center[1], newmap.center[0]], //경도 위도 순
                zoom: newmap.zoom,
                visibility: newmap.visibility,
                cnt_follow: 0,
                markers: newmap.markers
            }, function (err, rs) {
                if (err) { console.error(err); }
                console.log('성공');
                addmap_my(db, newmap.id, newmap.mapno, callback);
            })
        })
}

/*
var newmap = {
  mapno: 5, id: 'nang', region:'세종대', mapname: '카페'
  , center: [37.55167473692547, 127.075966826421], zoom: 15, visibility: false, cnt_follow: 0
  , markers: [{ title: "1", lat: 37.5556, lng: 127.07186, desc: { content: "카페 쉼" } },
  { title: "2", lat: 37.5543, lng: 127.07243, desc: { content: "En Blossom" }}]
}
*/

//3-2: add a map in user document' mymap.mapno in user collection, addmap_udg 호출시 함께 호출됨
const addmap_my = function (db, id, mapno, callback) {
    //get user collection
    var collection = db.collection('user');
    //add a new map
    collection.updateOne({ id: id }, { $push: { 'mymap.mapno': { $each: [mapno] } } }
        , { upsert: true }, function (err, result) {
            if (err) { console.error("에러", err); }
            console.log('added a map in user mymap');
        });
}

// 4. savemap.do : edit map 
const editmap = function (db, editedmap, callback) {
    //get udgmap collection
    var collection = db.collection('udgmap');
    collection.updateOne({ $and: [{ id: editedmap.id }, { mapno: editedmap.mapno }] }
        , {
            $set: {
                region: editmap.region,
                mapname: editedmap.mapname,
                center: [editedmap.center[1], editedmap.center[0]],
                zoom: editedmap.zoom,
                visibility: editedmap.visibility,
                markers: editedmap.markers,
            }
        }, function (err, rs) {
            if (err) { console.error(err); }
            console.log('성공');
        })
}


//5. followmap.do : add a map to the user's follow field
//5-1: user collection update
const followmap_add = function (db, id, c_id, mapno, callback) {
    //get user collection
    var collection = db.collection('user');
    //update user document
    collection.updateOne({ id: id }
        , { $push: { "followmap.mapno": mapno } }, function (err, result) {
            if (err) {
                console.error(err);
            } else {
                console.log('follow add 성공 ')
                followcnt_inc(db, c_id, mapno); //cnt_follow increase by 1
            }
        });
}
//5-2: udgmap collection update - cnt_follow +1, follow_add 호출 성공시 자동으로 호출됨
const followcnt_inc = function (db, id, mapno, callback) {
    //get udgmap collection
    var collection = db.collection('udgmap');
    //cnt_follow +1
    collection.updateOne({ $and: [{ id: id }, { mapno: mapno }] }, { $inc: { cnt_follow: 1 } }, function (err, result) {
        if (err) {
            console.error(err);
        } else {
            console.log('increased cnt_follow by 1');
        }
    });
}

//6. searchmap.do : find shared maps of certain location, sorted by cnt_follow
const searchmaps = function (db, x, y, callback) {
    // get udgmap collection 
    var collection = db.collection('udgmap');
    // find shared maps at the point of [x,y]
    collection.createIndex({ center: "2dsphere" }, function (err, result) {
        if (err) {
            console.error(err);
            //
        } else {
            console.log("성공");
            collection.find({
                $and: [{
                    center: {
                        $near: {
                            $geometry: { type: 'Point', coordinates: [y, x] }, //위도, 경도 순으로 들어온 좌표를 경도, 위도순으로 find
                            $maxDistance: 300 //해당 좌표에서 300미터 이내에 있는 지점 찾기
                        }
                    }
                },
                { visibility: true }] // 공개된 지도만 찾아온다 
            })
                .sort({ cnt_follow: -1 })//팔로우 수가 많은 순서대로
                .toArray(function (err, foundmaps) {
                    if (err) {
                        console.error(err)
                    } else {
                        console.log("found maps: ")
                        console.log(util.inspect(foundmaps, { depth: 5 }));
                        return callback(null, foundmaps);
                    }
                });
        }
    });
}



//7. mainpage.go : find all maps that is shared
const allmaps = function (db, callback) {
    // get udgmap collection 
    var collection = db.collection('udgmap');
    // find maps whose 'onlyme' field is 0
    collection.find({ visibility: true }).toArray(function (err, allmaps) {
        if (err) {
            console.error(err);
        } else {
            console.log("allmaps :");
            console.log(util.inspect(allmaps, { depth: 5 }));
            // return the result
            return callback(null, allmaps);
        }
    });
}

//8. mymap.go : find my maps by id
const mymaps = function (db, id, callback) {
    // get udgmap collection 
    var collection = db.collection('udgmap');
    // find my maps by id
    collection.find({ id: id }).toArray(function (err, mymaps) {
        if (err) {
            console.error(err);
        } else {
            console.log("mymaps :");
            console.log(util.inspect(mymaps, { depth: 5 }));
            // return the result
            return callback(null, mymaps);
        }
    });
}

//9. myfollowmap.go : find my following maps by id
const followmaps = function (db, id, callback) {
    // get user collection 
    let collection = db.collection('user');
    // find following maps by id
    try{
      collection.findOne({ id: id }, { projection: {_id: 0, followmap: 1} })
    .then((result) =>{ //{ followmap: { mapno: [ 4, 4 ] } }
      console.log('성공')
      nums = Array.from(new Set(result.followmap.mapno)); // 중복제거  
      console.log(nums, typeof nums);
      collection = db.collection('udgmap'); // udgmap 으로 collection switch
      collection.find({mapno: {$all : nums}}).toArray(function(err,followmaps){
        if (err) { console.error(err)}
        console.log(util.inspect(followmaps, { depth: 5 }))
        return callback(null, followmaps);
      })
    })
    } catch (err) {
      console.error(err)
    }
}


//10. detailmap.go : see detail of the map by id, dname, dcenter
const detailmap = function (db, mapno, callback) {
    // get udgmap collection 
    var collection = db.collection('udgmap');
    // find a map by id, dname, dcenter
    collection.find({ mapno: mapno }).toArray(function (err, mapdetail) {
        if (err) {
            console.error(err);
        } else {
            console.log("mapdetail :", util.inspect(mapdetail, { depth: 5 }));
            // return the result
            return callback(null, mapdetail);
        }
    });
  }




var server = http.createServer(function (req, res) {   //create web server
    var _url = req.url;
    var query = url.parse(_url, true).query;
   
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
    else if (_url.startsWith('/mainpage.go')) { //check the URL of the current request
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
    else if (_url.startsWith('/mymap.go')) { //check the URL of the current request
        // set response header
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        // set response content    
        fs.readFile(__dirname + '/mymap.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
                console.error(err); // 에러 발생시 에러 기록하고 종료
            } 
            res.end(data, 'utf-8'); // 브라우저로 전송
        });
    }
    else if (_url.startsWith('/mymap.do')) { //check the URL of the current request
        mymaps(db, query.id, function(err, mymaps){
            /*
            for (i=0; i<mymaps.length; i++) {
                mymaps[i] = JSON.stringify(mymaps[i]).replace(/"/gi, "\'");
            }
            var result = JSON.stringify({mymaps : mymaps}).replace(/"/gi, "\'");
            console.log(result);
            */
            var result = JSON.stringify({mymaps : mymaps})
            res.end(result, 'utf-8'); // 브라우저로 전송
        });
        // res.sendDate(data);
    }
    else if (_url.startsWith("/makemap.do")) {
        let body;
        var post;
        if (req.method === 'POST') {
            req.on('data', data => {
                body = data.toString();
            });
            req.on('end', () => {
                post = qs.parse(body);
                console.log(post);
                makemap(db, post, function(err, result){
                    var result = JSON.stringify({result : result})
                    // console.log(result);
                });
            });
        }
        res.end('ok'); // 브라우저로 전송
    }
    else if (_url.startsWith("/savemap.do")) {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 저장 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url.startsWith("/sharemap.do")) {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 공유 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url.startsWith('/myfollowmap.go')) { //check the URL of the current request
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
    else if (_url.startsWith("/signup.go")) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

        fs.readFile(__dirname + '/signup.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
                return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
        });
    }
    else if (_url.startsWith("/login.do")) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        console.log(query.id,query.pw)
        signin(db,query.id,query.pw,function(err,user){
            if(err){
                console.log("f")
            }
            console.log(user[0]);
            session={
                        cookieName: 'mySession',
                        secret: user[0].id,
                        duration: 24 * 60 * 60 * 1000, 
                        activeDuration: 1000 * 60 * 5,
                        id : user[0].id,
                        pw : user[0].pw,
                        email : user[0].email
                    }

            console.log(session.id)
            res.end(user[0] + "");
        });
    }
    else if (_url.startsWith("/followmap.do")) {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 팔로우 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url.startsWith("/searchmap.do")) {

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




