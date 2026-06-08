require("dotenv").config();

const express = require("express");
const path = require("path");
const https = require("node:https");

const app = express();

app.use(express.urlencoded({extended: true}));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
});


app.post("/", function(req, res) {

    const firstName = req.body.fName?.trim();
    const lastName = req.body.lName?.trim();
    const email = req.body.userEmail?.trim();

    if (firstName || !lastName || !email) {
        return res.sendFile(path.join(__dirname, "failure.html"));
    }

    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed",
                merge_fields: {
                    FNAME: firstName,
                    LNAME: lastName
                }
            }
        ]
    };

    const jsonData = JSON.stringify(data);
    const url = "https://us3.api.mailchimp.com/3.0/lists/07e6c748e3";

    const options = {
        method: "POST",
        auth: `${process.env.MAILCHIMP_USERNAME}:${process.env.MAILCHIMP_API_KEY}`
    }

   const request = https.request(url, options, function(response) {

    if (response.statusCode === 200) {
        res.sendFile(path.join(__dirname, "success.html"));
    } else {
        res.sendFile(path.join(__dirname, "failure.html"));
    }


        response.on("data", function(data) {
            console.log(JSON.parse(data));
        });

    });

    request.write(jsonData);
    request.end();
    console.log(firstName, lastName, email);
});


app.post("/failure", function(req, res) {
    res.redirect("/");
});


app.listen(5000, function() {
    console.log("Newsletter-Signup App started and running on port 5000");
});