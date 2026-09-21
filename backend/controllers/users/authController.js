const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      user_id: user.user_id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
};

// POST /api/users/register
const register = async (req, res) => {
  try {
    const {
      user_id,
      first_name,
      last_name,
      city,
      barangay,
      birth_date,
      email,
      password,
      mobile_number,
      role,
      requested_role,
      passenger_category,
      profile_image,
    } = req.body;

    const reqRoleStatus = requested_role === "passenger" ? "active" : "pending";

    const existingUser = await User.findOne({
      $or: [{ email: email ? email.toLowerCase() : undefined }, { user_id }],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: "Email is already registered.",
        });
      }

      if (existingUser.user_id === user_id) {
        return res.status(400).json({
          success: false,
          message: "User ID already exists.",
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    /*
    const imageFileCheck = (fileType) => {
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      return allowedTypes.includes(fileType);
    };*/

    const newUser = await User.create({
      user_id,
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: hashedPassword,
      mobile_number,
      city,
      barangay,
      birth_date,
      role: "passenger",
      requested_role: requested_role || "passenger",
      passenger_category: passenger_category || "regular",
      email_verified: false,
      account_status: reqRoleStatus || "pending",
      profile_image,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        user_id: newUser.user_id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        mobile_number: newUser.mobile_number,
        city: newUser.city,
        barangay: newUser.barangay,
        birth_date: newUser.birth_date,
        passenger_category: newUser.passenger_category,
        role: newUser.role,
        requested_role: requested_role || "passenger",
        email_verified: newUser.email_verified,
        account_status: newUser.account_status,
        profile_image: newUser.profile_image,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email or user ID already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while registering user.",
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      tokenType: "Bearer",
      user: {
        id: user._id,
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        city: user.city,
        barangay: user.barangay,
        birth_date: user.birth_date,
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role,
        passenger_category: user.passenger_category,
        email_verified: user.email_verified,
        account_status: user.account_status,
        profile_image: user.profile_image,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while logging in.",
    });
  }
};

// GET /api/auth/role-check
const roleCheck = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: req.user._id,
        user_id: req.user.user_id,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        city: req.user.city,
        barangay: req.user.barangay,
        birth_date: req.user.birth_date,
        email: req.user.email,
        mobile_number: req.user.mobile_number,
        role: req.user.role,
        passenger_category: req.user.passenger_category,
        email_verified: req.user.email_verified,
        account_status: req.user.account_status,
        profile_image: req.user.profile_image,
      },
    });
  } catch (error) {
    console.error("Role check error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify user role.",
    });
  }
};

//PUT /api/users/:id and GET /api/users/
const isEmailVerified = (req, res, next) => {
  if (!req.user || !req.user.email_verified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email address first.",
    });
  }
  next();
};

module.exports = {
  register,
  login,
  roleCheck,
  isEmailVerified,
};
