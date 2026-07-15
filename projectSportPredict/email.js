const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function sendEmail({
    name,
    email,
    subject,
    html
}) {

    const mailOptions = {
        from: `"${name}" <${process.env.EMAIL_USERNAME}>`,
        replyTo: email,
        to: process.env.EMAIL_USERNAME,
        subject,
        html
    };

    return transporter.sendMail(mailOptions);
}

module.exports = sendEmail;