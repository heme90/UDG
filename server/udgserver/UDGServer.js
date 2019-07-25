var http = require('http'); // Import Node.js core module
var fs = require('fs');
var url = require('url');
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



// Use connect method to connect to the Server

//1. signin.do : find user by id, pw for login
const signin = function(db,id,pw,callback) {
    // get user collection 
    // find user by id, pw
    db.collection("user").find({$and : [{id : id}, {pw: pw}]}).toArray(function(err, userinfo) {
        assert.equal(err, null);
        console.log("found user :");
        console.log(userinfo); //dcenter : [Array]
        // return the result
        return callback(null,userinfo);
    });

    //

    //assert.equal(err, null);
    //    console.log("found user :");
    //    console.log(userinfo); //dcenter : [Array]
    //    // return the result
    //    callback(userinfo); 




  }
  
  //2. signup.do : insert new user info when signing up
  const signup = function(db, id, pw, email, callback){
    //get user collection
    var collection = db.collection('user');
    //insert new userinfo
    collection.insertOne({id:id, pw:pw, email:email}, function(err,result){
        if(err){
            console.error("에러",err);
        } else {
            console.log('Inserted the new user')
        }
    });
  }

  //3. makemap.do : 
  //3-1 :make a new map in udgmap collection
  const addmap_udg = function(db,id,dname,x,y, callback){
    //get udgmap collection
    var collection = db.collection('udgmap');
    //insert a new map
    //경도, 위도 순으로 저장하도록 변경, 새로 저장시 '나만보기'를 기본값으로 
    collection.insertOne({id:id, dname:dname, dcenter:[y,x], onlyme:1, cnt_follow:0, markers:[]}, function(err,result){
        if(err){
            console.error("에러",err);
        } else {
            console.log('inserted mymap in udgmap');
        }
    });
  }
 //3-2: add a map in user document in user collection
 const addmap_user = function(db,id,dname,x,y, callback){
    //get user collection
    var collection = db.collection('user');
    //add a new map
    collection.updateOne({id:id}
      ,{ $push: {mymap: {creator: id, dname: dname, dcenter: [y,x] }}}, function(err,result){
        if(err){
          console.error("에러",err); 
        } else {
          console.log('added a map in user mymap');
        }
    });
  }
  
  // 4. savemap.do : save new markers on an existing map
  const addmarkers = function(db,id,dname,x,y,markers, callback){
    //get udgmap collection
    var collection = db.collection('udgmap');
    //for forEach
    var mks = markers['mks']; 
    //object{"title" : "1","lat" : 37.484781,"lng" : 127.0162, "desc" : {"con" : "no.1"}}
    //markers 원형은 아래 참고 
    mks.forEach(function(items,index){
      collection.updateOne({id:id, dname:dname,dcenter:[x,y]}
        ,{ $push: {markers: {title: items.title
        , lat:items.lat, lng:items.lng
        , desc : {content:items.desc.con}}}}, function(err,result){
        if(err){
            console.error(err);
        } else {
            console.log('added a marker in the map');
        }
      });
    });
  }

  /*
  var markers ={"c_id" : "aa", "center":{lat: 37.484780, lng: 127.016129} 
          , "mapname" : "안녕" 
          , "mks" : [{"title" : "1","lat" : 37.484781,"lng" : 127.0162, "desc" : {"con" : "no.1"} }
          ,{"title" : "2","lat" : 37.484800,"lng" : 127.0163, "desc" : {"con" : "no.2"} }
          ,{"title" : "3","lat" : 37.484789,"lng" : 127.0164, "desc" : {"con" : "no.3"} }]};
  */
  
  //5. sharemap.do : set a map shared 
  const shared = function(db,id,dname,x,y, callback){
    //get user collection
    var collection = db.collection('udgmap');
    //set the map shared
    collection.updateOne({id:id, dname: dname, dcenter:[y,x]}, {$set: {onlyme:0}}, function(err, result){
        if(err){
          console.error(err);
        } else {
          console.log('the map is shared now');
        }
    });
  }
  
  
  
  //6. followmap.do : add a map to the user's follow field
  //6-1: user collection update
  const followmap_add = function(db,id,c_id, dname, x,y, callback){
    //get user collection
    var collection = db.collection('user');
    //update user document
    collection.updateOne({id:id}
      ,{$push: {followmap: {creator:c_id, dname:dname, dcenter:[y,x]}}}, function(err,result){
        if(err){
            console.error(err);
        } else {
            console.log('added a map in user followmap');
        }
    });
  }
  
  //6-2: udgmap collection update - cnt_follow +1
  const followcnt_inc = function(db,id, dname, x,y, callback){
    //get udgmap collection
    var collection = db.collection('udgmap');
    //cnt_follow +1
    collection.updateOne({id:id, dname: dname, dcenter:[y,x]},{$inc:{cnt_follow:1}}, function(err,result){
        if(err){
            console.error(err);
        } else {
            console.log('increased cnt_follow by 1');
        }
    });
  }
  
  
  //7. searchmap.do : find shared maps of certain location, sorted by cnt_follow
  const searchmaps = function (db, x, y, callback) {
    // get udgmap collection 
    var collection = db.collection('udgmap');
    // find shared maps at the point of [x,y]
    collection.createIndex({dcenter:"2dsphere"}, function(err, result){
      if (err){
        console.error(err);
        //
      } else {
        console.log("성공");
        collection.find({ $and: [{ dcenter: {$near : {
          $geometry: {type:'Point', coordinates: [y,x]}, //위도, 경도 순으로 들어온 좌표를 경도, 위도순으로 find
          $maxDistance: 300}}}, //해당 좌표에서 300미터 이내에 있는 지점 찾기
          { onlyme: 0 }] }) // 공개된 지도만 찾아온다
          .sort({ cnt_follow: -1 })//팔로우 수가 많은 순서대로
          .toArray(function (err, foundmaps) {
            if(err){
              console.error(err)
            } else {
              console.log("found maps: ")
              console.log(util.inspect(foundmaps, {depth: 5}));
              return callback(null, foundmaps);
            }
      });
      }
    });
  }
  
  //8. mainpage.go : find all maps that is shared
  const allmaps = function(db, callback) {
    // get udgmap collection 
    var collection = db.collection('udgmap');
    // find maps whose 'onlyme' field is 0
    collection.find({onlyme: 0}).toArray(function(err, allmaps) {
        if (err){
            console.error(err);
          } else {
            console.log("allmaps :");
            console.log(util.inspect(allmaps,{depth:5}));
            // return the result
            return callback(allmaps);
          }
    });
  }
  
  //9. mymap.go : find my maps by id
  const mymaps = function(db,id, callback) {
    // get udgmap collection 
    var collection = db.collection('udgmap');
    // find my maps by id
    collection.find({id: id},{mymap:1}).toArray(function(err, mymaps) {
        if (err){
            console.error(err);
          } else {
            console.log("mymaps :");
            console.log(util.inspect(mymaps,{depth:5}));
            // return the result
            return callback(mymaps);
          }
    });
  }
  
  
  //10. myfollowmap.go : find my following maps by id
  const followmaps = function(db, id, callback) {
    // get user collection 
    var collection = db.collection('user');
    // find following maps by id
    var ft = { followmap: 1}
    collection.find({id: id}, {projection:ft}).toArray(function(err, followmaps) {
        if (err){
          console.error(err);
        } else {
          console.log("followmaps :");
          console.log(util.inspect(followmaps,{depth:5}));
          // return the result
          return callback(followmaps);
        }
    });
  }




