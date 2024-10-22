const mongoose =require('mongoose')



const instantsSchema = new mongoose.Schema({
    timestamp: Date,
    device: {
        description :String,
        devicename : String
    },
    fields:[{
        name: String,
        value:String
       }],
     deviceid :  mongoose.Schema.Types.ObjectId,
})

const instantsModel = mongoose.model('instants',instantsSchema)
module.exports = instantsModel

