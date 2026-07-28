const Activity = require("../models/activityModel");

module.exports = async function logActivity({

    action,

    description,

    icon = "bi-activity",

    color = "primary",

    createdBy = null

}) {

    try {

        await Activity.create({

            action,

            description,

            icon,

            color,

            createdBy

        });

    }

    catch(err){

        console.error(err);

    }

};