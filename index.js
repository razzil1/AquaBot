'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const schedule = require('node-schedule');
const mongoose = require('mongoose');
const UserSchema = require('./User');
const User = mongoose.model('UserSchema');
require('dotenv').config({ path: 'variables.env' });

mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (err) => {
  console.error(`Connect to database. error message: ${err.message}`);
});

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
});

app.post('/webhook/', async function (req, res) {
  let messaging_events = req.body.entry[0].messaging
  // console.log("This is what you get: %j", req.body);

  for (let i = 0; i < messaging_events.length; i++) {
    let event = req.body.entry[0].messaging[i]
    let sender = event.sender.id

    if(event.message && event.message['quick_reply']) {
      let payload = event.message['quick_reply'].payload;

      if (payload === 'Once') {
        addUser(sender, 1);
        await sendTextMessage(sender, "I will remind you once a day.");
        await sendTextMessage(sender, "If you don\'t want to receive a reminder type 'unsubscribe'");
        continue;
      }

      if (payload === 'Twice') {
        addUser(sender, 2);
        await sendTextMessage(sender, "I will remind you twice a day.");
        await sendTextMessage(sender, "If you don\'t want to receive a reminder type 'unsubscribe'");
        continue;
      }

      if (payload === 'Three times') {
        addUser(sender, 3);
        await sendTextMessage(sender, "I will remind you three times a day");
        await sendTextMessage(sender, "If you don\'t want to receive a reminder type 'unsubscribe'");
        continue;
      }

      if (payload === '1-2 cups') {
        await sendImage(sender, process.env.IMAGE_LOW);
        await sendTextMessage(sender, "Recommended amount of water per day is eight 8-ounce glasses, equals to about 2 liters, or half a gallon.");
        await sendTextMessage(sender, "If you want me to remind you type 'remind'");
        continue;
      }

      if (payload === '3-5 cups') {
        await sendImage(sender, process.env.IMAGE_OK);
        await sendTextMessage(sender, "Recommended amount of water per day is eight 8-ounce glasses, equals to about 2 liters, or half a gallon.");
        await sendTextMessage(sender, "If you want me to remind you type 'remind'");
        continue;
      }

      if (payload === '6 and more') {
        await sendImage(sender, process.env.IMAGE_HIGH);
        await sendTextMessage(sender, "Your'e a real champ! 8 cups is the recommended amount.");
        await sendTextMessage(sender, "If you want me to remind you type 'remind'");
        continue;
      }

      if (payload === 'I don\'t count') {
        await sendImage(sender, process.env.GIF);
        await sendTextMessage(sender, "Recommended amount of water per day is eight 8-ounce glasses, equals to about 2 liters, or half a gallon.");
        await sendTextMessage(sender, "If you want me to remind you type 'remind'");
        continue;
      }

    }

    if (event.message && event.message.text) {
      let text = event.message.text

      if (text === 'unsubscribe') {
        removeUser(sender);
        sendTextMessage(sender, "You won't receive reminder any more.");
        continue;
      }

      // if (text === 'Generic') {
      //   sendGenericMessage(sender)
      //   continue;
      // }

      if (text === 'remind') {
        sendQuickReplyes(sender, "How many times would you like me to remind you?", ['Once', 'Twice', 'Three times']);
        continue;
      }

      if (text === 'help') {
        await sendTextMessage(sender, "To set or change reminder type 'remind'");
        await sendTextMessage(sender, "To disable reminder type 'unsubscribe'");
        continue;
      }

      await sendTextMessage(sender, "Sorry, i didn't understand that.");
      await sendTextMessage(sender, "If you need help type 'help'");
    }

    if (event.postback) {
      let payload = event.postback.payload;

      if (payload == 'Get Started') {
        await sendTextMessage(sender, 'Hi there! I will be your personal water trainer :)');
        await sendTextMessage(sender, 'Before we begin...');
        await sendQuickReplyes(sender, 'How many cups of water do you drink a day?', ['1-2 cups', '3-5 cups', '6 and more', 'I don\'t count']);
        continue;
      }


    }

  }
  res.sendStatus(200);
})

const token = process.env.FB_PAGE_TOKEN;

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
});

let sendTextMessage = (sender, text) => {
  let messageData = { text:text }

  return new Promise(function(resolve, reject) {
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token:token},
      method: 'POST',
    json: {
        recipient: {id:sender},
      message: messageData,
    }
    }, function(error, response, body) {
    if (error) {
        reject(error);
    } else if (response.body.error) {
        reject(response.body.error);
      }
    resolve('It works');
    })
  })
}

