const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "userData.db");
let db = null;
const initializedbandserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializedbandserver();
//API1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedpassword = await bcrypt.hash(request.body.password, 10);
  const selectuserquery = `select * from user where username='${username}';`;
  const dbuser = await db.get(selectuserquery);
  if (dbuser !== undefined) {
    response.status(400);
    response.send("User already exists");
  }
  if (dbuser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createuserquuery = `insert into user(username,name,password,gender,location) values('${username}','${name}','${hashedpassword}','${gender}','${location}');`;
      const dbres = await db.run(createuserquuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});
//API2
app.post(`/login`, async (request, response) => {
  const { username, password } = request.body;
  const selectuserquery1 = `select * from user where username='${username}';`;
  const dbuser = await db.get(selectuserquery1);
  if (dbuser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const ispsdmatched = await bcrypt.compare(password, dbuser.password);
    if (ispsdmatched) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
//API3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectuser = `select * from user where username='${username}';`;
  const user = await db.get(selectuser);
  const isPsdMatched = await bcrypt.compare(oldPassword, user.password);
  if (isPsdMatched) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const heshPassword = await bcrypt.hash(newPassword, 10);
      const updateQuery = `update user set password='${heshPassword}' where username='${username}';`;
      const dbresponse = await db.run(updateQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
