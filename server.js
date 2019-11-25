const express = require('express');
const app = express();
const uuidv4 = require('uuid/v4'); //для работы UUIDv4 (создает уникальные токены)
app.use(express.static(__dirname + '/public')); // для статических страниц
app.use(express.json()); // разрешаем обмен в формате JSON
app.use(express.urlencoded({ extended: false })); // обработка AJAX-запроса
const dbModule = require('./dataBaseSpinner.js');
const validator = require('./server_modules/validator.js');
const ObjectId = require('mongodb').ObjectID;
var cors = require('cors');
app.use(cors());
const serverSupportFunctions = require('./server_modules/serverSupportFunctions.js')
let { reqLog, resLog, errorLog, createMessage, createUser, createTopic, responseBubbleSort} = serverSupportFunctions;

let requestCounter = 0;

app.get('/login', async function (req, res) {                                                            //обрабатываем запрос /login
  // dbModule.clearTokenbase();  // не трожь, оно тебя сожрет!

  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, "/login" + JSON.stringify(req.query));

  let dbResponse = await dbModule.find("users", { password: req.query.password, login: req.query.login }, { _id: 1 });
  if (!dbResponse.length == 1) {//если длина массива равна единице значит юзер найден
    errorLog(currentRequestNumber, 2);
    res.send({ error: { code: 2, description: "Неправильный логин/пароль." } });
    return;
  }

  let newToken = uuidv4();  //сгенерировали новый токен
  dbModule.insert("tokens", { userId: dbResponse[0].id, token: newToken, creationDate: new Date });     //записали новый токен в DB

  resLog(currentRequestNumber, "User found: " + dbResponse[0].id + ", Token generated: " + newToken);
  res.send({ response: newToken });  //все ок. Отправка результата      
});


app.get('/getTopics', async function (req, res)//обрабатываем запрос /getTopics
{
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /getTopics " + JSON.stringify(req.query));

  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let dbResponse = await dbModule.find("topics");
  let i = 0;
  while (i < dbResponse.length) {
    let lastMessage = await dbModule.findLastMessage({ topicId: ObjectId(dbResponse[i].id) });
    dbResponse[i].lastMessage = lastMessage[0] || null;
    dbResponse[i].weight = dbResponse[i].messagesCount * 2;
    i++;
  }

  responseBubbleSort(dbResponse);

  resLog(currentRequestNumber, "Topics sent : " + dbResponse.length);
  res.send({ response: dbResponse });                            //все ок. Отправка результата
});


app.get('/getMessages', async function (req, res)                                                    //обрабатываем запрос /getMessages
{
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /getMessages" + JSON.stringify(req.query));

  if (!validator.isObjectIdValid(req.query.id)) {//проверяем id на валидность
    errorLog(currentRequestNumber, 3);
    res.send({ error: { code: 3, description: "ID не валиден." } });
    return;
  }
  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let dbResponse = await dbModule.find("messages", { topicId: ObjectId(req.query.id) });

  let i = 0;
  while (i < dbResponse.length) {
    let user = await dbModule.find("users", { _id: ObjectId(dbResponse[i].userId) }, { password: 0, login: 0 });
    dbResponse[i].user = user[0] || null;
    i++;
  }

  resLog(currentRequestNumber, "Messages in current topic: " + dbResponse.length)
  res.send({ response: dbResponse });              //все ок. Отправка результата  
});


app.get('/createTopic', async function (req, res)                                                    //обрабатываем запрос /createTopic
{
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /createTopic" + JSON.stringify(req.query));

  if (!validator.isTitleValid(req.query.title)) {              //проверяем title на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isDescriptionValid(req.query.description)) {              //проверяем description на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Строка слишком длинная или содержит запрещенные символы." } });
    return;
  }

  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let newTopic = createTopic(req.query.title, req.query.description, currentUserId);
  dbResponse = await dbModule.insert("topics", newTopic);

  resLog(currentRequestNumber, " " + dbResponse);
  res.send({ response: dbResponse });              //все ок. Отправка результата      
});


