const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  mongoose.set("strictQuery", false);
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("connected to database");
  } catch (err) {
    console.log("error connecting to database:", err.message);
  }
};

module.exports = connectDB;
