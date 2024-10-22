const mongoose =require('mongoose')

const dcsgSchema = new mongoose.Schema({
    date: Date,
    revisionno: Number,
    deviceid: String,
    data: [{
    blockno: Number,
    avc: {
        type: mongoose.Schema.Types.Decimal128,
        get: function (value) {
            return parseFloat(value.toString()); 
          }
    },
    sg: {
        type: mongoose.Schema.Types.Decimal128,
        get: function (value) {
            return parseFloat(value.toString()); 
          }
    }  
    }],
    tags:[{
        type: String
       }],
    createdAt: Date,
    updatedAt: Date
}, {toJSON: {getters: true}})

const dcsgModel = mongoose.model('dcsgs',dcsgSchema)
module.exports =dcsgModel

