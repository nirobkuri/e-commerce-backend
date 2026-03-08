const brandModel = require("../models/brandModel");
const productModel = require("../models/productModel");

// Create Brand
exports.createBrand = async (req, res) => {
  try {
    const { brand_name, brand_image } = req.body;

    const data = await brandModel.create({
      brand_name,
      brand_image,
    });

    res.status(200).json({
      success: true,
      message: "Brand created successfully",
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

// Get All Brands (Pagination + Product Count)
exports.allBrand = async (req, res) => {
  try {
    let page_no = Number(req.params.page_no);
    let per_page = Number(req.params.per_page);

    let skip_row = (page_no - 1) * per_page;

    let sortStage = { _id: -1 };

    let joinWithProduct = {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "brand_id",
        as: "products",
      },
    };

    const addProductCount = {
      $addFields: {
        totalProduct: { $size: "$products" },
      },
    };

    let facetStage = {
      $facet: {
        Total: [{ $count: "count" }],
        brands: [
          { $sort: sortStage },
          { $skip: skip_row },
          { $limit: per_page },
          joinWithProduct,
          addProductCount,
          {
            $project: {
              updatedAt: 0,
              products: 0,
            },
          },
        ],
      },
    };

    let brands = await brandModel.aggregate([facetStage]);

    res.status(200).json({
      success: true,
      message: "Brands fetched successfully",
      data: brands[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

// Get Single Brand
exports.singleBrand = async (req, res) => {
  try {
    let id = req.params.id;

    let data = await brandModel.findById(id);

    res.status(200).json({
      success: true,
      message: "Brand fetched successfully",
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

// Update Brand
exports.updateBrand = async (req, res) => {
  try {
    const id = req.params.id;

    const { brand_name, brand_image } = req.body;

    const data = await brandModel.findByIdAndUpdate(
      id,
      { brand_name, brand_image },
      { new: true },
    );

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
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

// Delete Brand
exports.deleteBrand = async (req, res) => {
  try {
    const id = req.params.id;

    let products = await productModel.find({ brand_id: id });

    if (products.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Brand has products, cannot delete",
      });
    }

    await brandModel.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};
