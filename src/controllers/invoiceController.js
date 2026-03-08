const { default: axios } = require("axios");
const cartModel = require("../models/cartModel");
const productModel = require("../models/productModel");
const invoiceModel = require("../models/invoiceModel");
const invoiceProductModel = require("../models/invoiceProductModel");
const userModel = require("../models/userModel");
const ObjectId = require("mongoose").Types.ObjectId;
let redirect_url = "/cart-thank-you";
const { Parser } = require("json2csv"); // ✅ add at top of file

exports.createInvoice = async (req, res) => {
  try {
    let user_id = new ObjectId(req.headers._id);
    let cus_email = req.headers.email;

    let matchStage = { $match: { user_id } };
    let joinWithProductStage = {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product",
      },
    };
    let unwindProductStage = { $unwind: "$product" };

    let cartProducts = await cartModel.aggregate([
      matchStage,
      joinWithProductStage,
      unwindProductStage,
    ]);

    if (cartProducts.length > 0) {
      let totalAmount = 0;
      cartProducts.forEach((item) => {
        let price;
        if (item?.product?.is_discount === true) {
          price = parseFloat(item?.product?.discount_price);
        } else {
          price = parseFloat(item?.product?.price);
        }
        totalAmount = totalAmount + parseInt(item?.qty) * price; // ✅ fixed
      });

      const vat = totalAmount * 0.15; // ✅ fixed
      const shipping = 75;
      let totalPayable = totalAmount + vat + shipping;

      let user = await userModel.findById(user_id);

      if (
        [
          user.cus_add,
          user.cus_city,
          user.cus_country,
          user.cus_fax,
          user.cus_name,
          user.cus_phone,
          user.cus_postcode,
          user.cus_state,
          user.ship_add,
          user.ship_city,
          user.ship_country,
          user.ship_name,
          user.ship_phone,
          user.ship_postcode,
          user.ship_state,
        ].some((v) => v === undefined || v === null || v === "") // ✅ fixed
      ) {
        return res.status(400).json({
          success: false,
          message: "Please go dashboard and complete your profile",
        });
      }

      let cus_details = `Name: ${user.cus_name}, Email: ${user.email}, Address: ${user.cus_add}, City: ${user.cus_city}, Phone: ${user.cus_phone}, Country: ${user.cus_country}`;
      let ship_details = `Name: ${user.ship_name}, City: ${user.ship_city}, Phone: ${user.ship_phone}, Country: ${user.ship_country}`;

      let tran_id = "tra_" + Date.now() + Math.floor(Math.random() * 90000000);
      let val_id = "val_" + Date.now() + Math.floor(Math.random() * 90000000);

      let createInvoice = await invoiceModel.create({
        user_id: user_id,
        payable: parseFloat(totalPayable).toFixed(2),
        cus_details: cus_details,
        ship_details: ship_details,
        tran_id: tran_id,
        val_id: val_id,
        vat: vat,
        total: totalAmount,
      });

      let invoice_id = createInvoice._id;

      for (const item of cartProducts) {
        // ✅ fixed: for..of instead of forEach
        await invoiceProductModel.create({
          user_id: user_id,
          product_name: item?.product_name,
          product_id: item?.product_id,
          invoice_id: invoice_id,
          qty: item?.qty,
          price:
            item.product?.is_discount === true
              ? item?.product?.discount_price
              : item?.product?.price,
          color: item?.color,
          size: item?.size,
        });
      }

      for (const item of cartProducts) {
        await productModel.updateOne(
          { _id: item.product_id },
          { $inc: { stock: -item.qty } },
        );
      }

      await cartModel.deleteMany({ user_id: user_id });

      let paymentSetting = {
        store_id: process.env.SSLCZ_STORE_ID,
        store_passwd: process.env.SSLCZ_STORE_PASSWORD,
        currency: process.env.SSLZ_CURRENCY,
        success_url: process.env.SSLZ_SUCCESS_URL,
        fail_url: process.env.SSLZ_FAIL_URL,
        cancel_url: process.env.SSLZ_CANCEL_URL,
        ipn_url: process.env.SSLZ_IPN_URL,
        init_url: process.env.SSLZ_INIT_URL,
      };

      let form = new FormData();

      form.append("store_id", paymentSetting.store_id);
      form.append("store_passwd", paymentSetting.store_passwd);
      form.append("total_amount", totalPayable.toString());
      form.append("currency", paymentSetting.currency);
      form.append("tran_id", tran_id);
      form.append("success_url", paymentSetting.success_url);
      form.append("fail_url", paymentSetting.fail_url);
      form.append("cancel_url", paymentSetting.cancel_url);
      form.append("ipn_url", paymentSetting.ipn_url);

      form.append("cus_name", user.cus_name);
      form.append("cus_email", user.email);
      form.append("cus_add1", user.cus_add);
      form.append("cus_add2", user.cus_add);
      form.append("cus_city", user.cus_city);
      form.append("cus_state", user.cus_state);
      form.append("cus_postcode", user.cus_postcode);
      form.append("cus_country", user.cus_country);
      form.append("cus_phone", user.cus_phone);

      form.append("shipping_method", "YES");
      form.append("ship_name", user.ship_name);
      form.append("ship_add1", user.ship_add);
      form.append("ship_add2", user.ship_add);
      form.append("ship_city", user.ship_city);
      form.append("ship_state", user.ship_state);
      form.append("ship_postcode", user.ship_postcode);
      form.append("ship_country", user.ship_country);
      form.append("ship_phone", user.ship_phone);

      form.append("product_name", "According Invoice");
      form.append("product_category", "According Invoice");
      form.append("product_profile", "According Invoice");
      form.append("product_amount", "According Invoice");

      let SSLRes = await axios.post(paymentSetting.init_url, form);
      res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: SSLRes.data,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "No product found in cart",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.readAllInvoiceSingleUser = async (req, res) => {
  try {
    let user_id = new ObjectId(req.headers._id);
    let page_no = Number(req.params.page_no);
    let per_page = Number(req.params.per_page);
    let skip_row = (page_no - 1) * per_page;

    let matchStage = { $match: { user_id } };
    let sortStage = { createdAt: -1 };

    let facetStage = {
      $facet: {
        totalCount: [{ $count: "count" }],
        data: [
          { $sort: sortStage }, // ✅ fixed: each stage in own object
          { $skip: skip_row },
          { $limit: per_page },
        ],
      },
    };

    let data = await invoiceModel.aggregate([matchStage, facetStage]);

    res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.readSingleInvoiceSingleUser = async (req, res) => {
  try {
    let invoice_id = new ObjectId(req.params.invoice_id);

    let matchStage = { $match: { _id: invoice_id } };
    let joinWithInvoiceProductStage = {
      $lookup: {
        from: "invoiceproducts",
        localField: "_id",
        foreignField: "invoice_id",
        as: "invoiceProducts",
      },
    };

    let data = await invoiceModel.aggregate([
      matchStage,
      joinWithInvoiceProductStage,
    ]);

    res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      data: data?.[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.readInvoiceProductListSingleUser = async (req, res) => {
  try {
    let user_id = new ObjectId(req.headers._id);
    let page_no = Number(req.params.page_no);
    let per_page = Number(req.params.per_page);
    let skip_row = (page_no - 1) * per_page;

    let matchStage = { $match: { user_id: user_id } };

    let joinStageWithProduct = {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product",
      },
    };

    let unwindStage = { $unwind: "$product" };

    let projectStage = {
      $project: {
        _id: 1,
        user_id: 1,
        product_id: 1,
        invoice_id: 1,
        qty: 1,
        price: 1,
        color: 1,
        size: 1,
      },
    };

    let facetStage = {
      $facet: {
        totalCount: [{ $count: "count" }],
        products: [
          { $sort: { _id: -1 } }, // ✅ fixed: was undefined sortStage
          { $skip: skip_row },
          { $limit: per_page },
          joinStageWithProduct, // ✅ fixed: moved inside facet
          unwindStage,
          projectStage, // ✅ fixed: moved inside facet
        ],
      },
    };

    let products = await invoiceProductModel.aggregate([
      // ✅ fixed pipeline
      matchStage,
      facetStage,
    ]);

    res.status(200).json({
      success: true,
      message: "Invoice products fetched successfully",
      data: products[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.paymentSuccess = async (req, res) => {
  try {
    let trx_id = req.params.trx_id;
    await invoiceModel.updateOne(
      { tran_id: trx_id },
      { payment_status: "success" },
    );
    res.redirect(redirect_url);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.paymentCancel = async (req, res) => {
  try {
    let trx_id = req.params.trx_id;
    await invoiceModel.updateOne(
      { tran_id: trx_id },
      { payment_status: "cancel" },
    );
    res.redirect(redirect_url);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.paymentFail = async (req, res) => {
  try {
    let trx_id = req.params.trx_id;
    await invoiceModel.updateOne(
      { tran_id: trx_id },
      { payment_status: "fail" },
    );
    res.redirect(redirect_url);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.paymentIpn = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Here do something you have to need...",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.allOrderList = async (req, res) => {
  try {
    const page_no = Number(req.params.page_no) || 1;
    const per_page = Number(req.params.per_page) || 10;
    const skip_row = (page_no - 1) * per_page;
    const { from, to } = req.params;

    const fromData = from
      ? new Date(`${from}T00:00:00`) // ✅ fixed: was $(from)
      : new Date(`1970-01-01T00:00:00`);
    const toData = to ? new Date(`${to}T23:59:59`) : new Date();

    const matchStage = {
      $match: {
        createdAt: {
          $gte: fromData,
          $lte: toData,
        },
      },
    };

    let joinStageWithProduct = {
      $lookup: {
        from: "invoiceproducts",
        localField: "_id",
        foreignField: "invoice_id",
        as: "product",
      },
    };

    const facetStage = {
      $facet: {
        totalCount: [{ $count: "count" }],
        product: [
          { $sort: { createdAt: -1 } },
          { $skip: skip_row },
          { $limit: per_page },
          joinStageWithProduct,
        ],
      },
    };

    const data = await invoiceModel.aggregate([matchStage, facetStage]);

    res.status(200).json({
      success: true,
      message: "Order list fetched successfully",
      data: data[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromData = from
      ? new Date(`${from}T00:00:00`)
      : new Date(`1970-01-01T00:00:00`);
    const toData = to ? new Date(`${to}T23:59:59`) : new Date();

    const matchStage = {
      createdAt: { $gte: fromData, $lte: toData },
    };

    const data = await invoiceModel.find(matchStage).sort({ createdAt: -1 });

    const fields = [
      "_id",
      "user_id",
      "payable",
      "delivery_status",
      "payment_status",
      "total",
      "vat",
      "createdAt",
    ];

    const parser = new Parser({ fields }); // ✅ now works
    const csv = parser.parse(data);

    res.setHeader("Content-Type", "text/csv");
    res.attachment("Invoices.csv");
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};
exports.updateInvoice = async (req, res) => {
  try {
    const { _id, user_id, delivery_status } = req.body;

    const checkInvoice = await invoiceModel.findOne({ _id });

    if (!checkInvoice) {
      return res.status(404).json({
        // ✅ fixed: 404 not 200
        success: false,
        message: "Invoice not found",
      });
    }

    if (checkInvoice.delivery_status === "delivered") {
      return res.status(400).json({
        // ✅ fixed: 400 not 200
        success: false,
        message: "Invoice already delivered",
      });
    }

    if (checkInvoice.delivery_status === "cancel") {
      return res.status(400).json({
        // ✅ fixed: 400 not 200
        success: false,
        message: "Product already cancelled",
      });
    }

    const paymentStatus = checkInvoice.payment_status;

    if (paymentStatus === "success") {
      // ✅ fixed: was "cancel"
      if (delivery_status === "delivered") {
        const data = await invoiceModel.findByIdAndUpdate(
          _id, // ✅ fixed: was { _id, user_id }
          { delivery_status },
          { new: true },
        );
        return res.status(200).json({
          success: true,
          message: "Product delivered successfully",
          data,
        });
      }

      if (delivery_status === "cancel") {
        const invoiceProducts = await invoiceProductModel.find({
          invoice_id: _id,
        });
        for (const item of invoiceProducts) {
          await productModel.updateOne(
            { _id: item.product_id },
            { $inc: { stock: item.qty } },
          );
        }
        const data = await invoiceModel.findByIdAndUpdate(
          _id, // ✅ fixed
          { delivery_status },
          { new: true },
        );
        return res.status(200).json({
          success: true,
          message: "Unpaid order cancelled and stock restored", // ✅ fixed typo
          data,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Cannot deliver because payment was not successful", // ✅ fixed typo
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};
