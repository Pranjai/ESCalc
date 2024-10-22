const mongoose =require('mongoose')

const cdnutsSchema = new mongoose.Schema({
    TimestampId: Date,
    TerminalId: mongoose.Schema.Types.ObjectId,
    TerminalName: String,
    Data : [{
        VariableName: String,
        VariableId : mongoose.Schema.Types.ObjectId,
        Value : {
            type: mongoose.Schema.Types.Decimal128,
            get: function (value) {
                return parseFloat(value.toString()); 
              }
        } 
    }]
 
}, {toJSON: {getters: true}})

const cdnutsModel = mongoose.model('cdnuts',cdnutsSchema)
module.exports = cdnutsModel

