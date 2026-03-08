const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    payable: { type: Number, required: true },
    cus_details: { type: Array, required: true },
    ship_details: { type: Array, required: true },
    tran_id: { type: String, required: true },
    val_id: { type: Boolean, required: true },
    delivery_status: { type: String, enum: ["pending", "delivered", "cancelled"], default: "pending" },
    payment_status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    vat: { type: Number, required: true },
    total: { type: Number, required: true },
},
    { timestamps: true, versionKey: false, }
)
const invoiceModel = mongoose.model("invoices", DataSchema);
module.exports = invoiceModel;