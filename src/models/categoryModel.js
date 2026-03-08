const mongoose = require('mongoose');
const { unique } = require('prelude-ls');

const DataSchema = mongoose.Schema({
    catagory_name: { type: String, unique: true, required: true },
    category_img: { type: String, required: true },
},
    { timestamps: true, versionKey: false, }
)

const categoryModel = mongoose.model("categories", DataSchema);
module.exports = categoryModel;