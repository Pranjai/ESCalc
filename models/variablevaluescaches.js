
const mongoose = require('mongoose')

const variablevaluescachesSchema = new mongoose.Schema({
    deviceid: mongoose.Schema.Types.ObjectId,
    devicename: String,
    variableid : mongoose.Schema.Types.ObjectId,
    timestamp: Date,
    blockno : Number,
    value : {
        type: mongoose.Schema.Types.Decimal128,
        get: function (value) {
            return parseFloat(value.toString()); 
          }
    } 
})

const variablevaluescachesModel = mongoose.model('variablevaluescaches',variablevaluescachesSchema)
module.exports = variablevaluescachesModel
