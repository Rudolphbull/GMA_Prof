const cron = require("node-cron");

const Prediction = require("../models/predictionModel");


cron.schedule("*/10 * * * *", async()=>{


    try {


        const now = new Date();


        const result = await Prediction.updateMany(

            {
                kickoffTime:{
                    $lt: now
                },

                status:"Pending"

            },


            {
                $set:{
                    status:"Expired"
                }
            }


        );


        console.log(
            "Expired predictions updated:",
            result.modifiedCount
        );



    } catch(err){

        console.log(err);

    }


});