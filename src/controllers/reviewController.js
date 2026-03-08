const reviewModel = require("../models/reviewModel");
const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId; // ✅ added

exports.createReview = async (req, res) => {
  try {
    const { product_id, rating, des, invoice_id } = req.body;
    const user_id = req.headers._id;
    let data = await reviewModel.updateOne(
      { user_id, product_id, invoice_id },
      { user_id, product_id, invoice_id, rating, des },
      { upsert: true },
    );
    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.allReview = async (req, res) => {
  try {
    let page_no = Number(req.params.page_no);
    let per_page = Number(req.params.per_page);
    let skip_row = (page_no - 1) * per_page;
    let sortStage = { _id: -1 };

    let joinStageWithUser = {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      },
    };
    let joinStageWithProduct = {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product",
      },
    };

    let unwindStageUser = { $unwind: "$user" };
    let unwindStageProduct = { $unwind: "$product" };

    let projectStage = {
      $project: {
        _id: 1,
        user_id: 1,
        product_id: 1,
        invoice_id: 1,
        des: 1,
        rating: 1,
        createdAt: 1,
        "user.cus_name": 1, // ✅ fixed
        "user.cus_email": 1, // ✅ fixed
        "product.title": 1, // ✅ fixed
        "product.images": 1, // ✅ fixed
      },
    };

    let facetStage = {
      $facet: {
        // ✅ fixed: proper $facet structure
        Total: [{ $count: "count" }],
        data: [
          { $sort: sortStage },
          { $skip: skip_row },
          { $limit: per_page },
          joinStageWithProduct,
          joinStageWithUser,
          unwindStageUser,
          unwindStageProduct,
          projectStage,
        ],
      },
    };

    let data = await reviewModel.aggregate([facetStage]);
    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
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

exports.allReviewByProduct = async (req, res) => {
  try {
    const product_id = req.params.product_id;
    const matchStage = { $match: { product_id: new ObjectId(product_id) } };
    const joinWithUser = {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      },
    };
    const unwindStageUser = { $unwind: "$user" };
    let project = {
      $project: {
        des: 1,
        rating: 1,
        updatedAt: 1,
        createdAt: 1,
        "user.cus_name": 1, // ✅ fixed
        "user.cus_email": 1, // ✅ fixed
      },
    };
    const data = await reviewModel.aggregate([
      matchStage,
      joinWithUser,
      unwindStageUser,
      project,
    ]);
    res.status(200).json({
      success: true,
      message: "Reviews fetched successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  } // ✅ fixed: was })
};
