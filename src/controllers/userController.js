const userModel = require("../models/userModel");
const { EncodeToken } = require("../utility/tokenHelper");
const bcrypt = require("bcrypt");

let options = {
    maxAge: process.env.Cookie_Expire_Time,
    httpOnly: true,
    sameSite: "none",
    secure: true,
}

// ─── Register ────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ fix: ifUser.langth → findOne returns object not array, so just check ifUser
        let ifUser = await userModel.findOne({ email });
        if (ifUser) {
            return res.status(200).json({
                success: false,
                message: "User already exist"
            });
        }

        await userModel.create({ email, password });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

// ─── Login ───────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // ✅ fix: findOne({ email, password }) → password is hashed, only search by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(200).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        let token = EncodeToken(user.email, user._id.toString());
        res.cookie("u_token", token, options);
        res.status(200).json({
            success: true,
            message: "Login successfully",
            user: {
                id: user._id,
                email: user.email,
            },
            token: token,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong"
        });
    }
}

// ─── Get User ────────────────────────────────────────────────────────────────
exports.user = async (req, res) => {
    try {
        let email = req.headers.email;

        let matchStage = {
            $match: { email }
        };
        let projectStage = {
            $project: {
                password: 0,
            }
        };

        let data = await userModel.aggregate([matchStage, projectStage]);

        // ✅ fix: res.json() was missing, data was fetched but never sent
        res.status(200).json({
            success: true,
            data: data[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong"
        });
    }
}

// ─── User Verify ─────────────────────────────────────────────────────────────
exports.userVerify = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "User verified successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong"
        });
    }
}

// ─── Logout ──────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
    try {
        res.clearCookie("u_token");
        res.status(200).json({
            success: true,
            message: "Logout successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong"
        });
    }
}

// ─── Update ──────────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
    try {
        let email = req.headers.email;
        const _id = req.headers._id;

        const {
            password,
            image,
            cus_add,
            cus_city,
            cus_country,
            cus_fax,
            cus_name,
            cus_phone,
            cus_postcode,
            cus_state,
            ship_add,
            ship_city,
            ship_country,
            ship_name,
            ship_phone,
            ship_postcode,
            ship_state,
        } = req.body;

        // ✅ fix: do NOT put raw password in updateData from the start
        let updateData = {
            image,
            cus_add,
            cus_city,
            cus_country,
            cus_fax,
            cus_name,
            cus_phone,
            cus_postcode,
            cus_state,
            ship_add,
            ship_city,
            ship_country,
            ship_name,
            ship_phone,
            ship_postcode,
            ship_state,
        };

        const user = await userModel.findOne({ email, _id });
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "User not found"
            });
        }

        // ✅ fix: password compare BEFORE hash, and only hash if old password matches
        if (password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(200).json({
                    success: false,
                    message: "Invalid password"
                });
            }
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await userModel.findOneAndUpdate(
            { _id },
            updateData,
            { new: true }
        );

        // ✅ fix: token set BEFORE return, dead code removed
        let token = EncodeToken(updatedUser.email, updatedUser._id.toString());
        res.cookie("u_token", token, options);

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: {
                id: updatedUser._id,
                email: updatedUser.email,
            },
            token: token,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "Something went wrong"
        });
    }
}