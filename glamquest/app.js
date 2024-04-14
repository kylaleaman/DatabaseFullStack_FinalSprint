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

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MakeupSearch',
  password: 'HarleeBuddy0211',
  port: 5432,
});

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function connectToMongo() {
  try{
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}
connectToMongo();

// Routes
app.get('/', (req, res) => {
  res.render('index', { isAuthenticated: req.session.user });
});

app.get('/signup', (req, res) => {
  res.render('signup', { isAuthenticated: req.session.user });;
});

app.get('/login', (req, res) => {
  res.render('login', { isAuthenticated: req.session.user });
});

app.get('/search', (req, res) => {
  res.render('search', { isAuthenticated: req.session.user });
});

app.get('/results', (req, res) => {
  res.render('results', { isAuthenticated: req.session.user });
});

app.get('/profile', async (req, res) => {
  try {
    if (!req.session.user) {
      res.redirect('/login');
      return;
    }

    const userId = req.session.user.user_id; 
    const userQuery = await pool.query('SELECT first_name, last_name, email FROM users WHERE user_id = $1', [userId]); 
    const user = userQuery.rows[0];

    if (!user) {
      console.log('Error - user not found');
      res.status(404).send('User not found');
      return;
    }

    console.log('Retrieved user from database:', user);
    res.render('profile', { isAuthenticated: true, user: user });

  } catch (error) { 
    console.error('Error retrieving user information:', error);
    res.status(500).send('Internal server error');
  }
});




// POST routes to handle submissions of forms
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

app.post('/login', async (req, res) => { 
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      console.log('User not found');
      res.status(401).send('User not found');
      return;
    }

    console.log('Retrieved user from database:', user);

    if (!bcrypt.compareSync(password, user.password)) {
      console.log('Invalid password');
      res.status(401).send('Invalid username or password');
      return;
    }

    console.log('User logged in successfully:', user);
    
    req.session.user = user;
    res.redirect('/profile');

  } catch (error) {
    console.error('Error retrieving user: ', error);
    res.status(500).send('Internal server error');
  }
});



app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.post('/search', async (req, res) => {
  const { query, database } = req.body;

  try {
    let results;

    if (database === 'PostgreSQL') {
      const pgQuery = `SELECT product_name, product_brand, product_price, makeup_store FROM products WHERE product_name ILIKE $1 OR product_brand ILIKE $1 OR product_category ILIKE $1`; 
      const pgResult = await pool.query(pgQuery, [`%${query}%`]);
      results = pgResult.rows;
    } else if (database === 'MongoDB') {
      await client.connect();
      const collection = client.db('MakeupSearch').collection('makeup_products');
      mongoResult = await collection.find({
        $of: [
          { product_name: { $regex: query, $options: 'i' } },
          { product_brand: { $regex: query, $options: 'i' } },
          { product_category: { $regex: query, $options: 'i' } }
        ]
      }).toArray();
      results = mongoResult;
    }

    res.render('results', { results });
  } catch (error) {
    console.error('Error searching for products:', error);
    res.status(500).send('Internal server error');
  }
});

app.post('/results', (req, res) => {
  console.log(req.body);
  res.redirect('/');
});

app.post('/profile', (req, res) => {
  console.log(req.body);
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
