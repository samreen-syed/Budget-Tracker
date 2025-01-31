
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // Allow credentials (cookies)
  })
);

app.use(bodyParser.json());

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: false }, // secure: false for HTTP, true for HTTPS
  })
);

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/budgettracker")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));

// User Schema and Model
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  budget: {
    salary: { type: Number, default: 0 },
    expenses: [
      {
        amount: { type: Number, required: true },
        category: { type: String, required: true },
        description: { type: String },
      },
    ],
  },
});

const User = mongoose.model("User", UserSchema);

// Middleware to verify session-based login
const verifySession = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// User Authentication Routes
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({ email, password: hashedPassword, budget: { salary: 0, expenses: [] } });

  try {
    await user.save();
    return res.json({ success: true, message: "Registration successful!" });
  } catch (error) {
    return res.json({ success: false, message: "Email already exists" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.userId = user._id;
    req.session.save(); // Ensure session is saved
    return res.json({ success: true, message: "Login successful!" });
  } else {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to log out" });
    }
    res.json({ success: true, message: "Logged out successfully!" });
  });
});

// Budget Management Routes
app.get("/api/budget/get", verifySession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ budget: user.budget });
  } catch (error) {
    res.status(500).json({ message: "Error fetching budget" });
  }
});

app.post("/api/budget/save", verifySession, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.budget.salary = req.body.salary || user.budget.salary;
    user.budget.expenses = req.body.expenses || user.budget.expenses;

    await user.save();
    res.json({ success: true, message: "Budget saved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving budget" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
