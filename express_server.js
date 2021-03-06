// dependencies
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const {
  generateRandomString,
  getUserByEmail,
  urlsForUser,
} = require("./helpers");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"],
  })
);

app.set("view engine", "ejs");

// database objects
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

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// homepage
app.get("/", (req, res) => {
  const user = req.session.user_id;
  if (!user) {
    return res.redirect("/login");
  }
  return res.redirect("/urls");
});

// register new user
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  let templateVars = {
    user: users[req.session.user_id],
  };
  return res.render("urls_registration", templateVars);
});

// POST registration, user access urls list
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const newUserId = generateRandomString();
  if (!email || !password) {
    return res.status(400).send("Please enter a valid email and password");
  } else if (getUserByEmail(email, users)) {
    return res.status(400).send("This account already exists");
  } else {
    req.session.user_id = newUserId;
    users[newUserId] = {
      id: newUserId,
      email,
      password: bcrypt.hashSync(password, 10),
    };
    return res.redirect("/urls");
  }
});

// login page for registered user
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }
  let templateVars = {
    user: users[req.session.user_id],
  };
  return res.render("urls_login", templateVars);
});

// responds to '/login' takes user to existing urls list
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).send("There is no account for this email address");
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("This password does not match");
  }
  req.session.user_id = user.id;
  res.redirect("/urls");
});

// reponds to '/logout' POST request: redirect to /'urls'
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// list of urls for logged in user
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    return res.redirect("/login");
  }
  const userURLs = urlsForUser(userId, urlDatabase);
  let templateVars = {
    urls: userURLs,
    user: user,
  };
  return res.render("urls_index", templateVars);
});

// handles form submission user input
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  const userID = req.session.user_id;
  if (!userID) {
    return res.send(
      "<h3>You are not logged in. You cannot create short URLs.</h3>"
    );
  }
  urlDatabase[shortURL] = { longURL, userID };

  return res.redirect(302, `/urls/${shortURL}`); // Respond with 'Ok' (we will replace this)
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    return res.redirect("/login");
  }
  let templateVars = {
    user: user,
  };
  return res.render("urls_new", templateVars);
});

// link that redirects user to long url page
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
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

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  const user = users[req.session.user_id];
  if (!user) {
    return res.send(
      "<h3> You must login to see this page </h3> <a href='/login' >Login<a/> <a href='/register' >Register<a/>"
    );
  }
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  let keys = Object.keys(userURLs);
  if (!keys.includes(shortURL)) {
    return res.send("<h3> This shortURL does not belong to you </h3>");
  }
  let templateVars = { shortURL, longURL, user };
  return res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  if (!userID) {
    return res.send("<h3> Please Login </h3>");
  }
  urlDatabase[shortURL]["longURL"] = longURL;
  return res.redirect("/urls");
});

// delete url from list
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
