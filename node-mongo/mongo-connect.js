var mongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/udg';
var db;
mongoClient.connect(url, function (err, database){
    if (err){
        console.error('MongoDB 연결 실패', err);
        return;
    }

    db = database;
    console.log('연결 성공', user);
});

