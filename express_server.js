const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { use } = require("express/lib/application");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

const generateRandomString = function () {
  let result = "";
  const char = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = 6;
  for (let i = 0; i < length; i++) {
    result += char.charAt(Math.floor(Math.random() * char.length));
  }
  return result;
};
// console.log(generateRandomString());

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "NoRvzY",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "NoRvzY",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
};

const userFromEmail = function (email, userDatabase) {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user];
    }
  }
};

const getUserByID = function (userId, userDatabase) {};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// homepage
app.get("/", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

// register new user
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_registration", templateVars);
});

// POST registration, user access urls list
app.post("/register", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  if (!userEmail || !userPassword) {
    return res.status(400).send("Please enter a valid email and password");
  } else if (userFromEmail(userEmail, users)) {
    return res.status(400).send("This account already exists");
  } else {
    const newUserId = generateRandomString();
    users[newUserId] = {
      id: newUserId,
      email: userEmail,
      password: userPassword,
    };
    res.cookie("user_id", newUserId);
    res.redirect("/urls");
  }
});

// login page for registered user
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_login", templateVars);
});

// responds to '/login' POST request: create cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = userFromEmail(email, users);
  if (!user) {
    return res.status(403).send("There is no account for this email address");
  } else {
    if (user.password === password) {
      res.cookie("user_id", user.id);
      res.redirect("/urls");
    } else {
      return res.status(403).send("This password does not match");
    }
  }
});

// reponds to '/logout' POST request: remove cookie, redirect to /'urls'
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (!user) {
    return res.redirect("/login");
  }
  let templateVars = {
    user: user,
  };
  return res.render("urls_new", templateVars);
});

// list of urls for logged in user
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (!user) {
    return res.redirect("/login");
  }
  let templateVars = {
    urls: urlDatabase,
    user: user,
  };
  return res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const userID = req.cookies["user_id"];
  if (!userID) {
    return res.send(
      "<h3>You are not logged in. You cannot create short URLs.</h3>"
    );
    // console.log("You are not logged in. You cannot create short URLs.");
    res.redirect("/urls");
  }
  urlDatabase[shortURL] = { longURL, userID };

  res.redirect(302, `/urls/${shortURL}`); // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  const user = users[req.cookies["user_id"]];
  if (!user) {
    return res.redirect("/login");
  }
  let templateVars = { shortURL, longURL, user };
  return res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL]["longURL"];
    res.redirect(longURL);
  } else {
    res.send("<h3>This short URL does not exist<h3/>");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect(`/urls`);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL]["longURL"] = longURL;

  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
