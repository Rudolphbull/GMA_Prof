require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = 4000;

console.log("process.env.PORT =", process.env.PORT);

const startServer = async () => {
    try {
        await connectDB();

        app.listen(process.env.PORT || 4000, () => {
            console.log("🚀 Application Server started on port",PORT);
        });

    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

startServer();
