// Enhanced Security with Middleware and CSRF Protection
// Lets enhance our authentication system with middleware for protected routes and CSRF protection.

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

const app = express();

mongoose.connect("mongodb://localhost/auth_demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model("User", UserSchema);

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: "your-secret-key",
    resavce: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: "mongodb://localhost/auth_demo" }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 Day
    },
  })
);

const csrfProtection = csrf({ cookie: true });

// Middleware to check if  user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
};

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send("User registered successfully");
  } catch (error) {
    res.status(500).send("Error registering user");
  }
});

app.post("/login", csrfProtection, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.userId = user._id;
      res.send("Logged in successfully");
    } else {
      res.status(401).send("Invalid Credentials");
    }
  } catch (error) {
    res.status(500).send("Error logging in");
  }
});

app.get("/logout", isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Could not log out, please try again");
    }
    res.send("Logged out successfully");
  });
});

app.get("/protected", isAuthenticated, csrfProtection, (req, res) => {
  res.json({
    message: "This is a protected route",
    csrfToken: req.csrfToken(),
  });
});

app.listen(3000, () => console.log("Server started on port 3000"));
