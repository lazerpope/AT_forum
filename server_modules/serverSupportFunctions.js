const ObjectId = require('mongodb').ObjectID;
const showLog = true;


module.exports.createTopic = function (title, description, userId) {
    let obj = {}
    obj.title = title;
    obj.description = description;
    obj.date = new Date();
    obj.messagesCount = 0;
    obj.userId = ObjectId(userId);
    obj.weight = 0;
    return obj;
}


module.exports.createMessage = function (text, userId, topicId) {
    let obj = {}
    obj.userId = ObjectId(userId);
    obj.topicId = ObjectId(topicId);
    obj.date = new Date();
    obj.text = text;
    obj.likesCount = 0;
    obj.isLikedByMe = false;
    return obj;
}


module.exports.createUser = function (firstName, lastName, email, login, password) {
    let obj = {}
    obj.firstName = firstName;
    obj.lastName = lastName;
    obj.email = email;
    obj.login = login;
    obj.password = password;
    obj.role = "user";
    obj.date = new Date();
    return obj;
}

module.exports.sortResponseByWeight = function (arr) {
    for (let j = arr.length - 1; j > 0; j--) {
        for (let i = 0; i < j; i++) {
            if (arr[i].weight < arr[i + 1].weight) {
                let temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i + 1] = temp;
            }
        }
    }
}

module.exports.reqLog = function (number, req) {
    if (showLog) console.log("Request(" + number + "): " + req);

}

module.exports.resLog = function (number, res) {
    if (showLog) console.log("Response(" + number + "): " + res);
}


module.exports.errorLog = function (number, errorNumber) {
    if (showLog) switch (errorNumber) {
        case 1:
            console.log("Error(" + number + "): User не найден");
            break;
        case 2:
            console.log("Error(" + number + "): Неправильный логин/пароль.");
            break;
        case 3:
            console.log("Error(" + number + "): ID не валиден");
            break;
        case 4:
            console.log("Error(" + number + "): Ты тут не админ, не гражданин и даже не ПАЛЛАДИН!");
            break;
        case 5:
            console.log("Error(" + number + "): Строка слишком длинная или содержит запрещенные символы.");
            break;

        default:
            console.log("Error(" + number + "): Какая-то ошибка.");
            break;
    }
}