var server = http.createServer(function (req, res) {   //create web server
    var _url = req.url;
    var query = url.parse(_url, true).query;
    let date;
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
                return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
        });

    }
    else if (_url.startsWith('/mymap.do')) { //check the URL of the current request
        mymaps(db,session.id, function(data){
            res.sendDate(data)
        });
    
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
        console.log(query.id,query.pw)
        signin(db,query.id,query.pw,function(err,user){
            if(err){
                console.log("f")
            }
            console.log(user[0]);
            //response.setHeader('Set-Cookie', ['type=ninja', 'language=javascript']);
            // res.setHeader('Set-Cookie', ['id='+user[0].id
            //                             ,'pw='+user[0].pw
            //                             , 'email='+user[0].email]);
            date = new Date(Date.now() + 24*60*60*1000);
            date = date.toUTCString();
            //쿠키가 하루동안 지속되도록 함 
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8',
                                 'Set-Cookie' : ['id='+user[0].id+';Expires='+date
                                 ,'pw='+user[0].pw+';Expires='+date
                                 , 'email='+user[0].email+';Expires='+date] });
            res.end(JSON.stringify(user[0]));
            
           
        });
    }
    else if (_url.startsWith("/makemap.do")) {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 생성 스크립트</h1><br/></html>', 'utf-8');
        res.end();

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
    else if (_url.startsWith("/followmap.do")) {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 팔로우 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url.startsWith("/searchmap.do")) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      console.log(query.lat, query.lng)
      var x = Number(query.lat);
      var y = Number(query.lng);
      searchmaps(db, x, y, function(err, data){
          if(err){
              console.log("error")
          }
          var searchedMap = data;
          console.log(searchedMap);
      })
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




