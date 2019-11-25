//файл служит ТОЛЬКО для загрузки данных в дб в полу-ручном режиме




const MongoClient = require('mongodb').MongoClient; //Файл необходимый для запуска Монго и ее соединения с проектом
const assert = require('assert');
const ObjectId = require('mongodb').ObjectID;
// ран эту хуйню в параллельной командной строке до запуска монго 
//  "C:\Program Files\MongoDB\Server\4.2\bin\mongod.exe" --dbpath="c:\data\db" 


const url = 'mongodb://localhost:27017';
const dbName = 'main';

const client = new MongoClient(url);

let topics =
    [
        {
            id: "1",
            title: "Го Дота",
            description: "Посоны, душа катку требует. Я - кор-роль не забудьте дать танго и фласку.",
            date: "3",
            messagesCount: 0,
            userId: "3",
            weight: 4,
            lastMessage: null
        },
        {
            id: "2",
            title: "Идем играть в шахматы.",
            description: "Шахматный клуб(попойка) открывется сегодня в 6!",
            date: "2",
            messagesCount: 3,
            userId: "2",
            weight: 66,
            lastMessage: {
                id: "4",
                topicId: "2",
                userId: "3",
                date: "666",
                text: "Отличная идея =)",
                likesCount: 3,
                isLikedByMe: false
            }
        },
        {
            id: "3",
            title: "Праздник в честь дня морфлота!.",
            description: "Сегодня вечером устраиваем Голладнский штурвал в 7!",
            date: "25",
            messagesCount: 1,
            userId: "1",
            weight: 666,
            lastMessage: {
                id: "1",
                topicId: "3",
                userId: "2",
                date: "666",
                text: "Я иду!",
                likesCount: 1,
                isLikedByMe: false
            }
        }
    ]

let messages =
    [
        {
            id: "1",
            topicId: "3",
            userId: "2",
            date: "666",
            text: "Я иду!",
            likesCount: 1,
            isLikedByMe: false
        },
        {
            id: "2",
            topicId: "2",
            userId: "1",
            date: "6",
            text: "Супер!",
            likesCount: 1,
            isLikedByMe: false
        },
        {
            id: "3",
            topicId: "2",
            userId: "2",
            date: "66",
            text: "С меня пешки!",
            likesCount: 2,
            isLikedByMe: false
        },
        {
            id: "4",
            topicId: "2",
            userId: "3",
            date: "666",
            text: "Отличная идея =)",
            likesCount: 3,
            isLikedByMe: false
        }
    ]


  client.connect(function (err) {
        console.log('yes1')
        assert.equal(null, err);
        const collection = client.db(dbName).collection('messages');

        collection.insertMany(messages,function(err1,result)
        {
                console.log('yes2')
        });
            
        console.log('yes3')
        client.close();
    });








