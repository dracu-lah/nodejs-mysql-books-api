var express = require("express");
var app = express();
var mysql = require("mysql");
var bodyParser = require("body-parser"); //used to parse details from page
// fix cors issue -cross origin resource sharing
var cors = require("cors"); // used as a middleware
var jwt = require("jsonwebtoken");
const { response } = require("express");

//json parser
var jsonParser = bodyParser.json();

//url encoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(cors());

//connecting mysql
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "book_db",
});

con.connect((err) => {
  if (err) throw err;
  console.log("connected to database");
});

// middleware for verification
function verifyToken(req, res, next) {
  let authHeader = req.headers.authorization;
  if (authHeader == undefined) {
    res.status(401).send({ error: "no token provided" });
  }
  // splits author to divide bearer and the token, [1] for taking the last set form splitted element
  let token = authHeader.split(" ").pop();
  jwt.verify(token, "secret", (err, decoded) => {
    if (err) {
      res.status(500).send({ error: "Authentication failed" });
    } else {
      // res.send(decoded); //decoded result
      next();
    }
  });
}

app.post("/login", jsonParser, (req, res) => {
  if (req.body.username == undefined || req.body.password == undefined) {
    res.status(500).send({ error: "authentication failed" });
  }
  let username = req.body.username;
  let password = req.body.password;
  let qr = `select display_name from users where username = '${username}' and password = sha1('${password}')`;
  con.query(qr, (err, result) => {
    if (err || result.length == 0) {
      res.status(500).send({ error: "login failed" });
    } else {
      // res.status(200).send({success:"login success"})
      let resp = {
        id: result[0].id,
        display_name: result[0].display_name,
      };
      let token = jwt.sign(resp, "secret", { expiresIn: 60 });
      res.status(200).send({ auth: "true", token: token });
    }
  });
});

//get books
app.get("/books", verifyToken, (req, res) => {
  con.query("select * from books", (err, result, fields) => {
    if (err) throw err;
    // console.log(result)  //mysql data is saved to result and show to terminal
    res.send(result);
  });
});

//get single book
app.get("/book/:id", (req, res) => {
  let id = req.params.id;
  con.query("select * from books where id =" + id, (err, result, fields) => {
    if (err) throw err;
    res.send(result);
  });
});

//post a new book
app.post("/books", jsonParser, verifyToken, (req, res) => {
  let book_title = req.body.book_title;
  let description = req.body.description;
  let author_name = req.body.author_name;
  let price = req.body.price;
  let qr = ` insert into books(book_title, description, author_name, price) values('${book_title}', '${description}', '${author_name}', ${price}) `;
  con.query(qr, (err, result) => {
    if (err) {
      res.send({ error: "Operation failed" });
    } else {
      res.send({ success: "Operation completed" });
    }
  });
});

//update a new book
app.patch("/book", jsonParser, (req, res) => {
  let book_title = req.body.book_title;
  let description = req.body.description;
  let author_name = req.body.author;
  let price = req.body.price;
  let id = req.body.id; //another way of doing this instead of book/:id

  let qr = `update books set book_title= '${book_title}', description= '${description}', author_name= '${author_name}', price= ${price} where id=${id}`;
  con.query(qr, (err, result) => {
    if (err) {
      res.send({ error: "Updation failed" });
    } else {
      res.send({ success: "Updation completed" });
    }
  });
});

//delete a book
app.delete("/book/:id", (req, res) => {
  let id = req.params.id;
  let qr = `delete from books where id = ${id}`;
  con.query(qr, (err, result) => {
    if (err) {
      res.send({ error: "Deletion failed" });
    } else {
      res.send({ success: "Deletion completed" });
    }
  });
});

app.get("/", (req, res) => {
  res.send("<h1>Welcome Page</h1>");
});

app.listen(9000, () => {
  console.log("server started");
});
