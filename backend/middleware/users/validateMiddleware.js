const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
};

const registerValidation = [
  body("user_id")
    .trim()
    .notEmpty()
    .withMessage("User ID is required.")
    .isLength({ max: 50 })
    .withMessage("User ID must not exceed 50 characters."),

  body("first_name")
    .trim()
    .notEmpty()
    .withMessage("First name is required.")
    .isLength({ max: 50 })
    .withMessage("First name must not exceed 50 characters.")
    .matches(/^[A-Za-z\s'-]+$/)
    .withMessage("First name contains invalid characters."),

  body("last_name")
    .trim()
    .notEmpty()
    .withMessage("Last name is required.")
    .isLength({ max: 50 })
    .withMessage("Last name must not exceed 50 characters.")
    .matches(/^[A-Za-z\s'-]+$/)
    .withMessage("Last name contains invalid characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 8, max: 50 })
    .withMessage("Password must be at least 8 characters long.")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter.")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter.")
    .matches(/[^A-Za-z0-9]/)
    .withMessage("Password must contain at least one special character."),

  body("mobile_number")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required.")
    .matches(/^(\+63|0)9\d{9}$/)
    .withMessage("Please provide a valid Philippine mobile number."),

  body("birth_date")
    .optional()
    .trim()
    .isISO8601()
    .withMessage("Please provide a valid birth date.")
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("Birth date cannot be in the future.");
      }
      return true;
    })
    .toDate(),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("City must not exceed 50 characters."),

  body("barangay")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Barangay must not exceed 50 characters."),

  body("role")
    .optional()
    .isIn(["passenger", "driver", "admin"])
    .withMessage("Invalid role."),

  body("requested_role")
    .optional()
    .isIn(["passenger", "driver", "admin"])
    .withMessage("Invalid role"),

  body("passenger_category")
    .optional()
    .isIn(["regular", "student", "senior_citizen", "pwd"])
    .withMessage("Invalid passenger category."),

  body("profile_image")
    .optional()
    .matches(/\.(jpg|jpeg|png)$/i)
    .withMessage(
      "Invalid profile image type. Allowed formats: .jpg, .jpeg, .png",
    ),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required."),
];

const updateUserValidation = [
  body("first_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("First name cannot be empty.")
    .isLength({ max: 50 })
    .withMessage("First name must not exceed 50 characters.")
    .matches(/^[A-Za-z\s'-]+$/)
    .withMessage("First name contains invalid characters."),

  body("last_name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Last name cannot be empty.")
    .isLength({ max: 50 })
    .withMessage("Last name must not exceed 50 characters.")
    .matches(/^[A-Za-z\s'-]+$/)
    .withMessage("Last name contains invalid characters."),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City must not exceed 100 characters."),

  body("mobile_number")
    .optional()
    .trim()
    .matches(/^(\+63|0)9\d{9}$/)
    .withMessage("Please provide a valid Philippine mobile number."),

  body("barangay")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Barangay must not exceed 50 characters."),

  body("birth_date")
    .optional()
    .trim()
    .isISO8601()
    .withMessage("Please provide a valid birth date.")
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("Birth date cannot be in the future.");
      }
      return true;
    })
    .toDate(),

  body("profile_image")
    .optional()
    .matches(/\.(jpg|jpeg|png)$/i)
    .withMessage(
      "Invalid profile image type. Allowed formats: .jpg, .jpeg, .png",
    ),
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  updateUserValidation,
};
