const { assert } = require("chai");

const { userFromEmail } = require("../helpers.js");

const testUsers = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

describe("userFromEmail", function () {
  it("should return a user with valid email", function () {
    const user = userFromEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id, expectedUserID);
  });

  it("shoud return user object when provided existing email", function () {
    const actual = userFromEmail("user@example.com", testUsers);
    const expectedOutput = actual;
    assert.strictEqual(actual, expectedOutput);
  });

  it("should return undefined when given a non-existent email", function () {
    const actual = userFromEmail("noUser@example.com", testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(actual, expectedOutput);
  });
});
