import express from "express";
import session from "express-session";

const app = express();

app.use(json());

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
  })
);

// Mock user database
const users = [
  { id: 1, username: "user1", password: "password1" },
  { id: 2, username: "user2", password: "password2" },
];

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    req.session.userId = user.id;
    res.send("Logged in successfully");
  } else {
    res.status(401).send("Invalid Credentials");
  }
});

app.get("/protected", (req, res) => {
  if (req.session.userId) {
    res.send("Access granted to protected resources");
  } else {
    res.status(401).send("Unauthorized");
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
