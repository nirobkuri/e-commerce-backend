const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId; // fixed casing
const productModel = require("../models/productModel.js");

exports.createProduct = async (req, res) => {
    try {
        const {
            title,
            images,
            sort_description,
            price,
            is_discount,
            discount_price,
            remark,
            stock,
            color,
            size,
            description,
            category_id,
            brand_id,
        } = req.body;

        if (discount_price > price) {
            return res.status(400).json({
                success: false,
                message: "Discount price cannot be greater than original price",
            });
        }

        let data = await productModel.create({
            title,
            images,
            sort_description,
            price,
            is_discount,
            discount_price,
            remark,
            stock,
            color,
            size,
            description,
            category_id,
            brand_id,
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong",
        });
    }
};

exports.allProduct = async (req, res) => {
    try {
        let page_no = Number(req.params.page_no);
        let per_page = Number(req.params.per_page);
        let category_id = req.params.category_id; // fixed typo
        let brand_id = req.params.brand_id;
        let remark = req.params.remark;
        let keyword = req.params.keyword;
        let skip_row = (page_no - 1) * per_page;
        let sortStage = { _id: -1 };

        let matchConditions = {};
        if (category_id !== "0")
            matchConditions.category_id = new ObjectId(category_id);
        if (brand_id !== "0") matchConditions.brand_id = new ObjectId(brand_id);
        if (remark !== "0") matchConditions.remark = remark;
        if (keyword !== "0")
            matchConditions.title = { $regex: keyword, $options: "i" };

        let joinWithCategoryStage = {
            $lookup: {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category",
            },
        };

        let facetStage = {
            $facet: {
                Total: [{ $count: "count" }],
                products: [
                    { $sort: sortStage },
                    { $skip: skip_row },
                    { $limit: per_page },
                    joinWithCategoryStage,
                ],
            },
        };

        let products = await productModel.aggregate([
            { $match: matchConditions },
            facetStage,
        ]);
        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data: products,
        });
    } catch (error) {
        res.status(500).json({
            // fixed: added ()
            success: false,
            message: "Something went wrong",
            error: error.toString(),
        });
    }
};

exports.singleProduct = async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const matchStage = { $match: { _id: id } };
        const joinWithCategory = {
            $lookup: {
                from: "categories",
                localField: "category_id",
                foreignField: "_id",
                as: "category",
            },
        };
        const joinWithBrand = {
            $lookup: {
                from: "brands",
                localField: "brand_id",
                foreignField: "_id",
                as: "brand",
            },
        };
        let data = await productModel.aggregate([
            matchStage,
            joinWithCategory,
            joinWithBrand,
        ]);
        res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data: data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.toString(),
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        let product_id = req.params.product_id;

        const {
            title,
            images,
            sort_description,
            price,
            is_discount,
            discount_price,
            remark,
            stock,
            color,
            size,
            description,
            category_id,
            brand_id,
        } = req.body;

        if (discount_price > price) {
            return res.status(400).json({
                success: false,
                message: "Discount price cannot be greater than original price",
            });
        }

        let data = await productModel.findByIdAndUpdate(
            id,
            {
                title,
                images,
                sort_description,
                price,
                is_discount,
                discount_price,
                remark,
                stock,
                color,
                size,
                description,
                category_id,
                brand_id,
            },
            { new: true },
        );
        res.status(200).json({
            success: true,
            message: "Product updated successfully",
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

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        let data = await productModel.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
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
