const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const isAuthenticated = require('./authMiddleware');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const ejs = require('ejs');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'harlee-buddy', 
  resave: false,
  saveUninitialized: false 
}));

// Connecting with PostgreSQL database
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MakeupSearch',
  password: 'HarleeBuddy0211',
  port: 5432,
});

//Connecting with MongoDB database
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function connectToMongo() {
  try{
    await client.connect();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}
connectToMongo();

// GET Routes
app.get('/', (req, res) => {
  res.render('index', { isAuthenticated: req.session.user });
});

app.get('/signup', (req, res) => {
  res.render('signup', { isAuthenticated: req.session.user });;
});

app.get('/login', (req, res) => {
  res.render('login', { isAuthenticated: req.session.user });
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
})

app.get('/search', (req, res) => {
  res.render('search', { isAuthenticated: req.session.user });
});

app.get('/results', (req, res) => {
  res.render('results', { isAuthenticated: req.session.user });
});

// GET route to add personal information as well as search history onto the profile page
app.get('/profile', isAuthenticated, async (req, res) => {
  try {
    if (!req.session.user) {
      res.redirect('/login');
      return;
    }
    // Get user information for profile
    const userId = req.session.user.user_id; 
    const userQuery = await pool.query('SELECT first_name, last_name, email FROM users WHERE user_id = $1', [userId]); 
    const user = userQuery.rows[0];

    if (!user) {
      console.log('Error - user not found');
      res.status(404).send('User not found');
      return;
    }

    //Get search history for profile
    const searchHistoryQuery = await pool.query('SELECT search_query, search_timestamp FROM search_history WHERE user_id = $1', [userId]);
    const searchHistory = searchHistoryQuery.rows;

    console.log('Retrieved user from database:', user);
    res.render('profile', { isAuthenticated: true, user: user, searchHistory: searchHistory });

  } catch (error) { 
    console.error('Error retrieving user information:', error);
    res.status(500).send('Internal server error');
  }
});



// POST route to handle the insertion of user information used to login, search and create profile
app.post('/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (first_name, last_name, email, password) VALUES ($1, $2, $3, $4)', [firstName, lastName, email, hashedPassword]);
    res.redirect('/login');
  } catch {
    console.error('Error signing up: ', error);
    res.status(500).send('Internnal server error');
  }
});

// POST route to authorize user by email and password and allow access to profile and search pages
// Retrieves information from database
app.post('/login', async (req, res) => { 
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!bcrypt.compareSync(password, user.password)) {
      req.session.flash = { type: 'error', message: 'Invalid username or password.' };
      res.redirect('/login');
      return;
    }
    
    req.session.user = user;
    res.redirect('/search');

  } catch (error) {
    console.error('Error retrieving user: ', error);
    res.status(500).send('Internal server error');
  }
});

// POST route to logout 
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// POST route to search - can't use unless logged in, allows search for key queries product name, brand 
// and category. Retrieves results from database and displays them on search results page

app.post('/search', isAuthenticated, async (req, res) => {
  const { query, database } = req.body;

  try {
    const userId = req.session.user.user_id;
    await pool.query('INSERT INTO search_history (user_id, search_query) VALUES ($1, $2)', [userId, query]);
    
    let results;
    if (database === 'PostgreSQL') {
      const pgQuery = `SELECT product_name, product_brand, product_price, makeup_store FROM makeup_products WHERE product_name ILIKE $1 OR product_brand ILIKE $1 OR product_category ILIKE $1`; 
      const pgResult = await pool.query(pgQuery, [`%${query}%`]);
      results = pgResult.rows;
    } else if (database === 'MongoDB') {
      await client.connect();
      const collection = client.db('MakeupSearch').collection('makeup_products');
      mongoResult = await collection.find({
        $or: [
          { product_name: { $regex: query, $options: 'i' } },
          { product_brand: { $regex: query, $options: 'i' } },
          { product_category: { $regex: query, $options: 'i' } }
        ]
      }).toArray();
      results = mongoResult;
    }

    res.render('results', { results });
  } catch (error) {
    console.error('Error searching for make up products:', error);
    res.status(500).send('Internal server error');
  }
});

// POST route for search result page
app.post('/results', (req, res) => {
  console.log(req.body);
  res.redirect('/');
});

// POST route for profile page
app.post('/profile', (req, res) => {
  console.log(req.body);
  res.redirect('/');
});

// Function to listen to port and show application
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

module.exports = app;