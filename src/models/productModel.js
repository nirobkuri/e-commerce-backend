const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
    title: { type: String, required: true },
    images: { String },
    sort_description: { type: String },
    price: { type: Number, required: true },
    is_discounted: { type: Boolean },
    discount_price: { type: Number },
    stock: { type: Number },
    color: { type: String },
    size: { type: String },

    category_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    brand_id: { type: mongoose.Schema.Types.ObjectId, required: true },

},
    { timestamps: true, versionKey: false, }
)

const productModel = mongoose.model("products", DataSchema);
module.exports = productModel;