app.get('/updateTopic', async function (req, res)  //обрабатываем запрос /updateTopic 
{
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /updateTopic" + JSON.stringify(req.query));

  if (!validator.isTitleValid(req.query.title)) {//проверяем title на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Строка слишком длинная или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isDescriptionValid(req.query.description)) {//проверяем description на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Строка слишком длинная или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isObjectIdValid(req.query.id)) {//проверяем id на валидность
    errorLog(currentRequestNumber, 3);
    res.send({ error: { code: 3, description: "ID не валиден." } });
    return;
  }

  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let isAdmin = await validator.isUserAdmin(currentUserId);
  let isCreator = await validator.isUserCreatorOfTopic(currentUserId, req.query.id);
  if (!isAdmin && !isCreator) {
    errorLog(currentRequestNumber, 4);
    res.send({ error: { code: 4, description: "Ты тут не админ, не гражданин и даже не ПАЛЛАДИН!" } });
    return;
  }

  let dbResponse = await dbModule.setNewValues("topics", { _id: ObjectId(req.query.id) }, { title: req.query.title, description: req.query.description });

  resLog(currentRequestNumber, " " + dbResponse);
  res.send({ response: dbResponse });
});


app.get('/deleteTopic', async function (req, res)                                                    //обрабатываем запрос /deleteTopic
{
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /deleteTopic" + JSON.stringify(req.query));

  if (!validator.isObjectIdValid(req.query.id)) { //проверяем id на валидность
    errorLog(currentRequestNumber, 3);
    res.send({ error: { code: 3, description: "ID не валиден." } });
    return;
  }

  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let isAdmin = await validator.isUserAdmin(currentUserId);
  let isCreator = await validator.isUserCreatorOfTopic(currentUserId, req.query.id);
  if (!isAdmin && !isCreator) {
    errorLog(currentRequestNumber, 4);
    res.send({ error: { code: 4, description: "Ты тут не админ, не гражданин и даже не ПАЛЛАДИН!" } });
    return;
  }


  let dbResponse = await dbModule.delete("topics", req.query.id);
  resLog(currentRequestNumber, " " + dbResponse.result.ok)
  res.send({ response: true });              //все ок. Отправка результата   
});


app.get('/createMessage', async function (req, res)   //обрабатываем запрос /createMessage  (token,topicId, text)
{
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /createMessage" + JSON.stringify(req.query));

  if (!validator.isMessageTextValid(req.query.text)) {//проверяем description на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Строка слишком длинная или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isObjectIdValid(req.query.topicId)) {//проверяем id на валидность
    errorLog(currentRequestNumber, 3);
    res.send({ error: { code: 3, description: "ID не валиден." } });
    return;
  }

  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let dbResponse = await dbModule.findAndIncreaseValues("topics", { _id: ObjectId(req.query.topicId) }, { messagesCount: 1 });
  dbResponse = await dbModule.insert("messages", createMessage(req.query.text, currentUserId, req.query.topicId));

  resLog(currentRequestNumber, " " + dbResponse);
  res.send({ response: dbResponse });              //все ок. Отправка результата      
});


app.get('/updateMessage', async function (req, res)//обрабатываем запрос /updateMessage (token, id,  text)
{
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /updateMessage" + JSON.stringify(req.query));

  if (!validator.isMessageTextValid(req.query.text)) {//проверяем text сообщения на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Строка слишком длинная или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isObjectIdValid(req.query.id)) { //проверяем id на валидность
    errorLog(currentRequestNumber, 3);
    res.send({ error: { code: 3, description: "ID не валиден." } });
    return;
  }

  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let isAdmin = await validator.isUserAdmin(currentUserId);
  let isCreator = await validator.isUserCreatorOfMessage(currentUserId, req.query.id);
  if (!isAdmin && !isCreator) {
    errorLog(currentRequestNumber, 4);
    res.send({ error: { code: 4, description: "Ты тут не админ, не гражданин и даже не ПАЛЛАДИН!" } });
    return;
  }

  let dbResponse = await dbModule.findAndSetNewValues("messages", { _id: ObjectId(req.query.id) }, { text: req.query.text });

  resLog(currentRequestNumber, " " + dbResponse);
  res.send({ response: dbResponse });
});


