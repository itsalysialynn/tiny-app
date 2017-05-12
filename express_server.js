const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

const app = express();

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || "development"],
  maxAge: 24 * 60 * 60 * 1000
}));

const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(function(req, res, next){
  res.locals.userid = req.session.user_id;
  res.locals.user = users[req.session.user_id];
  next();
});

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "me@me.com",
    password: bcrypt.hashSync("me", 10)
  }
};

function generateRandomString() {
  let text = "";
  let charset = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUWXYZ";

  for (let i = 0; i < 6 ; i++) {
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return text;
}

function userSpecificURLS(user_id){
  let result = {};
  for (let shortURL in urlDatabase) {
    let URL = urlDatabase[shortURL];
    if (user_id === URL.userID) {
      result[shortURL] = URL;
    }
  }
  return result;
}

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/urls", (req, res) => {
  let userid = req.session["user_id"];
  let URLS = userSpecificURLS(userid);
  if (userid) {
    let templateVars = { urls: URLS, user: users[userid] };
    res.render("urls_index", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.get("/urls/new", (req, res) => {
  let user_ID = req.session["user_id"];
  if (users[user_ID]) {
    res.render("urls_new");
  } else {
    res.redirect("/login");
  }
  
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});



app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Email or password not entered!');
    return;
  }
  for (let user in users) {
    if (users[user].email === req.body.email) {
      res.status(400).send('Email already exists.');
      return;
    }
  }
  let randomID = generateRandomString();
  users[randomID] = {id: randomID, email: req.body.email, password: bcrypt.hashSync(req.body.password, 10)};
  req.session["user_id"] = randomID;
  res.redirect("/urls/");
});

app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send('Please enter both email and password');
    return;
  }
  for (let user in users) {
    if (users[user].email === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session["user_id"] = users[user].id;
        res.redirect("/urls");
        return;
      } else {
        res.status(403).send('Password for this email is not correct');
        return;
      }
    }
  }
  res.status(403).send('Email does not exist!');
});

app.post("/logout", (req, res) => {
  req.session = undefined;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: req.session["user_id"]};
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.newLongUrl;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});