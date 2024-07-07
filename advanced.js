const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;

const app = express();

mongoose.connect("mongodb://localhost/auth_demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  googleId: String,
  displayName: String,
  email: String,
});

const User = mongoose.model("User", UserSchema);

app.use(
  session({
    secret: "your-secret-key",
    resavce: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: "mongodb://localhost/auth_demo" }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: "YOUR_GOOGLE_CLIENT_ID",
      clientSecret: "YOUR_GOOGLE_CLIENT_SECRET",
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await new User({
            googleId: profile.id,
            displayName: profile.displayName,
            email: profile.emails[0].value,
          }).save();
        }
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await user.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);

app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`Welcome ${req.user.displayName}!`);
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(3000, () => console.log(`Server started on port 3000`));
