const MongoClient = require('mongodb').MongoClient; //Файл необходимый для запуска Монго и ее соединения с проектом
const assert = require('assert');
const ObjectId = require('mongodb').ObjectID;

// ненужные вещи сохраненные на всякий
// "C:\Program Files\MongoDB\Server\4.2\bin\mongod.exe" --dbpath="c:\data\db" 
// "C:\Program Files\MongoDB\Server\4.2\bin\mongo.exe"


//основной скрипт обрабатывающий запросы к ДБ

const url = 'mongodb://localhost:27017';
const dbName = 'main';

const client = new MongoClient(url, { useUnifiedTopology: true });
try {
    client.connect();
    console.log("DB connected successfully.");
}
catch (error) {
    console.error("DB not connected!");
}


module.exports.findUserIdByToken = async function (token) {  //поиск возвращающий массив объектов
    const collection = client.db(dbName).collection("tokens");
    try {
        let response = await collection
            .find({ token: token })
            .project({ userId: 1 })
            .toArray()

        return response[0].userId;
    }
    catch (error) {
        return "";
    }
}


module.exports.findLastMessage = async function (searchParameters) {  //поиск возвращающий массив объектов
    const collection = client.db(dbName).collection("messages");

    let response = await collection
    .find(searchParameters)
    .sort({date:-1})
    .limit(1)
    .toArray()

    response = await idConverter([response]);
    return response[0];
}


module.exports.find = async function (collectionName, searchParameters = {}, returnParameters = {}) {  //поиск возвращающий массив объектов
    const collection = client.db(dbName).collection(collectionName);

    let response = await collection
        .find(searchParameters)
        .project(returnParameters)
        .toArray()

    response = await idConverter(response);
    return response;
}


module.exports.update = async function (collectionName, searchParameters = {}, newvalues = {}, ) {     //обновляем объект и возвращаем обновленный 
    const collection = client.db(dbName).collection(collectionName);

    let response = await collection
        .findOneAndUpdate(searchParameters, { newvalues })

    response = await idConverter([response.value]);//idConverter жрет только массивы, потому response отправляем в виде массива
    return response[0];
}

//отличием от update является невозможность делать что-то кроме $set
module.exports.findAndSetNewValues = async function (collectionName, searchParameters = {}, newvalues = {}, ) {     
    const collection = client.db(dbName).collection(collectionName);

    let response = await collection
        .findOneAndUpdate(searchParameters, { $set: newvalues })

    response = await idConverter([response.value]);//idConverter жрет только массивы, потому response отправляем в виде массива
    return response[0];
}

//используется только для инкременирования
module.exports.findAndIncreaseValues = async function (collectionName, searchParameters = {}, newvalues = {}, ) {
    const collection = client.db(dbName).collection(collectionName);

    let response = await collection
        .findOneAndUpdate(searchParameters, { $inc: newvalues })

    response = await idConverter([response.value]);//idConverter жрет только массивы, потому response отправляем в виде массива
    return response[0];
}


module.exports.insert = async function (collectionName, insertingData)                          //вставляем объект и возвращаем его же
{
    const collection = client.db(dbName).collection(collectionName);

    let response = await collection
        .insertOne(insertingData)

    response = await idConverter([response.ops]); //idConverter жрет только массивы, потому response отправляем в виде массива
    return response[0];

}


module.exports.delete = async function (collectionName, toBeDeletedObjectId)                          //удаление объекта
{
    const collection = client.db(dbName).collection(collectionName);

    let response = await collection
        .deleteOne({ _id: ObjectId(toBeDeletedObjectId) });

    return response;
}


async function idConverter(data)  //микросервис исправляющий _id на id
{
    for (let i of data) {
        i.id = i._id;
        delete i._id;
    }
    return data;
}


module.exports.clearTokenbase = async function () //полная очистка всех токенов
{
    const collection = client.db(dbName).collection("tokens");

    let res = await collection
        .deleteMany();

    console.log("Tokens deleted!");
    return res;
}


