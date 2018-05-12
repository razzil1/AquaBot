const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const userSchema = new Schema({
  sender: {
    type: String,
    trim: true
  },
  remind: Number
});

module.exports = mongoose.model('UserSchema', userSchema);

