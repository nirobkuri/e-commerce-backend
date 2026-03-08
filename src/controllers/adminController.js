const adminModel = require("../models/adminModel");
const { EncodeToken } = require("../utility/tokenHelper");

let options = {
    maxAge: process.env.Cookie_Expire_Time,
    httpOnly: true,
    sameSite: "none",
    secure: true,
}

exports.register = async (req, res) => {
    try {
        const { email, password } = req.body;

        await adminModel.create({ email, password });

        res.status(201).json({
            success: true,
            message: "Admin registered successfully"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: "something went wrong"
        })
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await adminModel.findOne({ email, })
        if (!user) {
            return res.status(200).json({
                success: false,
                message: "Invild email or password"
            })
        }
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(200).json({
                success: false, message: "invild email or password"
            })


            if (isMatch) {
                let token = EncodeToken(user.email, user._id.toString())
                res.cookie("a_token", token, options);

                res.status(200).json({
                    success: true,
                    message: "login succesfully",
                    user: {
                        id: user._id,
                        email: user.email,
                    }
                })

            }
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "something went wrong"
        })
    }
}

exports.admin = async (req, res) => {
    try {
        let email = req.headers.email
        let MatchStage = {
            $math: { email }
        }
        let project = {
            $project: {
                password: 0,

            }
        }
        let data = await adminModel.aggregate([MatchStage, project])
        res.status(200).json({
            success: true,
            data: data[0]
        })
        console.log(data)

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: "something went wrong."
        })

    }
}

exports.adminVerify = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "something went wrong"
        })

    }
}

exports.logout = async (req, res) => {
    try {
        res.clearCookie("a_token")
        res.status(200).json({
            success: true,
            message: "logout successfully "
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "something went wrong"
        })
    }
}

exports.update = async (req, res) => {
    try {
        const { email, password } = req.body;
        const _id = req.headers._id;
        let updateData = { email };
        const user = await adminModel.findOne({ email, _id });
        if (!user) return res.status(200).json({
            success: false, message: "Invlid email"
        })
        if (password) {
            const hashPassword = await bcrypt.hash(password, 10);
            updateData.password = hashPassword;
        }
        const updateUser = await adminModel.findByIdAndUpdate(_id.toString(), updateData, { new: true });
        res.cookie("a_token", token, options)
        res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            user: {
                email: updateUser.email,
            }
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.toString(),
            message: "something went wrong"
        })

    }
}