let sendImage = (sender, url) => {
  let messageData = {
    "attachment":{
      "type":"image",
      "payload":{
        "url":url,
        "is_reusable":true
      }
    }
  }
  return new Promise(function(resolve, reject) {
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token:token},
      method: 'POST',
    json: {
        recipient: {id:sender},
      message: messageData,
    }
    }, function(error, response, body) {
    if (error) {
        reject(error);
    } else if (response.body.error) {
        reject(response.body.error);
      }
    resolve('It works');
    })
  })
}

let createQucikReply = (text) => {
  return {
    "content_type":"text",
    "title": text,
    "payload": text
  }
}

let sendQuickReplyes = (sender, title, replies) => {

  let messageData = {
    "text": title,
    "quick_replies":[]
  }

  replies.map(reply => messageData['quick_replies'].push(createQucikReply(reply)));


  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
  json: {
      recipient: {id:sender},
    message: messageData,
  }
}, function(error, response, body) {
  if (error) {
      console.log('Error sending messages: ', error)
  } else if (response.body.error) {
      console.log('Error: ', response.body.error)
    }
  })
}


// let sendGenericMessage = (sender) => {
//   let messageData = {
//     "attachment": {
//       "type": "template",
//       "payload": {
//       "template_type": "generic",
//         "elements": [{
//         "title": "First card",
//           "subtitle": "Element #1 of an hscroll",
//           "image_url": "http://liquipedia.net/commons/images/thumb/c/c5/Teamfacelesslogo.png/600px-Teamfacelesslogo.png",
//           "buttons": [{
//             "type": "web_url",
//             "url": "https://www.github.com/razzil1",
//             "title": "Dusan Pilipovic"
//           }, {
//             "type": "postback",
//             "title": "Postback",
//             "payload": "Payload for first element in a generic bubble",
//           }],
//         }, {
//           "title": "Second card",
//           "subtitle": "Element #2 of an hscroll",
//           "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
//           "buttons": [{
//             "type": "postback",
//             "title": "Postback",
//             "payload": "Payload for second element in a generic bubble",
//           }],
//         }]
//       }
//     }
//   }
//   request({
//     url: 'https://graph.facebook.com/v2.6/me/messages',
//     qs: {access_token:token},
//     method: 'POST',
//     json: {
//       recipient: {id:sender},
//       message: messageData,
//     }
//   }, function(error, response, body) {
//     if (error) {
//       console.log('Error sending messages: ', error)
//     } else if (response.body.error) {
//       console.log('Error: ', response.body.error)
//     }
//   })
// }

let addUser = async (sender, remind) => {
  let user = await User.findOneAndUpdate({ sender: sender }, { $set: {remind: remind} });
  if (!user) {
    user = new User({sender: sender, remind: remind });
    await user.save();
  }

};

let  removeUser = async (sender) => {
  await User.remove({ sender: sender });
};

schedule.scheduleJob("*/1 * * * *", function() {
  let time = new Date();
  let hours = time.getHours() + 2;

  if (hours === 8) {
    remindUsers('morning');
  } else if (hours === process.env.AFTERNOON) {
    remindUsers('afternoon');
  } else if (hours === process.env.EVENING) {
    remindUsers('evening');
  }
});

let remindUsers = async (reminder) => {

  let users = await User.find();

  if(users.length) {
    if (reminder === 'morning') {
      users.map(async (user) => {
        await sendImage(user.sender, process.env.GIF);
        await sendTextMessage(user.sender, 'Good morning!');
      });
    } else if (reminder === 'afternoon') {
      let filterUsers = users.filter(user => user.remind === 2 || user.remind === 3);

      if(filterUsers) {
        filterUsers.map(async (user) => {
          await sendImage(user.sender, process.env.GIF);
          await sendTextMessage(user.sender, 'Good afternoon!');
        });
      }

    } else if (reminder === 'evening') {
      let filterUsers = user.filter(user => user.remind === 3);
      if(filterUsers) {
        filterUsers.map(async (user) => {
          await sendImage(user.sender, process.env.GIF);
          await sendTextMessage(user.sender, 'Good evening');
        });
      }
    }
  }
  else {
    console.log('There is no user to remind');
  }
};

let getUserInfo = () => {

}