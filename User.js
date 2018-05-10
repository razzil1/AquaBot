const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;

const userSchema = new Schema({
  name: {
    type: String,
    trim: true
  },
  date: Date
});

module.exports = mongoose.model('UserSchema', userSchema);

