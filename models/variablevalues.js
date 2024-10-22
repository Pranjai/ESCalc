const mongoose =require('mongoose')

const variablevaluesSchema = new mongoose.Schema({
    deviceid: mongoose.Schema.Types.ObjectId,
    devicename: String,
    variablename: String,
    variableid : mongoose.Schema.Types.ObjectId,
    timestamp: Date,
    date : String,
    blockno : Number,
    value : {
        type: mongoose.Schema.Types.Decimal128,
        get: function (value) {
            return parseFloat(value.toString()); 
          }
    } ,
})

const variablevaluesModel = mongoose.model('variablevalues',variablevaluesSchema)
module.exports = variablevaluesModel

