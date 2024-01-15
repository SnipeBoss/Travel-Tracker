import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

// Enable app
const app = express();
const port = 3000;

// Connect to database
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "23Bossengine",
  port: 5432,
});
db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Initial user
let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];


// Select from country code
async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}


// Define variable to define user id
let currentUserId = 1;
// Getting current user
async function GetCurrentUser() {
  // Select all user
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  // Return current user
  return users.find((user) => user.id == currentUserId);
}


// GET PAGE
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await GetCurrentUser();

  console.log(currentUser)

  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});


// Add Country Button
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await GetCurrentUser();

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});


// Click name user to respond back
app.post("/user", async (req, res) => {
  // If add is new then render adding new member
  if (req.body.add === "new")
  {
    res.render("new.ejs")
  }
  // Else it gonna be name of user then render the map page of that user
  else 
  {
    currentUserId = req.body.user;
    console.log(currentUserId)
    res.redirect("/")
  }
});


// Adding new user
app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html

  // Request body from new.ejs
  const name = req.body.name;
  const color = req.body.color;

  // Insert to database
  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  // Go straight to new user map
  const id = result.rows[0].id;
  currentUserId = id;
  console.log(currentUserId)
  
  // Redirect normal page
  res.redirect("/");
});












app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
