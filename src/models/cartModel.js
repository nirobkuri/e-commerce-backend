const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    product_name: { type: String, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
},
    { timestamps: true, versionKey: false, }
)

const cartModel = mongoose.model("carts", DataSchema);
module.exports = cartModel;