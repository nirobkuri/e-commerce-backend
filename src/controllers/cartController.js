exports.createCart = async (req, res) => {
  try {
    const { product_id, color, size, product_name, qty } = req.body;
    const user_id = req.headers._id;

    let product = await productModel.findById(product_id);
    let existingCart = await cartModel.findOne({
      user_id,
      product_id,
      color,
      size,
      product_name,
    });

    if (!!existingCart === true) {
      let newReqBody = {
        user_id,
        product_id,
        product_name,
        color,
        size,
        qty: parseInt(existingCart.qty) + parseInt(qty),
      };
      const carts = await cartModel.find({ product_id }).select("qty"); // ✅ fixed typo
      const totalQty = carts.reduce((sum, item) => sum + item.qty, 0);
      if (product?.stock < totalQty + qty) {
        return res.status(400).json({
          success: false,
          message: "You have added all the products in stock",
        });
      }
      const updateData = await cartModel.updateOne(
        { _id: existingCart._id },
        { $set: newReqBody },
      );
      res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        updateData,
      });
    } else {
      const carts = await cartModel.find({ product_id }).select("qty"); // ✅ fixed typo
      const totalQty = carts.reduce((sum, item) => sum + item.qty, 0);
      if (product?.stock < totalQty + qty) {
        return res.status(400).json({
          success: false,
          message: "You have added all the products in stock",
        });
      }
      const data = await cartModel.create({
        user_id,
        product_id,
        product_name,
        color,
        size,
        qty,
      });
      res.status(201).json({
        // ✅ added missing response
        success: true,
        message: "Cart created successfully",
        data,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  } // ✅ fixed: was })
};

exports.readCart = async (req, res) => {
  try {
    let user_id = new objectId(req.headers._id);
    let matchStage = { $match: { user_id } };
    let joinWithProduct = {
      $lookup: {
        from: "products",
        localField: "product_id",
        foreignField: "_id",
        as: "product",
      },
    };
    let joinWithBrand = {
      $lookup: {
        from: "brands",
        localField: "product.brand_id",
        foreignField: "_id",
        as: "brand",
      },
    };
    let unwindProductStage = { $unwind: "$product" };
    let unwindBrandStage = { $unwind: "$brand" };
    let projectionStage = {
      $project: {
        _id: 0,
        user_id: 0,
        "product._id": 0,
        "product.category_id": 0,
        "product.brand_id": 0,
        "product.createdAt": 0,
        "product.updatedAt": 0,
        "brand._id": 0,
        "brand.createdAt": 0,
        "brand.updatedAt": 0,
        "product.sort_description": 0,
        "product.description": 0,
        category_id: 0,
        brand_id: 0,
        createdAt: 0,
        updatedAt: 0,
      },
    };

    let data = await cartModel.aggregate([
      // ✅ fixed: was aggregate[
      matchStage,
      joinWithProduct,
      joinWithBrand,
      unwindProductStage,
      unwindBrandStage,
      projectionStage,
    ]);

    res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
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

exports.updateCart = async (req, res) => {
  try {
    const { qty, color, size } = req.body;
    const user_id = req.headers._id;
    const cart_id = req.params.cart_id;

    if (!cart_id || !qty) {
      return res.status(400).json({
        success: false,
        message: "cart_id and qty are required",
      });
    }

    const cartItem = await cartModel.findOne({ _id: cart_id, user_id });
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    const product = await productModel.findById(cartItem.product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const allCarts = await cartModel.find({ product_id: cartItem.product_id }).select("qty");
    const totalQtyInCarts = allCarts.reduce((sum, item) => sum + item.qty, 0) - cartItem.qty;

    if (totalQtyInCarts + parseInt(qty) > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Cannot update cart. Exceeds product stock",
      });
    }

    cartItem.qty = parseInt(qty);
    if (color) cartItem.color = color;
    if (size) cartItem.size = size;
    await cartItem.save();

    res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: cartItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.toString(),
    });
  }
};

exports.deleteCart = async (req, res) => {
  try {
    const cart_id = req.params.cart_id;
    const data = await cartModel.findByIdAndDelete(cart_id);
    res.status(200).json({
      success: true,
      message: "Cart deleted successfully",
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
