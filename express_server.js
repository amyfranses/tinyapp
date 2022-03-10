const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { use } = require("express/lib/application");
const bcrypt = require("bcryptjs");
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
  for (const id in userDatabase) {
    if (userDatabase[id].email === email) {
      return userDatabase[id];
    }
  }
};

const urlsForUser = function (id) {
  let userURLs = {};
  for (const url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      userURLs[url] = urlDatabase[url].longURL;
    }
  }
  return userURLs;
};

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// homepage
app.get("/", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    return res.redirect("/login");
  }
  return res.redirect("/urls");
});

// register new user
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };
  return res.render("urls_registration", templateVars);
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
      password: bcrypt.hashSync(userPassword, 10),
    };
    console.log(users);
    return res.cookie("user_id", newUserId).redirect("/urls");
  }
});

// login page for registered user
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    return res.redirect("/urls");
  }
  let templateVars = {
    user: users[req.cookies["user_id"]],
  };
  return res.render("urls_login", templateVars);
});

// responds to '/login' POST request: create cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = userFromEmail(email, users);
  if (!user) {
    return res.status(403).send("There is no account for this email address");
  } else {
    console.log("login ", user);
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(403).send("This password does not match");
    } else {
      return res.cookie("user_id", user.id).redirect("/urls");
    }
  }
});

// reponds to '/logout' POST request: remove cookie, redirect to /'urls'
app.post("/logout", (req, res) => {
  return res.clearCookie("user_id").redirect("/urls");
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
  const userURLs = urlsForUser(userId);
  let templateVars = {
    urls: userURLs,
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
  }
  urlDatabase[shortURL] = { longURL, userID };

  return res.redirect(302, `/urls/${shortURL}`); // Respond with 'Ok' (we will replace this)
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  const user = users[req.cookies["user_id"]];
  if (!user) {
    return res.send(
      "<h3> You must login to see this page </h3> <a href='/login' >Login<a/> <a href='/register' >Register<a/>"
    );
  }
  const userURLs = urlsForUser(req.cookies["user_id"]);
  let keys = Object.keys(userURLs);
  if (!keys.includes(shortURL)) {
    return res.send("<h3> This shortURL does not belong to you </h3>");
  }
  let templateVars = { shortURL, longURL, user };
  return res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userURLs = urlsForUser(req.cookies["user_id"]);
  let keys = Object.keys(userURLs);
  if (!keys.includes(shortURL)) {
    return res.send("<h3>You do not have access to this shortURL</h3>");
  }
  if (!urlDatabase[shortURL]) {
    return res.send("<h3>This short URL does not exist</h3>");
  }
  const longURL = urlDatabase[shortURL]["longURL"];
  return res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userURLs = urlsForUser(req.cookies["user_id"]);
  let keys = Object.keys(userURLs);
  if (!keys.includes(shortURL)) {
    return res.send(
      "<h3> You do not have permission to delete this shortURL </h3>"
    );
  } else {
    delete urlDatabase[shortURL];
    return res.redirect(`/urls`);
  }
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const userID = req.cookies["user_id"];
  if (!userID) {
    return res.send("<h3> Please Login </h3>");
  }
  urlDatabase[shortURL]["longURL"] = longURL;
  return res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
