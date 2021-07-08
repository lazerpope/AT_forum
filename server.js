const express = require('express');
const app = express();
const uuidv4 = require('uuid/v4'); //для работы UUIDv4 (создает уникальные токены)
app.use(express.static(__dirname + '/public')); // для статических страниц
app.use(express.json()); // разрешаем обмен в формате JSON
app.use(express.urlencoded({ extended: false })); // обработка AJAX-запроса
var cors = require('cors');
app.use(cors());

app.get('/test', async (req, res) => {
  
  res.send({response:"responseFromServer"});
});


app.listen(3000, () => {
  console.log('App listening on port: 3000!');
});
