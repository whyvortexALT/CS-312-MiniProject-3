const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();


// sign up functions
router.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/posts');
  res.render('signup', { title: 'Sign up', errors: [], form: {} });
});

// get all info from user
router.post('/signup', async (req, res, next) => {
  const user_id  = (req.body.user_id || '').trim();
  const name     = (req.body.name    || '').trim();
  const password = req.body.password || '';
  const confirm  = req.body.confirm  || '';

  // check if errors
  const errors = [];
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(user_id))
    errors.push('User ID must be 3–30 characters: letters, numbers, or underscore.');
  if (!name) errors.push('Name is required.');
  else if (name.length > 255) errors.push('Name is too long.');
  if (password.length < 6) errors.push('Password must be at least 6 characters.');
  if (password !== confirm) errors.push('Passwords do not match.');

  if (errors.length) {
    return res.status(400).render('signup', {
      title: 'Sign up',
      errors,
      form: { user_id, name },
    });
  }

  try {
    const existing = await db.query('SELECT 1 FROM users WHERE user_id = $1', [user_id]);
    if (existing.rowCount > 0) {
      return res.status(409).render('signup', {
        title: 'Sign up',
        errors: ['That user ID is already taken. Please choose another one.'],
        form: { user_id, name },
      });
    }

    // hash the password for security
    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)',
      [user_id, hash, name],
    );

    // make the user sign into the new account
    res.redirect('/auth/signin?registered=1');
  } catch (err) {
    next(err);
  }
});


// sign in functions
router.get('/signin', (req, res) => {
  if (req.session.user) return res.redirect('/posts');
  res.render('signin', {
    title: 'Sign in',
    errors: [],
    form: {},
    registered: req.query.registered === '1',
    next: typeof req.query.next === 'string' ? req.query.next : '',
  });
});

router.post('/signin', async (req, res, next) => {
  const user_id  = (req.body.user_id || '').trim();
  const password = req.body.password || '';
  const nextUrl  = typeof req.body.next === 'string' ? req.body.next : '';

  try {
    const { rows } = await db.query(
      'SELECT user_id, password, name FROM users WHERE user_id = $1',
      [user_id],
    );

    // if user/pass is invalid give error
    const invalid = () =>
      res.status(401).render('signin', {
        title: 'Sign in',
        errors: ['Incorrect user ID or password.'],
        form: { user_id },
        registered: false,
        next: nextUrl,
      });

    if (rows.length === 0) return invalid();

    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return invalid();

    req.session.user = { user_id: rows[0].user_id, name: rows[0].name };

    const safe = nextUrl.startsWith('/') && !nextUrl.startsWith('//');
    res.redirect(safe ? nextUrl : '/posts');
  } catch (err) {
    next(err);
  }
});


// clears the session
router.post('/signout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/posts');
  });
});

module.exports = router;