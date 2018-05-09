const API_AI_TOKEN = 'ce8ac07fdf9b47a1b9e39568f903bf32';
const apiAiClient = require('apiai')(API_AI_TOKEN);

const FACEBOOK_ACCESS_TOKEN = 'EAACm6tf2U7QBAO1t10NXoXpxaXyPZBdD4NFnlCGVIuXZCAe86Du8gBGAUf6ZCY38HfGvoJAzJfaXFQ9VNkQpvF4Se90v2CP3OxEUaQXEZCiuZB6ZB4LELm3bBqDIymi7MsRv3hz40hCblulZBcX6NitZAvS8QiCxS6RarfeZBLc774cHSlG9HqkZAb';
const request = require('request');

const sendTextMessage = (senderId, text) => {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: FACEBOOK_ACCESS_TOKEN },
    method: 'POST',
    json: {
      recipient: { id: senderId },
      message: { text },
    }
  });
};

module.exports = (event) => {
  const senderId = event.sender.id;
  const message = event.message.text;

  const apiaiSession = apiAiClient.textRequest(message, {sessionId: 'razzil1'});
  apiaiSession.on('response', (response) => {
    const result = response.result.fulfillment.speech;

    sendTextMessage(senderId, result);
  });

  apiaiSession.on('error', error => console.log(error));
  apiaiSession.end();
};