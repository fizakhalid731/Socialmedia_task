const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  username: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: false
  },
  userposts:[{type: mongoose.Schema.Types.ObjectId,
    ref: "userpost",}],
  otp: {
      type: String 
    },
  forget_otp: {
      type: String 
    },
  isVerified: {
      type: Boolean,
      default: false // Default to false; change to true upon successful OTP verification
    }

});



const User = mongoose.model('User', userSchema);


module.exports = User;
