
const Activity = require("../../models/activityModel");
const logActivity = require("../../utils/activityLogger");


exports.activities = (req, res) => {
    
    res.render(
        "admin/activities", 
        {pageTitle: "Activities"});
};