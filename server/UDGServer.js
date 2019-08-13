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
  

//2-1. signup.do : insert new user info when signing up
const signup = function(db, data, callback){
    //get user collection
    var collection = db.collection('user');
    //insert new userinfo
    collection.insertOne({
      id: data.id, 
      pw: data.pw, 
      email: data.email
    }).then(function(err,result){
      //assert.equal(err,null);
      //assert.equal(1,results.result.n);
      //assert.equal(1,results.ops.length);
      console.log('Inserted the new user')
      callback(result);
    });
  }
//2-2 id 중복확인
const findUserId = function (db, id, callback) {
  var collection = db.collection('user');
  collection.find({
    id: id
  }).toArray(function (err, result) {
    console.log(result);
    return callback(null, result[0]);
  });
}
//2-3 email 중복확인
const findUserEmail = function (db, email, callback) {
  var collection = db.collection('user');
  collection.find({
    email: email
  }).toArray(function (err, result) {
    return callback(null, result[0]);
  });
}


//3. 회원 삭제 + deletemapById 호출하여 그 회원이 만든 지도를 다 삭제
const deleteUser = function (db, data, callback) {
  // get udbmap collection
  var collection = db.collection('user');
  collection.deleteMany({
    id: data.id,
    pw: data.pw
  }, function (err, result) {
    if(err){
      console.error(err);
    } else {
      console.log(data.id,' 탈퇴 완료');
      deletemapById(db, data.id, function(err, rs){
        if(err){
          console.error(err);
        } else {
          console.log(data.id, '의 지도 삭제 완료');
          return callback(null, rs);
        }
      })
    }
    //return callback(null, result);
  });
}
//4. 회원정보 수정  (pw, email)
const updateUser = function (db, data, callback) {
    var collection = db.collection('user');
    collection.updateOne({id: data.id}, {
      $set: {
        pw: data.pw,
        email: data.email
      }
    }, function (err, result) {
      assert.equal(err, null);
      return callback(null, result);
    });
  }
//5. 모든 회원 리스트 
const findAllUser = function (db, callback) {
    var collection = db.collection('user');
  
    collection.find().toArray(function (err, result) {
      console.log(result);
      return callback(null, result);
    });
  }

//addmap.do : 
//6. make a new map in udgmap collection
const addmap = function (db, data, callback) {
  // get udgmap collection 
  var collection = db.collection('udgmap');
  var max;
  collection.find().sort({ 'mapno': -1 }).limit(1).toArray(function (err, result) {
    max = result[0]['mapno'];
    newNo = Number(max + 1);

    collection.insertOne({
      mapno: newNo,
      id: data.id,
      region: data.region,
      mapname: data.mapname,
      center: data.center,
      zoom: data.zoom,
      visibility: data.visibility,
      cnt_follow: data.cnt_follow,
      markers: data.markers
    }, function (err, result) {
      assert.equal(err, null);
      // return the result
      return callback(null, newNo);
    });
  });
}

// 7. 지도 정보 수정  
const editmap = function (db, data, callback) {
  //get udgmap collection
  var collection = db.collection('udgmap');

  collection.updateOne({ $and: [{ id: data.id }, { mapno: data.mapno }] },
    {
      $set: {
        region: data.region,
        mapname: data.mapname,
        center: data.center,
        zoom: data.zoom,
        visibility: data.visibility,
        markers: data.markers,
      }
    }, function (err, rs) {
      if (err) { console.error(err); }
      console.log('성공');
    })
}


//8. 지도 삭제 
const deletemapByNo = function (db, no, callback) {
  // get udbmap collection
  var collection = db.collection('udgmap');
  collection.deleteMany({ mapno: no }, function (err, result) {
    assert.equal(err, null);

    // return the result
    return callback(null, result);
  });
}

