const http = require("http");
const express = require("express");
const { DataSource } = require("typeorm");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const myDataSource = new DataSource({
  type: process.env.DB_TYPE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

myDataSource.initialize().then(() => {
  console.log("Data Source has been initialized!");
});

const app = express();

dotenv.config();
app.use(express.json());
app.use(cors());

const signup = async (req, res) => {
  try {
    const newUser = req.body;
    const { name, password, email } = newUser;

    if (email === undefined || password === undefined || name === undefined) {
      const error = new Error("KEY_ERROR");
      error.statusCode = 400;
      throw error;
    }

    if (password.length < 8) {
      const error = new Error("INVALID_PASSWORD");
      error.statusCode = 400;
      throw error;
    }

    const regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/g;
    if (!regExp.test(password)) {
      const error = new Error("WRONG_TYPE_OF_PASSWORD");
      error.statusCode = 400;
      throw error;
    }

    const emailCheck = await myDataSource.query(
      `SELECT email FROM users WHERE email ='${email}'`
    );

    if (emailCheck.length !== 0) {
      const error = new Error("DUPLICATE_EMAIL");
      error.statusCode = 400;
      throw error;
    }

    const result = await myDataSource.query(
      `INSERT INTO users
          (email, password, name)
          VALUES
          ('${newUser.email}',
          '${newUser.password}',
          '${newUser.name}')`
    );

    return res.status(201).json({ message: "userCreated" });
  } catch (error) {
    console.log(error);
  }
  return res.status(error.statusCode).json({
    message: error.message,
  });
};

const login = async (req, res) => {
  try {
    const loginUser = req.body;
    const { email, password } = loginUser;

    if (email === undefined || password === undefined) {
      const error = new Error("KEY_ERROR");
      error.statusCode = 400;
      throw error;
    }

    const emailDb = await myDataSource.query(
      `SELECT * FROM users WHERE email = '${email}'`
    );
    if (emailDb.length === 0) {
      const error = new Error("SIGN_UP FIRST");
      error.statusCode = 400;
      throw error;
    }

    if (emailDb[0].password !== password) {
      const error = new Error("WRONG_PASSWORD");
      error.statusCode = 400;
      throw error;
    }

    const payload = { id: 10 };
    const secret = "scret_key";
    const token = jwt.sign(payload, secret);

    return res.status(200).json({
      message: "LOGIN_SUCCESS",
      accessToken: token,
    });
  } catch (error) {
    console.log(error);
  }
};

app.post("/signup", signup);
app.post("/login", login);

const server = http.createServer(app);

const start = async () => {
  try {
    server.listen(8002, () => console.log(`Server is listening on 8002`));
  } catch (err) {
    console.error(err);
  }
};

start();
