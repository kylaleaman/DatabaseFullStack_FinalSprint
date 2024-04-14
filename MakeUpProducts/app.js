const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const isAuthenticated = require('./authMiddleware');


const app = express();
const port = 3000;

app.set('view engine', 'ejs');
const ejs = require('ejs');
app.use(express.static('public'));

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'MakeupSearch',
  password: 'HarleeBuddy0211',
  port: 5432,
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'harlee-buddy', 
  resave: false,
  saveUninitialized: false 
}));


// Mock user data (replace with database later)
const users = [];

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
    const originalUrl = req.session.originalUrl || '/';
    delete req.session.originalUrl;
    res.redirect(originalUrl);
  } catch (error) {
    console.error('Error retrieving user: ', error);
    res.status(500).send('Internal server error');
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

app.post('/search', (req, res) => {
  console.log(req.body);
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
