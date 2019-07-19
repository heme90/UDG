var userDB = require('../database/users');

exports.getUsers = getUsers;
exports.getUser = getUser;

// 전체 회원 목록 반환
function getUsers(callback) {
    setTimeout(function () {
        callback(null, userDB);
    }, 500);
}

// 특정 회원 목록 반환
function getUser(userId, callback) {
    getUsers(function (error, data) {
        if (error) {
            return callback(error);
        }

        var result = data.find(function (item) {
            return item.id === userId;
        });

        callback(null, result);
    });
}