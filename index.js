'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const config = require('./config');
const schedule = require('node-schedule');
const mongoose = require('mongoose');
const UserSchema = require('./User');
const User = mongoose.model('UserSchema');

mongoose.connect(config.DATABASE);
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
	if (req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
});

app.post('/webhook/', function (req, res) {
  let messaging_events = req.body.entry[0].messaging
  for (let i = 0; i < messaging_events.length; i++) {
    let event = req.body.entry[0].messaging[i]
    let sender = event.sender.id
    if (event.message && event.message.text) {
      let text = event.message.text

      if (text === 'Unsubscribe') {
        removeUser(sender);
        sendTextMessage(sender, "You won't receive reminder any more.");
        continue;
      }

      if (text === 'Generic') {
        sendGenericMessage(sender)
        continue;
      }
      if (text === 'Reminder') {
        console.log("Text before is: " + text);
        sendQuickReply(sender);
        text = req.body.entry[0]
        console.log("Text after is: " + text);
        if (text === 'Once') {
          sendTextMessage(sender, "Once is fine");
        } else if (text === 'Twice') {
          sendTextMessage(sender, "Twice if fine");
        } else if (text === 'Three times') {
          sendTextMessage(sender, "Three times");
        }
        addUser(sender);
        continue;
      }
      sendTwoMessages(sender, "Sorry, i didn't understand that.", "If you need help type 'help'");
    }
    if (event.postback) {
      let text = JSON.stringify(event.postback)
      sendTextMessage(sender, "Postback received: "+text.substring(0, 200))
      continue
    }
  }
  res.sendStatus(200)
})

const token = config.FB_PAGE_TOKEN;

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
});

function sendTextMessage(sender, text) {
  let messageData = { text:text }
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

// var messageData = {
//   recipient: {
//     id: recipientId
//   },
//   message: {
//     text: text,
//     metadata: isDefined(metadata)?metadata:'',
//     quick_replies: replies
//   }
// };

function sendQuickReply(sender) {

  let messageData = {
    "text": "How many times would you like me to remind you?",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Once",
        "payload":"1"
      },
      {
        "content_type":"text",
        "title":"Twice",
        "payload":"2"
      },
      {
        "content_type":"text",
        "title":"Three times",
        "payload":"3"
      }
    ]
  }

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


function sendGenericMessage(sender) {
  let messageData = {
    "attachment": {
      "type": "template",
      "payload": {
      "template_type": "generic",
        "elements": [{
        "title": "First card",
          "subtitle": "Element #1 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com",
            "title": "web url"
          }, {
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for first element in a generic bubble",
          }],
        }, {
          "title": "Second card",
          "subtitle": "Element #2 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
          "buttons": [{
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for second element in a generic bubble",
          }],
        }]
      }
    }
  }
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

let sendTwoMessages = (sender, text1, text2) => {
  sendTextMessage(sender, text1);
  setTimeout(function() {
    sendTextMessage(sender, text2);
  }, 2000);
};

let addUser = async (sender) => {
  let user = await User.findOne({ name: sender });
  if (!user) {
    user = new User({name: sender, date: Date.now()});
    await user.save();

  }

};

let  removeUser = async (sender) => {
  await User.remove({ name: sender });
};

schedule.scheduleJob("*/30 * * * *", function() {
  sendTextMessage('2047875771907996', "Send me something " + Date.now());
});