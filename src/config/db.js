const mongoose = require("mongoose");

const connectDB = async () => {
    mongoose.set("strictQuery", false);
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connected to database");
    } catch (err) {
        console.log("error connecting to database:", err.message);
        // Remove process.exit(1) so server still runs
    }
};

module.exports = connectDB;
