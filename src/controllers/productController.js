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
                message: "Discount price cannot be greater than original price"
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
            message: "Something went wrong"
        });

    }
}

exports.allProduct = async (req, res) => {
    try {
        const { category_id, brand_id, remark, keyword, per_page, page_no } = req.params;
        let condition = {};
        if (category_id != 0) {
            condition.category_id = category_id;
        }
        if (brand_id != 0) {
            condition.brand_id = brand_id;
        }
        if (remark != 0) {
            condition.remark = remark;
        }
        if (keyword != 0) {
            condition.title = {
                $regex: keyword,
                $options: "i"
            }
        }
        let data = await productModel.find(condition).skip((page_no - 1) * per_page).limit(per_page);
        res.status(200).json({
            success: true,
            message: "All products",
            data: data,
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong"
        });
    }
}