// 회원 탈퇴 시 해당 회원이 만든 지도들을 다 삭제 
const deletemapById = function (db, id, callback) {
  console.log('deletemapById')
  // get udbmap collection
  var collection = db.collection('udgmap');
  collection.find({id: id}).toArray(function(err, result){
    if(err){
      console.error(err);
    } else if(result.length>0){
      console.log(id,'의 지도를 삭제합니다');
      collection.deleteMany({ id: id }, function (err, rs) {
        assert.equal(err, null);
        // return the result
        return callback(null, rs);
      });
    } else {
      console.log('삭제할', id, '의 지도가 없습니다');
      return callback(null, result);
    }
  })
}

  
//9. followmap.do : add a map to the user's follow field
//9-1: 팔로우하는 지도 번호를 유저 정보에 추가 
const followmap_add = function (db, id, c_id, mapno, callback) {
  //get user collection
  var collection = db.collection('user');
  //update user document
  collection.updateOne({ id: id }, { $push: { "followmap.mapno": mapno }}, {upsert: true},
    function (err, result) {
      if (err) {
        console.error(err);
      } else {
        console.log('follow map 성공 ')
        followcnt_inc(db, c_id, mapno); //cnt_follow increase by 1
      }
    });
}

//9-2: 팔로우한 지도의 팔로우 카운트 +1 
const followcnt_inc = function (db, id, mapno, callback) {
  //get udgmap collection
  var collection = db.collection('udgmap');
  //cnt_follow +1
  collection.updateOne({ $and: [{ id: id }, { mapno: mapno }] }, { $inc: { cnt_follow: 1 } },
    function (err, result) {
      if (err) {
          console.error(err);
      } else {
          console.log('increased cnt_follow by 1');
      }
  });
}

const followmap_delete = function (db, id, c_id, mapno, callback) {
  //get user collection
  var collection = db.collection('user');
  //update user document
  collection.updateOne({ "id" : id }, { $pull: { "followmap.mapno" : mapno } },
  function (err, result) {
    if (err) {
        console.error(err);
    } else {
        console.log('unfollow map 성공');
        followcnt_dec(db, c_id, mapno);
    }
  });
}
const followcnt_dec = function (db, id, mapno, callback) {
  //get udgmap collection
  var collection = db.collection('udgmap');
  //cnt_follow +1
  collection.updateOne({ $and: [{ id: id }, { mapno: mapno }] }, { $inc: { cnt_follow: -1, "metrics.orders": 1 } },
    function (err, result) {
      if (err) {
          console.error(err);
      } else {
          console.log('decreased cnt_follow by 1');
      }
  });
}
  
  
//10. 해당 좌표 인근 300미터 내의 지도 찾기, 팔로우가 높은 순으로 찾는다
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
  
//11. 전체 지도 중 공개되어 있는 지도를 리스트로 받기 
const allmaps = function(db, callback) {
    // get udgmap collection 
    var collection = db.collection('udgmap');
    // find maps whose 'visibility' field is true
    collection.find({visibility: true}).toArray(function(err, allmaps) {
        if (err){
            console.error(err);
          } else {
            // console.log("allmaps :");
            // console.log(util.inspect(allmaps,{depth:5}));
            // return the result
            return callback(null, allmaps);
          }
    });
  }
  
//12. 내가 만든 지도 찾기 
const mymaps = function (db, id, callback) {
  // get udgmap collection 
  var collection = db.collection('udgmap');
  // find my maps by id
  collection.find({ id: id }).toArray(function (err, mymaps) {
    if (err) {
      console.error(err);
    } else {
      // console.log("mymaps :");
      // console.log(util.inspect(mymaps, { depth: 5 }));
      // return the result
      return callback(null, mymaps);
    }
  });
}
  
//13. 팔로우 중인 지도 번호 리스트 
const followmaps = function (db, id, callback) {
  // get user collection 
  let collection = db.collection('user');
  // find following maps by id
  try {
    collection.findOne({ id: id }, { projection: { _id: 0, followmap: 1 } })
      .then((result) => { //{ followmap: { mapno: [ 3, 4 ] } }
        if (result) {
          if (result.followmap) {
            var nums = Array.from(new Set(result.followmap.mapno)); // 중복제거  
            console.log("nums:", nums, typeof nums);

            var arr = [];
            for (i = 0; i < nums.length; i++) {
              arr.push({ mapno: nums[i] })
            }
            console.log(arr);
            collection = db.collection('udgmap'); // udgmap 으로 collection switch
            collection.find({ $or: arr }).toArray(function (err, followmaps) { // db.udgmap.find({ $or: [ { mapno: 3 }, { mapno: 4 } ] })
              if (err) { console.error(err) }
              console.log("result:", util.inspect(followmaps, { depth: 5 }))
              return callback(null, followmaps);
            })
          } else {
            return callback(null, null);
          }
        }
      })
  } catch (err) {
    console.error(err)
  }
}

