// helper functions
const generateRandomString = function (desiredLength = 6) {
  let result = "";
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < desiredLength; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return result;
};

const userFromEmail = function (email, userDatabase) {
  for (const id in userDatabase) {
    if (userDatabase[id].email === email) {
      return userDatabase[id];
    }
  }
};

const urlsForUser = function (id, urlDatabase) {
  let userURLs = {};
  for (const url in urlDatabase) {
    if (id === urlDatabase[url].userID) {
      userURLs[url] = urlDatabase[url].longURL;
    }
  }
  return userURLs;
};

module.exports = { generateRandomString, userFromEmail, urlsForUser };
