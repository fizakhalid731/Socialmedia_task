const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    username:{
        type: String,
        required: false
    },
   
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    image:{
        type: String,
        required: false
    },
    likes:{
        type: Array,
        default: []
    },
    comments: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // reference to User who commented
            text: { type: String }, 
            username:{type: String},
            timestamp: { type: Date, default: Date.now } 
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the current date and time when the post is created
    },

   
});

module.exports = mongoose.model("userpost",postSchema);