// controllers/adminAuthController.js
const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc    Register new admin
exports.registerAdmin = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill in all fields" });
    }

    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({ username, email, password });
    res.status(201).json({
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      token: generateToken(admin._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login admin
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        username: admin.username,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    next(error);
  }
};


// @desc    Forgot password (send reset email)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Create a plain reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Hash token before saving to DB
    admin.resetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    admin.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await admin.save();

    // Create reset URL (frontend link)
    const resetUrl = `${process.env.FRONTEND_URL}/admin-signup.html?resetToken=${resetToken}`;

    // Send email
    await sendEmail({
      email: admin.email,
      subject: "PVNBank Admin Password Reset",
      message: `You requested a password reset. Click here to reset your password:\n\n${resetUrl}\n\nThis link will expire in 25 minutes.`,
    });

    res.json({ message: "Reset link sent to your email" });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
exports.resetPassword = async (req, res, next) => { 
  try {
    const { token, password } = req.body; // <-- adjust key here

    // Hash incoming token to match DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find admin with matching token and not expired
    const admin = await Admin.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Update password (pre-save hook hashes it)
    admin.password = password;
    admin.resetToken = undefined;
    admin.resetTokenExpiry = undefined;
    await admin.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};



exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "fullname";
    const order = req.query.order === "desc" ? -1 : 1;

    const query = {
      $or: [
        { fullname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ]
    };

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(query)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("fullname email phone balances status photo");

    res.json({
      users,
      totalPages,
      currentPage: page,
      totalUsers
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { fullname, email, phone, status } = req.body;
    const updateData = { fullname, email, phone, status };

    // Handle profile picture if uploaded
    if (req.file) updateData.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Server error" });
  }
};



exports.resetUserPin = async (req, res) => {
  try {
    const newPin = req.body.pin || Math.floor(1000 + Math.random() * 9000).toString(); // random 4-digit PIN
    const hashedPin = await bcrypt.hash(newPin, 10);

    await User.findByIdAndUpdate(req.params.id, { transactionPin: hashedPin });

    res.json({ message: "Transaction PIN reset successfully", newPin }); // optional: send new PIN to admin
  } catch (err) {
    console.error("Error resetting PIN:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.fundUser = async (req, res) => {
  try {
    const { accountType, amount, description, date } = req.body;
    if (!["savings", "current"].includes(accountType))
      return res.status(400).json({ message: "Invalid account type" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update balance
    user.balances[accountType] += parseFloat(amount);
    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      user: user._id,
      type: "Credit",
      account: accountType,
      amount,
      description,
      date: date || new Date(),
      status: "Success"
    });
    await transaction.save();

    res.json({ message: `Funded ₦${amount} to ${accountType} successfully`, transaction });
  } catch (err) {
    console.error("Error funding user:", err);
    res.status(500).json({ message: "Server error" });
  }
};
