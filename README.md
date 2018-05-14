# AqvaBot

Facebook Messenger bot. Depending on your preferences, AqvaBot will ask you to drink a glass of water during the day.

## Technologies and Development

* Facebook Messenger developer's platform
* Node.js with Express.js
* MongoDB
* Heroku
* API.ai

### Set Reminder

For Set Reminder feature, when the user sets a reminder, senderID and frequency will be saved in MongoDB. In index.js, using `node-schedule` and `cron`, function `scheduleJob` checks if need to send reminder. User can update frequency, and if he type 'Unsubscribe' he won't recive reminders and he will be deleted from database.

