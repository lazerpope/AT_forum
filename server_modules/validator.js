const dbModule = require('../dataBaseSpinner.js');
const ObjectId = require('mongodb').ObjectID;

const minimumTitleLength = 1; //указываем ограницения на длину строки для title description и тд.
const maximumTitleLength = 60;

const minimumDescriptionLength = 0;
const maximumDescriptionLength = 1000;

const minimumMessageTextLength = 1;
const maximumMessageTextLength = 1000;

const requiredObjectIdLength = 24; //всегда 24!

const minimumNameLength = 1;
const maximumNameLength = 20;

const minimumEMailLength = 5;
const maximumEMailLength = 40;

const minimumLoginLength = 6;
const maximumLoginLength = 20;

const minimumPasswordLength = 6;
const maximumPasswordLength = 20;

module.exports.isUserAdmin = async function (id) {//валидатор токенов админа   
    let dbResponse = await dbModule.find("users", { _id: ObjectId(id) }, { role: 1 });
    if (dbResponse[0].role != "admin") {
        console.log("Error: User is not an admin.");
        return false;
    }
    return true;
}

module.exports.isUserCreatorOfTopic = async function (userId, topicId) {//валидатор токенов создателя
    let dbResponse = await dbModule.find("topics", { _id: ObjectId(topicId) }, { userId: 1 });
    if (dbResponse.length == 0) {
        console.log("Error: User is not an creator of topic.");
        return false;
    }
    if (String(dbResponse[0].userId) == String(userId)) {
        console.log(" User is an creator of topic.");
        return true;
    }
    console.log("Error: User is not an creator of topic.");
    return false;
}

module.exports.isUserCreatorOfMessage = async function (userId, topicId) {//валидатор токенов создателя
    let dbResponse = await dbModule.find("messages", { _id: ObjectId(topicId) }, { userId: 1 });
    if (dbResponse.length == 0) {
        console.log("Error: User is not an creator of message.");
        return false;
    }
    if (String(dbResponse[0].userId) == String(userId)) {
        console.log(" User is an creator of message.");
        return true;
    }
    console.log("Error: User is not an creator of message.");
    return false;
}

module.exports.isUserCreatorOfUser = async function (userId, currentId) {//валидатор токенов создателя

    if (userId == currentId) {
        console.log("User is an creator of user.");
        return true;
    }

    console.log("Error: User is not an creator of user.");
    return false;
}

module.exports.isObjectIdValid = function (id) {//валидатор ID (только латинские обоих регистров + цифры. В сумме 24 символа)
    let allowedСharacters = new RegExp('^[a-zA-Z0-9]+$');
    try {
        if (allowedСharacters.test(id) && id.length == requiredObjectIdLength) {
            return true;
        }
    } catch (error) {
        return false;
    }
}

module.exports.isTitleValid = function (text) { //валидатор title
    if (text.length <= maximumTitleLength && text.length >= minimumTitleLength) {
        return true;
    }
    return false;
}

module.exports.isDescriptionValid = function (text) {//валидатор description 
    if (text.length <= maximumDescriptionLength && text.length >= minimumDescriptionLength) {
        return true;
    }
    return false;
}

module.exports.isMessageTextValid = function (text) {//валидатор text of message 
    if (text.length <= maximumMessageTextLength && text.length >= minimumMessageTextLength) {
        return true;
    }
    return false;
}

module.exports.isUserNameValid = function (text) {//валидатор firstName и lastName
    if (text.length <= maximumNameLength && text.length >= minimumNameLength) {
        return true;
    }
    return false;
}
module.exports.isUserEMailValid = function (text) {//валидатор e-mail
    if (text.length >= maximumEMailLength && text.length >= minimumEMailLength) {

        return false;
    }
    if (!text.includes("@") || !text.includes(".")) {
        return false;
    }
    return true;
}
module.exports.isUserLoginValid = function (text) {//валидатор Login
    let allowedСharacters = new RegExp('^[a-zA-Z0-9]+$');
    if (allowedСharacters.test(text) && text.length <= maximumLoginLength && text.length >= minimumLoginLength) {
        return true;
    }
    return false;
}
module.exports.isUserPasswordValid = function (text) {//валидатор Password
    let allowedСharacters = new RegExp('^[a-zA-Z0-9]+$');
    if (allowedСharacters.test(text) && text.length <= maximumPasswordLength && text.length >= minimumPasswordLength) {
        return true;
    }
    return false;
}
