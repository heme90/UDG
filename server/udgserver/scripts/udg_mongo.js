const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
var util = require('util');
// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'udg';
var db;
// Create a new MongoClient
const client = new MongoClient(url, {useNewUrlParser: true});
var collection;
// Use connect method to connect to the Server
exports.connect = client.connect(function(err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  db = client.db(dbName);

});

//find user by id, pw for login
exports.login = function(db,id,pw, callback) {
  // get user collection 
  collection = db.collection('user');
  // find user by id, pw
  collection.find({$and : [{id : id}, {pw: pw}]}).toArray(function(err, userinfo) {
      assert.equal(err, null);
      console.log("found user :");
      console.log(userinfo); //dcenter : [Array]
      // return the result
      callback(userinfo); 
  });
}

//insert new user info when signing up
exports.signup = function(db, id, pw, email) {
  //get user collection
  collection = db.collection('user');
  //insert new userinfo
  collection.insertOne({id:id, pw:pw, email:email}).then(function(err,result){
    //assert.equal(err,null);
    //assert.equal(1,results.result.n);
    //assert.equal(1,results.ops.length);
    console.log('Inserted the new user')
    callback(result);
  });
};

//makemap.do > 
//1 :make a new map
exports.addmap_udg = function(db,id,dname,x,y,o, callback){
  //get udgmap collection
  collection = db.collection('udgmap');
  //insert a new map
  collection.insertOne({id:id, dname:dname, dcenter:[x,y], onlyme:o, cnt_follow:0, markers:[]}, function(err,result){
    console.log('inserted mymap in udgmap');
    callback(result);
  });
}
//2: add a map in user document
exports.addmap_user = function(db,id,dname,x,y, callback){
  //get user collection
  collection = db.collection('user');
  //add a new map
  collection.updateOne({id:id}
    ,{ $set: {'mymap.creator': id, 'mymap.dname': dname, 'mymap.dcenter': [x,y] } }, function(err,result){
    console.log('added a map in user mymap');
    callback(result);
  });
}


//searchmap.do > find shared maps of certain location, sorted by cnt_follow
exports.searchmaps = function(db,x,y, callback) {
  // get udgmap collection 
  collection = db.collection('udgmap');
  // find shared maps at the point of [x,y]
  collection.find({$and :[{dcenter:[x,y]},{onlyme: 0}]}).sort({cnt_follow: -1}).toArray(function(err, foundmaps) {
      assert.equal(err, null);
      console.log("found maps :");
      //console.log(foundmaps); // markers: [ [Object], [Object] ]
      console.log(util.inspect(allmaps,{depth:5}));

      // return the result
      callback(foundmaps); 
  });
}

//mainpage.go > find all maps that is shared
exports.allmaps = function(db, callback) {
  // get udgmap collection 
  collection = db.collection('udgmap');
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

//mymap.go > find my maps by id
exports.mymaps = function(db,id, callback) {
  // get udgmap collection 
  collection = db.collection('udgmap');
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
