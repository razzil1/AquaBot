const express = require('express');
const bodyParser = require('body-parser');

const verificationController = require('./controllers/verification');
const messageWebhookController = require('./controllers/messageWebhook');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', verificationController);
app.post('/', messageWebhookController);

app.set('port', (process.env.PORT || 5000))
app.listen(app.get('port'), function() {
  console.log('running on port', app.get('port'))
});