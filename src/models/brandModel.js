const mongoose = require("mongoose");

const DataSchema = new mongoose.Schema(
    {
        brand_name: { type: String, unique: true, required: true },
        brand_img: { type: String, required: true },
    },
    { timestamps: true, versionKey: false },
);

const brandModel = mongoose.model("brands", DataSchema);
module.exports = brandModel;