//14. 지도 상세보기 
const detailmap = function (db, mapno, callback) {
  // get udgmap collection 
  var collection = db.collection('udgmap');
  // find a map by id, dname, dcenter
  collection.find({ mapno: mapno }).toArray(function (err, mapdetail) {
      if (err) {
          console.error(err);
      } else {
          // console.log("mapdetail :", util.inspect(mapdetail, { depth: 5 }));
          // return the result
          return callback(null, mapdetail);
      }
  });
}

const isFollowing = function (db, id, mapno, callback) {
  var collection = db.collection('user');

  collection.findOne({ id: id }, { projection: { _id: 0, followmap: 1 } })
    .then((result) => { //{ followmap: { mapno: [ 3, 4 ] } }
    
      var isFollowing = false;
      if(result){
        if (result.followmap){
          var nums = Array.from(new Set(result.followmap.mapno)); // 중복제거  
    
          for (i = 0; i < nums.length; i++) {
            if (nums[i] == mapno) {
              isFollowing = true;
              break;
            }
          }
        }
      }

      return callback(null, isFollowing);
    });
}



var server = http.createServer(function (req, res) {   //create web server
    var _url = req.url;
    var query = url.parse(_url, true).query;
   
    process.setMaxListeners(20);

    if (_url == '/' | _url.startsWith('/mainpage.go')) { //check the URL of the current request
        // set response header
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        // set response content
        fs.readFile(__dirname + '/index.html', function(err, data){
          if(err){
            console.error(err);
          }
          res.end(data, 'utf-8');
        });
  
      } else if (_url.startsWith('/mainpage.do')){
        // set response header
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        allmaps(db, function(err, allmap){
          if(err){
            console.error(err);
          }
          var result = JSON.stringify({allmap:allmap});
          res.end(result,'utf-8');
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
        mymaps(db, query.id, function(err, result){
            var result = JSON.stringify({ result : result })
            res.end(result, 'utf-8'); // 브라우저로 전송
        });
        // res.sendDate(data);
    }
    else if (_url.startsWith("/addmap.do")) {
      let body;
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = JSON.parse(body);
          console.log(post);
          addmap(db, post.newMap, function (err, result) {
            var result = JSON.stringify({ result: result })
            console.log("결과: " + result);
            res.end(result, 'utf-8');
          });
        });
      }
      // res.end('ok'); // 브라우저로 전송
    }
    else if (_url.startsWith("/deletemapbyno.do")) {
      let body;
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = JSON.parse(body);
          console.log(post);
          deletemapByNo(db, post.mapno, function (err, result) {
            var result = JSON.stringify({ result: result })
            console.log("결과: " + result);
          });
        });
      }
      res.end('ok'); // 브라우저로 전송
    }
    else if (_url.startsWith("/deletemapbyid.do")) {
      let body;
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = JSON.parse(body);
          console.log(post);
          deletemapById(db, post.mapno, function (err, result) {
            var result = JSON.stringify({ result: result })
            console.log("결과: " + result);
          });
        });
      }
      res.end('ok'); // 브라우저로 전송
    }
    else if (_url.startsWith("/savemap.do")) {
      let body;
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = JSON.parse(body);
          console.log(post);
          editmap(db, post.saveMap, function (err, result) {
            var result = JSON.stringify({ result: result })
            console.log("결과: " + result);
          });
        });
      }
      res.end('ok'); // 브라우저로 전송
    }
    else if (_url.startsWith("/sharemap.do")) {

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.write('<html><h1>지도 공유 스크립트</h1><br/></html>', 'utf-8');
        res.end();

    }
    else if (_url.startsWith('/myfollowmap.go')) { //check the URL of the current request
      followmaps(db, query.id, function (err, result) {
        var result = JSON.stringify({ result: result })

        console.log(result);
        // res.end(result, 'utf-8'); // 브라우저로 전송
      });
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
    else if (_url.startsWith('/myfollowmap.do')) { //check the URL of the current request
      followmaps(db, query.id, function (err, result) {
        var result = JSON.stringify({ result: result })
        res.end(result, 'utf-8'); // 브라우저로 전송
      });
    }
    else if (_url.startsWith("/signup.go")) {
        // set response header
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        // set response content    
        fs.readFile(__dirname + '/signup.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
                console.error(err); // 에러 발생시 에러 기록하고 종료
            } 
            res.end(data, 'utf-8'); // 브라우저로 전송
        });
    }
    else if (_url.startsWith("/signup.do")) {
      let body;
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = JSON.parse(body);
          console.log(post);
          signup(db, post.newUser, function (err, result) {
            var result = JSON.stringify({ result: result })
            console.log("결과: " + result);
          });
        });
      }
      res.end('ok'); // 브라우저로 전송
    }
    else if (_url.startsWith("/deleteuser.do")) {
      let body;
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = JSON.parse(body);
          console.log(post);
          deleteUser(db, post.delUser, function(err, result){
            if(err){
              console.error(err);
            } else {
              console.log("====================회원 및 지도 삭제 성공");
            }
          })
        });
      }
      res.end('ok'); // 브라우저로 전송
    }
    else if (_url.startsWith("/usermod.go")) {
      // set response header
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      // set response content    
      fs.readFile(__dirname + '/usermod.html', (err, data) => { // 파일 읽는 메소드
        if (err) {
          console.error(err); // 에러 발생시 에러 기록하고 종료
        }
        res.end(data, 'utf-8'); // 브라우저로 전송
      });
    }
    else if (_url.startsWith("/usermod.do")) {
      let body;
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = JSON.parse(body);
          console.log(post);
          updateUser(db, post.modUser, function (err, result) {
            var result = JSON.stringify({ result: result })
            console.log("결과: " + result);
          });
        });
      }
      res.end('ok'); // 브라우저로 전송
    }
    else if (_url.startsWith("/finduserid.do")) {
      let body;
      if (req.method === "POST") {
        req.on('data', data => {
          body = data.toString();
          console.log('body',body)
        });
        req.on('end', () => {
          var post = qs.parse(body);
          findUserId(db, post.id, function (err, result) {
            //console.log("여기서 확인", result.id)
            if (result==undefined){
              res.end('notused', 'utf-8');
            } else {
              res.end('used', 'utf-8'); // 브라우저로 전송
            }
          });
        });
      }
    }
    else if (_url.startsWith("/finduseremail.do")) {
      let body;
      if (req.method === "POST") {
        req.on('data', data => {
          body = data.toString();
          console.log('body',body)
        });
        req.on('end', () => {
          var post = qs.parse(body);
          findUserEmail(db, post.email, function (err, result) {
            //console.log("여기서 확인", result.email)
            if (result==undefined){
              res.end('notused', 'utf-8');
            } else {
              res.end('used', 'utf-8'); // 브라우저로 전송
            }
          });
        });
      }
    }
    else if (_url.startsWith("/signin.do")) {
      let body;
      var userinfo;
      if(req.method ==='POST'){
          req.on('data', data =>{
              body = data.toString();
              console.log("로그인",body)
          });
          req.on('end', () =>{
              userinfo = JSON.parse(body);
              signin(db, userinfo.id, userinfo.pw, function(err, user){
                  if(err){
                      console.log(err)
                  }
                  date = new Date(Date.now() + 24*60*60*1000);
                  date = date.toUTCString();
                  //쿠키가 하루동안 지속되도록 함 
                  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8',
                                       'Set-Cookie' : ['id='+user[0].id+';Expires='+date
                                       ,'pw='+user[0].pw+';Expires='+date
                                       , 'email='+user[0].email+';Expires='+date] });
                  res.end(JSON.stringify(user[0]));
              })
          })
      }
    }
    else if (_url.startsWith("/signout.do")){
      let body;
      var userinfo;
      if (req.method === 'POST') {
          req.on('data', data => {
              body = data.toString();
              console.log('로그아웃', body)
          });
          req.on('end', () => {
              userinfo = JSON.parse(body);
              now = new Date(Date.now());
              now = now.toUTCString(); // 해당 쿠키를 즉시 삭제함
              res.setHeader('Set-Cookie',[
                  'id='+userinfo.id+';Expires='+now
                  , 'pw='+userinfo.pw+';Expires='+now
                  , 'email='+userinfo.email+';Expires='+now
              ]);
              res.end('logout성공?');
          });
      }
  } 
    else if (_url.startsWith("/followmap.do")) {
      let body;
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = qs.parse(body);
          post = JSON.parse(Object.keys(post)[0]);
          console.log(post);
          followmap_add(db, post.id, post.c_id, post.mapno, function (err, result) {
            if (err) {
              console.error(err);
            }
          });
          res.end('ok'); //브라우저로 전송
        });
      }
    }
    else if (_url.startsWith("/unfollowmap.do")) {
      let body;
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = qs.parse(body);
          post = JSON.parse(Object.keys(post)[0]);
          console.log(post);
          followmap_delete(db, post.id, post.c_id, post.mapno, function (err, result) {
            if (err) {
              console.error(err);
            }
          });
          res.end('ok'); //브라우저로 전송
        });
      }
    }
    //지도 검색
    else if (_url.startsWith("/searchmap.do")) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        console.log(query.lat, query.lng)
        var x = Number(query.lat);
        var y = Number(query.lng);
          searchmaps(db, x, y, function(err, searchedMap){
            if(err){
              console.error(err)
            }
            var result = JSON.stringify({searchedMap:searchedMap});
            res.end(result,'utf-8'); //브라우저로 전송
          });
    }
    // 전체 회원 목록
    else if (_url.startsWith("/userlist.go")) {
      // set response header
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      // set response content    
      fs.readFile(__dirname + '/userlist.html', (err, data) => { // 파일 읽는 메소드
          if (err) {
              console.error(err); // 에러 발생시 에러 기록하고 종료
          } 
          res.end(data, 'utf-8'); // 브라우저로 전송
      });
    }
    else if (_url.startsWith("/detailmap.go")) {
      fs.readFile(__dirname + '/detailmap.html', (err, data) => { // 파일 읽는 메소드
        if (err) {
          return console.error(err); // 에러 발생시 에러 기록하고 종료
        }
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8'
          , 'mapno': query.mapno
        })
        res.end(data, 'utf-8'); // 브라우저로 전송
      });
    }
    else if (_url.startsWith("/detailmap.do")) {
      let body;
      var result = {};
      if (req.method === 'POST') {
        req.on('data', data => {
          body = data.toString();
        });
        req.on('end', () => {
          var post = JSON.parse(body);
          console.log(post);
          detailmap(db, post.mapno, function (err, mapdetail) {
            console.log("지도: " + mapdetail[0]);
            result.map = mapdetail[0];

            isFollowing(db, post.id, post.mapno, function (err, isFollowing) {
              if(err){
                console.log("회원정보 없음")
                result.isFollowing = false;
                result = JSON.stringify(result);
                res.end(result, 'utf-8');
              } else {
                console.log("결과: " + isFollowing);
                result.isFollowing = isFollowing;
                result = JSON.stringify(result);
                res.end(result, 'utf-8');
              }
            });
          });
        });
      }
    }
    // 전체 회원 목록
    else if (_url.startsWith("/userlist.do")) {
      findAllUser(db, function (err, result) {
        var result = JSON.stringify({ result: result })
        res.end(result,'utf-8'); //브라우저로 전송
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
        res.end();
    });

});

server.listen(1337, 'localhost'); //6 - listen for any incoming requests

console.log('Node.js web server at port 1337 is running..')




