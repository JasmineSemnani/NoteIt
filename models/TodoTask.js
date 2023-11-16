const mongoose = require('mongoose');

const todoTaskSchema = new mongoose.Schema({
    content: {type: String, required: true},
    date: {type: Date, default: Date.now},
    email : {type : String, required: true}
  })



module.exports = mongoose.model('TodoTask',todoTaskSchema);