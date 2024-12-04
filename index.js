const mongoose = require('mongoose');
//const logger = require('./Logic/logger.js');
const math = require('mathjs');

const ConvertDateTotring = require('./Logic/ConvertDateTotring');
const cdnutsModel = require('./models/cdnuts');
const dcsgModel = require('./models/dcsg');
const hdnutsModel = require('./models/hdnuts');
const instantsModel = require('./models/instants');
const variableModel = require('./models/variables');
const variablevaluesModel = require('./models/variablevalues');
const variablevaluescachesModel = require('./models/variablevaluescaches');

mongoose.connect("mongodb+srv://sureshtest:test123@testcluster.xymejdg.mongodb.net/esdata");

const astToPipeline = (node, doc, variableValueslist, dcsgblock, blockNo) => {
    switch(node.type) {
      case 'ParenthesisNode':
        return astToPipeline(node.content, doc, variableValueslist, dcsgblock, blockNo)
      case 'OperatorNode':
        switch(node.fn) {
          case 'add':
            return {$add: node.args.map(arg => astToPipeline(arg, doc, variableValueslist, dcsgblock, blockNo))};
          case'subtract':
            return {$subtract: node.args.map(arg => astToPipeline(arg, doc, variableValueslist, dcsgblock, blockNo))};
          case'multiply':
            return {$multiply: node.args.map(arg => astToPipeline(arg, doc, variableValueslist, dcsgblock, blockNo))};
          case 'divide':
            return {$divide: node.args.map(arg => astToPipeline(arg, doc, variableValueslist, dcsgblock, blockNo))}; //
          case 'mod':
            return {$mod: node.args.map(arg => astToPipeline(arg, doc, variableValueslist, dcsgblock, blockNo))};
          default:
            throw new Error(`Unsupported operator: ${node.fn}`);
        }
      case 'ConstantNode':
        return node.value;
      case 'SymbolNode':
        const name = node.name.replaceAll(/underscore/g, ' ');
        if(name.includes("variable_")) {
            // console.log(variableValueslist, name);
            return Number(variableValueslist.find(variableValue => variableValue.name === name)?.value) || null;
            // return 10;
        }
        else if(name === "AVC" || name === "DC")
            return Number(dcsgblock[0].avc);
        else if(name.includes("SG_")) {
            switch(name) {
                case "SG_Current":
                    return Number(dcsgblock[0].sg);
                case "SG_Next_1":
                    return Number(dcsgblock[1].sg);
                case "SG_Next_2":
                    return Number(dcsgblock[2].sg);
                case "SG_Next_3":
                    return Number(dcsgblock[3].sg);
                case "SG_Next_4":
                    return Number(dcsgblock[4].sg);
                default:
                    throw new Error(`Unsupported SG block: ${name}`);
            }    
        }
        else if(name === "BlockNo")
            return Number(blockNo);
        else
            return Number(doc.fields.find(field => field.name === name)?.value) || null;
      default:
        throw new Error(`Unsupported node type: ${node.type}`)
    }
  }

const formulaToPipeline = (formula, doc, variableValueslist, dcsgblock, blockNo) => {
    const modifiedFormula = formula.replace(/(?<=[a-zA-Z]) (?=[a-zA-Z])/g, 'underscore');
    const ast = math.parse(modifiedFormula);
    //logger.info(JSON.stringify(ast));
    const pipeline = astToPipeline(ast, doc, variableValueslist, dcsgblock, blockNo);
    //logger.info(JSON.stringify(pipeline));
    return pipeline;
  }

