require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;

// const predictionEnquiry = require("./jobs/predictionExpiry");

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log("🚀 Application Server started on port:", PORT);
        });

    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

startServer();
