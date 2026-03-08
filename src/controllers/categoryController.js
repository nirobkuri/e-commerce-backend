const productModel = require("../models/productModel");

exports.createCategory = async (req, res) => {
    try {
        const { category_name, category_image } = req.body;
        const data = await categoryModel.create({
            category_name,
            category_image,
        });
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data,
        });
    } catch (error) {
        // ✅ added error parameter
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.toString(),
        });
    }
};

exports.allCategory = async (req, res) => {
    try {
        let page_no = Number(req.params.page_no);
        let per_page = Number(req.params.per_page);
        let skip_row = (page_no - 1) * per_page;
        let sortStage = { _id: -1 };

        let joinWithProduct = {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "category_id",
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
                categories: [
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

        let categories = await categoryModel.aggregate([facetStage]);

        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: categories[0],
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.toString(),
        });
    }
};

exports.singleCategory = async (req, res) => {
    try {
        let id = req.params.id;

        let data = await categoryModel.findById(id);

        res.status(200).json({
            success: true,
            message: "Category fetched successfully",
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

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, category_image } = req.body;
        const data = await categoryModel.findByIdAndUpdate(
            id,
            { category_name, category_image },
            { new: true },
        );
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
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

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID",
            });
        }

        let existingCategory = await categoryModel.findById(id);

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        let products = await productModel.find({ category_id: id });

        if (products.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Category has products, cannot delete",
            });
        }

        await categoryModel.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.toString(),
        });
    }
};