var changeInstantStream = instantsModel.watch({ fullDocument: "updateLookup" }).on('change', async (change) => {
    if(change.fullDocument) {
        const deviceId = change.fullDocument.deviceid.toString();
        const devicename = change.fullDocument.device.devicename;
        let date = change.fullDocument.timestamp;
        // #region Formatting date for DCSG
        let dcsgblock = null;
        let dcsgDataForToday = null;
        let dcsgDataResponse = null;
        let today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        /*let today = new Date();
        today.setDate(date.getDate());
        console.log("today.getTimezoneOffset() - " + today.getTimezoneOffset())
        if (today.getTimezoneOffset() == -330 || today.getTimezoneOffset() == 0) {
            today.setHours(today.getHours() + 5);
            today.setMinutes(today.getMinutes() + 30);
            console.log("After adding 5:30 hours today: " + JSON.stringify(today));
        }*/
        let istDateTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        //logger.info("istDateTime:" + JSON.stringify(istDateTime));
        //logger.info("device date:" + JSON.stringify(date));
        /*let istDateTime = new Date();
        istDateTime.setDate(date.getDate());
        console.log("istDateTime.getTimezoneOffset() - " + istDateTime.getTimezoneOffset())
        if (istDateTime.getTimezoneOffset() == -330 || istDateTime.getTimezoneOffset() == 0) {
            istDateTime.setHours(istDateTime.getHours() + 5);
            istDateTime.setMinutes(istDateTime.getMinutes() + 30);
            console.log("After adding 5:30 hours istDateTime: " + JSON.stringify(today));
        }*/
        today.setHours(0, 0, 0, 0);
        //logger.info("After resetting it to 0 hours today:" + JSON.stringify(today));
        //let tommorow = new Date()
        let tommorow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        tommorow.setDate(today.getDate() + 1)
        //logger.info("tommorow.getTimezoneOffset() - " + tommorow.getTimezoneOffset())
        tommorow.setHours(0, 0, 0, 0);
        //logger.info("After resetting it to 0 hours tommorow:" + JSON.stringify(tommorow));
        //logger.info("deviceid:" + deviceId);
        let blockNo;
        blockNo = ConvertDateTotring.ConvertToBlock(date);
        //logger.info("blockNo: " + blockNo);
        dcsgDataForToday = await dcsgModel.find({ deviceid: deviceId, date: { $gte: today, $lt: tommorow } }).sort({ revisionno: -1 }).limit(1)
        for await (const dcsgdocument of dcsgDataForToday) {
            dcsgDataResponse = dcsgdocument;
        }
        if (dcsgDataResponse == null) {
            //logger.info("record not Found. So, taking the last dcsg record.");
            dcsgDataForToday = await dcsgModel.find({ deviceid: deviceId }).sort({ date: -1, revisionno: -1 }).limit(1)
            for await (const dcsgdocument of dcsgDataForToday) {
                dcsgDataResponse = dcsgdocument;
            }
        }
        if (dcsgDataResponse != null) {
            if (dcsgDataResponse.data != null) {
                dcsgblock = dcsgDataResponse.data.filter(
                    (item) => item.blockno >= blockNo && item.blockno <= blockNo + 4
                );
            }
        }
        if(dcsgblock.length < 5) {
            //let dayafterTommorow = new Date()
            let dayafterTommorow =new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
            dayafterTommorow.setDate(tommorow.getDate() + 1)
            //logger.info("dayAfterTommorow.getTimezoneOffset() - " + dayafterTommorow.getTimezoneOffset())
            dayafterTommorow.setHours(0, 0, 0, 0);
            //logger.info("After resetting it to 0 hours day after tommorow:" + JSON.stringify(dayafterTommorow));

            const dcsgDataForTomorrow = await dcsgModel.find({ deviceid: deviceId, date: { $gte: tommorow, $lt: dayafterTommorow } }).sort({ revisionno: -1 }).limit(1)
            for await (const dcsgdocument of dcsgDataForTomorrow) {
                dcsgDataResponse = dcsgdocument;
            }
            if (dcsgDataResponse == null) {
                //logger.info("record not Found. So, taking the first blocks of last dcsg record.");
                dcsgDataForTomorrow = await dcsgModel.find({ deviceid: deviceId }).sort({ date: -1, revisionno: -1 }).limit(1)
                for await (const dcsgdocument of dcsgDataForTomorrow) {
                    dcsgDataResponse = dcsgdocument;
                }
            }
            if (dcsgDataResponse != null) {
                if (dcsgDataResponse.data != null) {
                    dcsgblock += dcsgDataResponse.data.filter(
                        (item) => item.blockno <= 5 - dcsgblock.length
                    );
                }
            }
        }
        //logger.info("dcsgblock: " + JSON.stringify(dcsgblock));
        //#endregion
        const variables = await variableModel.find({ deviceid: deviceId });
        const variableValueslist = [];
        for(let variable of variables) {
            if (variable.active) {
                if (variable.variabletype !== "Static") {
                    const pipeline = formulaToPipeline(variable.formula, change.fullDocument, variableValueslist, dcsgblock, blockNo);
                    let result;
                    if(typeof pipeline === 'number'){
                        result = pipeline;
                    }
                    else {
                        result = await variableModel.aggregate([
                            {
                                $match: {
                                    _id: variable._id
                                }
                            },
                            {
                                $project: {
                                    value: pipeline
                                }
                            }
                        ])
                        result = result[0].value;
                    }
                    //logger.info("Unsacled value: " + result);
                    if(variable.scale !== undefined && variable.scale!== null) {
                        const scale = math.evaluate(variable.scale);
                        result = result*scale;
                    }
                    //logger.info("Scaled value: " + result);

                    // let avg_val = -1;
                    // console.log("avg_val: " + avg_val);
                    if (variable.calcavg) {
                        //logger.info("device : " + deviceId);
                        //logger.info("devicename : " + devicename);
                        const variableValuedoc = {
                            timestamp: date,
                            deviceid: deviceId,
                            devicename: devicename,
                            blockno: blockNo,
                            variableid: variable._id,
                            value: result
                        };
                        const variableValuesCachesResult = await variablevaluescachesModel.create(variableValuedoc);
                        //logger.info("response variableValuesCacheResult: " + JSON.stringify(variableValuesCachesResult));
                        let current_Date = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                        /*let current_Date = new Date();
                        current_Date.setDate(date.getDate());
                        console.log("current_Date.getTimezoneOffset() - " + current_Date.getTimezoneOffset())
                        if (current_Date.getTimezoneOffset() == -330 || current_Date.getTimezoneOffset() == 0) {
                            current_Date.setHours(current_Date.getHours() + 5);
                            current_Date.setMinutes(current_Date.getMinutes() + 30);
                            console.log("After adding 5:30 hours current_Date: " + JSON.stringify(current_Date));
                        }*/
                        current_Date.setHours(0, 0, 0, 0);
                        //logger.info("current_Date: " + JSON.stringify(current_Date));
                        let mins = 15 * (blockNo - 1);
                        //logger.info("mins: " + mins);
                        current_Date.setMinutes(current_Date.getMinutes() + mins);
                        //logger.info("After adding mins - current_Date: " + JSON.stringify(current_Date));

                        const variablevaluesAvgCollection = await variablevaluescachesModel.aggregate([
                            { $match: { variableid: variable._id, timestamp: { $gte: current_Date, $lte: date } } },
                            { $group: { _id: "$variableid", avg_val: { $avg: "$value" } } },
                            { $project: { "avg_val": 1 } }
                        ]);
                        //logger.info("variablevaluesAvgCollection: " + JSON.stringify(variablevaluesAvgCollection));
                        for await (const variableavg of variablevaluesAvgCollection) {
                            //logger.info("variablevaluesAvgCollection - response: " + JSON.stringify(variableavg));
                            result = variableavg.avg_val;
                            //logger.info("avg_val: " + result);
                        }
                    }
                    variableValueslist.push({name: "variable_" + variable.variablename, value: result});
                    let todayDate = today.toISOString().split("T")[0];
                    //logger.info("todayDate: " + todayDate);
                    const variableValuedocument = {
                        timestamp: date,
                        date: todayDate,
                        deviceid: deviceId,
                        devicename: devicename,
                        variableid: variable._id,
                        variablename: variable.variablename,
                        blockno: blockNo,
                        value: result,
                    };
                    //logger.info("inserting into variablevaluesModel: " + JSON.stringify(variableValuedocument));
                    const variableValuesResult = await variablevaluesModel.create(variableValuedocument);
                    try {
                        //logger.info("updating into cdnutsModel: ");
                        let newItem = {
                            VariableId: variable._id,
                            VariableName: variable.variablename,
                            Value: result
                        }
                        //logger.info("VariableId: " + variable._id);
                        const terminal = await cdnutsModel.findOne({ TerminalId: deviceId });
                        if (terminal) {
                            // Check if the terminal exists
                            //logger.info("terminal Object: " + JSON.stringify(terminal));
                            //logger.info("Data Object: " + JSON.stringify(terminal.Data));
                            const itemIndex = terminal.Data.findIndex((item)  => item.VariableName === newItem.VariableName);
                            //logger.info("itemIndex: " + itemIndex + " For VariableId:" +newItem.VariableName);
                            //logger.info("Before terminal.TimestampId: " + terminal.TimestampId);
                            terminal.TimestampId = date;
                            //logger.info("After terminal.TimestampId: " + terminal.TimestampId);
                            if (itemIndex > -1) {
                                l//ogger.info("Update the existing item: " + JSON.stringify(newItem));
                                // Update the existing item
                                terminal.Data[itemIndex] = newItem;
                            } else {
                                //logger.info("adding item to the existing item: " + JSON.stringify(newItem));
                                // Add the new item
                                terminal.Data.push(newItem);
                            }
                            // Save the document
                            await terminal.save();
                        } else {
                            // If the terminal doesn't exist, create a new document
                            const terminalObj = new cdnutsModel({
                                TerminalId: deviceId,
                                TimestampId: date,
                                TerminalName: devicename,
                                Data: [newItem]
                            });

                            await terminalObj.save();
                        }


                        const hdterminal = await hdnutsModel.findOne({ TerminalId: deviceId, TimestampId: date});
                        if (hdterminal) {
                         
                                // Add the new item
                                hdterminal.Data.push(newItem);
                                await hdterminal.save();
                            }
                             else {
                            // If the hdterminal doesn't exist, create a new document
                            const hdterminalObj = new hdnutsModel({
                                TerminalId: deviceId,
                                TimestampId: date,
                                TerminalName: devicename,
                                Data: [newItem]
                            });

                            await hdterminalObj.save();
                        }
                    } catch (error) {
                        //logger.error(error)
                    }
                }
            }
        }
    }
})