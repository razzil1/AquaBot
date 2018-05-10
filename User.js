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

export default mongoose.model('UserSchema', userSchema);