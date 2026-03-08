const dotenv = require("dotenv");
dotenv.config();
const app = require("./app.js");
const connectDB = require("./src/config/db.js");
connectDB();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
