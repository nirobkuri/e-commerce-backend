const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
    file_name: { type: String, required: true },

},
    { timestamps: true, versionKey: false, }
)

const fileModel = mongoose.model("files", DataSchema);
module.exports = fileModel;