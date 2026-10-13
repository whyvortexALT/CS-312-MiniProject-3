require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');

const { CATEGORIES } = require('./config');
const { attachUser } = require('./middleware/auth');
const authRouter  = require('./routes/auth');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.locals.siteName = 'Blog App';
app.locals.categories = CATEGORIES;
app.locals.formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
app.locals.formatDateTime = (d) =>
  new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use(attachUser);

app.get('/', (req, res) => res.redirect('/posts'));
app.use('/auth',  authRouter);
app.use('/posts', postsRouter);

app.use((req, res) => {
  res.status(404).render('error', {
    code: 404,
    heading: 'Page not found',
    message: "We looked everywhere, but that page doesn't exist.",
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    code: 500,
    heading: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  });
});

app.listen(PORT, () =>
  console.log(`${app.locals.siteName} running at http://localhost:${PORT}`),
);