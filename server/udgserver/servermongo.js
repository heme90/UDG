var http = require('http'); // Import Node.js core module
var fs = require('fs');
var url = require('url');
//var mong = require('./scripts/udg_mongo.js')
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var util = require('util');
// Connection URL
const mongourl = 'mongodb://localhost:27017';




// Database Name

// Create a new MongoClient
const client = new MongoClient(mongourl, {useNewUrlParser: true});
let db;
client.connect(function(err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  db = client.db('udg');

  //여기서 테스트를 원하는 function 호출
});

var server = http.createServer(function (req, res) {   //create web server
    var _url = req.url
    var qurey = url.parse(req.url,true).query;
    process.setMaxListeners(20);
    
    if (_url == '/') { //check the URL of the current request
        
        // set response header
        res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'});
        // set response content    
        fs.readFile(__dirname + '/test.html', (err, data) => { // 파일 읽는 메소드
            if (err) {
              return console.error(err); // 에러 발생시 에러 기록하고 종료
            }
            res.end(data, 'utf-8'); // 브라우저로 전송
          });
    
    } else if (_url.startsWith('/signup.do')) { //check the URL of the current request
      signup(db,qurey.id,qurey.pw,qurey.email);
      res.end("<h1>" + _url + "</h1>");
    } else if (_url.startsWith('/signin.do')) { //check the URL of the current request
      signin(db,qurey.id,qurey.pw);
      res.end("<h1>" + _url + "</h1>");
    } else if (_url.startsWith('/addmap.do')) { //check the URL of the current request
      addmap_udg(db,qurey.id,qurey.dname,qurey.x,qurey.y,1);
      res.end("<h1>" + _url + "</h1>");
    } else if (_url.startsWith('/sharemap.do')) { //check the URL of the current request
      shared(db,qurey.id,qurey.dname,qurey.x,qurey.y);
      res.end("<h1>" + _url + "</h1>");
    } else if (_url.startsWith('/followmap.do')) { //check the URL of the current request
      followmap_add(db,query.id,query.c_id,query.dname,query.x,query.y);
      res.end("<h1>" + _url + "</h1>");
    } else if (_url.startsWith('/mapcntinc.do')) { //check the URL of the current request
      followcnt_inc(db,qurey.id,qurey.dname,qurey.x,qurey.y);
      res.end("<h1>" + _url + "</h1>");
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




// Use connect method to connect to the Server

//1. signin.do : find user by id, pw for login
const signin = function(db,id,pw, callback) {
  // get user collection 
  const collection = db.collection('user');
  // find user by id, pw
  collection.find({$and : [{id : id}, {pw: pw}]}).toArray(function(err, userinfo) {
      assert.equal(err, null);
      console.log("found user :");
      console.log(userinfo); //dcenter : [Array]
      // return the result
      callback(userinfo); 
  });
}

//2. signup.do : insert new user info when signing up
const signup = function(db, id, pw, email, callback){
  //get user collection
  const collection = db.collection('user');
  //insert new userinfo
  collection.insertOne({id:id, pw:pw, email:email}).then(function(err,result){
    //assert.equal(err,null);
    //assert.equal(1,results.result.n);
    //assert.equal(1,results.ops.length);
    console.log('Inserted the new user')
    callback(result);
  });
}

//3. makemap.do : 
//3-1 :make a new map in udgmap collection
const addmap_udg = function(db,id,dname,x,y,o, callback){
  //get udgmap collection
  const collection = db.collection('udgmap');
  //insert a new map
  collection.insertOne({id:id, dname:dname, dcenter:[x,y], onlyme:o, cnt_follow:0, markers:[]}, function(err,result){
    console.log('inserted mymap in udgmap');
    callback(result);
  });
}
//3-2: add a map in user document in user collection
const addmap_user = function(db,id,dname,x,y, callback){
  //get user collection
  const collection = db.collection('user');
  //add a new map
  collection.updateOne({id:id}
    ,{ $set: {'mymap.creator': id, 'mymap.dname': dname, 'mymap.dcenter': [x,y] } }, function(err,result){
    console.log('added a map in user mymap');
    callback(result);
  });
}

// 4. savemap.do : save new markers on an existing map
const addmarkers = function(db,id,dname,x,y,markers, callback){
  //get udgmap collection
  const collection = db.collection('udgmap');
  //for forEach
  var mks = markers['mks']; 
  //object{"title" : "1","lat" : 37.484781,"lng" : 127.0162, "desc" : {"con" : "no.1"}}
  //markers 원형은 아래 참고 
  mks.forEach(function(items,index){
    collection.updateOne({id:id, dname:dname,dcenter:[x,y]}
      ,{ $push: {markers: {title: items.title
      , lat:items.lat, lng:items.lng
      , desc : {content:items.desc.con}}}}, function(err,result){
      assert.equal(1, result.result.n);
      console.log('added a marker in the map');
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
  const collection = db.collection('udgmap');
  //set the map shared
  collection.updateOne({id:id, dname: dname, dcenter:[x,y]}, {$set: {onlyme:0}}, function(err, result){
    assert.equal(1,result.result.n);
    console.log('the map is shared now');
    callback(result);
  });
}



//6. followmap.do : add a map to the user's follow field
//6-1: user collection update
const followmap_add = function(db,id,c_id, dname, x,y, callback){
  //get user collection
  const collection = db.collection('user');
  //update user document
  collection.updateOne({id:id}
    ,{$set:{'follow.creator':c_id, 'follow.dname':dname, 'follow.dcenter':[x,y]}}, function(err,result){
    console.log('added a map in user followmap');
  });
}

//6-2: udgmap collection update - cnt_follow +1
const followcnt_inc = function(db,id, dname, x,y, callback){
  //get udgmap collection
  const collection = db.collection('udgmap');
  //cnt_follow +1
  collection.updateOne({id:id, dname: dname, dcenter:[x,y]},{$inc:{cnt_follow:1}}, function(err,result){
    console.log('increased cnt_follow by 1');
  });
}


//7. searchmap.do : find shared maps of certain location, sorted by cnt_follow
const searchmaps = function(db,x,y, callback) {
  // get udgmap collection 
  const collection = db.collection('udgmap');
  // find shared maps at the point of [x,y]
  collection.find({$and :[{dcenter:[x,y]},{onlyme: 0}]}).sort({cnt_follow: -1}).toArray(function(err, foundmaps) {
      assert.equal(err, null);
      console.log("found maps :");
      //console.log(foundmaps); // markers: [ [Object], [Object] ]
      console.log(util.inspect(foundmaps,{depth:5}));
      // return the result
      callback(foundmaps); 
  });
}

//8. mainpage.go : find all maps that is shared
const allmaps = function(db, callback) {
  // get udgmap collection 
  const collection = db.collection('udgmap');
  // find maps whose 'onlyme' field is 0
  collection.find({onlyme: 0}).toArray(function(err, allmaps) {
      assert.equal(err, null);
      console.log("all maps :");
      //console.log(allmaps);
      //console.log('%j', allmaps);
      console.log(util.inspect(allmaps,{depth:5}));
      // return the result
      callback(allmaps); 
  });
}

//9. mymap.go : find my maps by id
const mymaps = function(db,id, callback) {
  // get udgmap collection 
  const collection = db.collection('udgmap');
  // find my maps by id
  collection.find({id: id},{mymap:1}).toArray(function(err, mymaps) {
      assert.equal(err, null);
      console.log("mymaps :");
      //console.log(mymaps);
      console.log(util.inspect(mymaps,{depth:5}));
      // return the result
      callback(mymaps); 
  });
}


//10. myfollowmap.go : find my following maps by id
const followmaps = function(db, id, callback) {
  // get user collection 
  const collection = db.collection('user');
  // find following maps by id
  var ft = { followmap: 1}
  collection.find({id: id}, {projection:ft}).toArray(function(err, followmaps) {
      assert.equal(err, null);
      console.log("followmaps :");
      //console.log(followmaps);
      console.log(util.inspect(followmaps,{depth:5}));
      // return the result
      callback(followmaps); 
  });
}






