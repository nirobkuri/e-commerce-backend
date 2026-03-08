const brandModel = require("../models/brandModel");
const categoryModel = require("../models/categoryModel");
const invoiceModel = require("../models/invoiceModel");
const productModel = require("../models/productModel");
const reviewModel = require("../models/reviewModel");
const userModel = require("../models/userModel");

exports.deshboardSummary = async (req, res) => {
  try {
    const totalUsers = await userModel.countDocuments();
    const totalProducts = await productModel.countDocuments();
    const totalOrders = await invoiceModel.countDocuments();
    const totalReviews = await reviewModel.countDocuments();
    const totalCategories = await categoryModel.countDocuments();
    const totalBrands = await brandModel.countDocuments();

    const perndingDeliver = await invoiceModel.countDocuments({
      delivery_status: "Pending",
    });

    const deliveredOrders = await invoiceModel.countDocuments({
      delivery_status: "Delivered",
    });
    const cancelledOrders = await invoiceModel.countDocuments({
      delivery_status: "Cancelled",
    });

    const totalIncomeAgg = await invoiceModel.aggregate([
      { $match: { delivery_status: "Success" } },
      { $group: { _id: null, total: { $sum: "$payable" } } },
    ]);

    const totalIncome = totalIncomeAgg.length > 0 ? totalIncomeAgg[0].total : 0;

    res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalReviews,
        totalCategories,
        totalBrands,
        perndingDeliver,
        deliveredOrders,
        cancelledOrders,
        totalIncome,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};