app.get('/deleteMessage', async function (req, res) {//обрабатываем запрос /deleteMessage    (token, id)
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /deleteMessage" + JSON.stringify(req.query));

  if (!validator.isObjectIdValid(req.query.id)) {//проверяем id на валидность
    errorLog(currentRequestNumber, 3);
    res.send({ error: { code: 3, description: "ID не валиден." } });
    return;
  }

  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let isAdmin = await validator.isUserAdmin(currentUserId);
  let isCreator = await validator.isUserCreatorOfMessage(currentUserId, req.query.id);
  if (!isAdmin && !isCreator) {
    errorLog(currentRequestNumber, 4);
    res.send({ error: { code: 4, description: "Ты тут не админ, не гражданин и даже не ПАЛЛАДИН!" } });
    return;
  }

  //находим сообщение по id чтобы считать с него topicId
  let dbResponse = await dbModule.find("messages", { _id: ObjectId(req.query.id) });
  //декреминируем likesCount у найденного топика
  dbResponse = await dbModule.findAndIncreaseValues("topics", { _id: ObjectId(dbResponse[0].topicId) }, { messagesCount: -1 });
  dbResponse = await dbModule.delete("messages", req.query.id);

  resLog(currentRequestNumber, " " + dbResponse.result.ok)
  res.send({ response: true });              //все ок. Отправка результата   
});


app.get('/createUser', async function (req, res)  //обрабатываем запрос /createUser (token, firstname, lastName, email, login, password, role)
{
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /createUser" + JSON.stringify(req.query));

  if (!validator.isUserNameValid(req.query.firstName)) { //проверяем firstName на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isUserNameValid(req.query.lastName)) {  //проверяем lastName на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isUserEMailValid(req.query.email)) {  //проверяем email на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isUserLoginValid(req.query.login)) {  //проверяем login на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isUserPasswordValid(req.query.password)) {//проверяем password на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }

  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let isAdmin = await validator.isUserAdmin(currentUserId);
  if (!isAdmin) {
    errorLog(currentRequestNumber, 4);
    res.send({ error: { code: 4, description: "Ты тут не админ, не гражданин и даже не ПАЛЛАДИН!" } });
    return;
  }

  let newUser = createUser(req.query.firstName, req.query.lastName, req.query.email, req.query.login, req.query.password);
  dbResponse = await dbModule.insert("users", newUser);

  resLog(currentRequestNumber, " " + dbResponse);
  res.send({ response: dbResponse });              //все ок. Отправка результата      
});


app.get('/updateUser', async function (req, res)  //обрабатываем запрос /updateUser   (token, id, firstname, lastName, email, login, password, role)
{
  requestCounter++;
  let currentRequestNumber = requestCounter;
  reqLog(currentRequestNumber, " /createUser" + JSON.stringify(req.query));

  if (!validator.isUserNameValid(req.query.firstName)) { //проверяем firstName на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isUserNameValid(req.query.lastName)) {  //проверяем lastName на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isUserEMailValid(req.query.email)) {  //проверяем email на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isUserLoginValid(req.query.login)) {  //проверяем login на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isUserPasswordValid(req.query.password)) {//проверяем password на валидность
    errorLog(currentRequestNumber, 5);
    res.send({ error: { code: 5, description: "Название слишком длинное или содержит запрещенные символы." } });
    return;
  }
  if (!validator.isObjectIdValid(req.query.id)) {//проверяем id на валидность
    errorLog(currentRequestNumber, 3);
    res.send({ error: { code: 3, description: "ID не валиден." } });
    return;
  }

  let currentUserId = await dbModule.findUserIdByToken(req.query.token); //находим id юзера создавшего запрос
  if (currentUserId.length == 0) {
    errorLog(currentRequestNumber, 1);
    res.send({ error: { code: 1, description: "User не найден." } });
    return;
  }

  let isAdmin = await validator.isUserAdmin(currentUserId);
  let isCreator = await validator.isUserCreatorOfUser(req.query.id, currentUserId);
  if (!isAdmin && !isCreator) {
    errorLog(currentRequestNumber, 4);
    res.send({ error: { code: 4, description: "Ты тут не админ, не гражданин и даже не ПАЛЛАДИН!" } });
    return;
  }

  let dbResponse = await dbModule.findAndSetNewValues("users", { _id: ObjectId(req.query.id) }, { firstName: req.query.firstName, lastName: req.query.lastName, email: req.query.email, login: req.query.login, password: req.query.password });

  resLog(currentRequestNumber, " " + dbResponse);
  res.send({ response: dbResponse });
});


app.get('/test', async function (req, res)                                                          //отладочная чать (впоследствии будет удалена)
{


  res.send("a");

});


app.listen(3000, function ()    //запуск сервера
{
  console.log('App listening on port: 3000!');
});
