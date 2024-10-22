const { json } = require('express/lib/response')
const mongoose =require('mongoose')

const variableSchema = new mongoose.Schema({
    deviceid: String,
    color: String,
    scale: String,
    createdAt : Date,
    updatedAt : Date,
    active: Boolean,
    calcavg : Boolean,
    variablename: String,
    description: String,
    formula: String,
    variabletype: String,
    unit : String,
    tags:[{
        type: String
       }]
})

const variableModel = mongoose.model('variables',variableSchema)
module.exports = variableModel

