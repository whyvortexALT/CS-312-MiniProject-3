const path = require('path');
const express = require('express');
const methodOverride = require('method-override');

const store = require('./data/store');
const postsRouter = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* ---- Global template helpers ---- */
app.locals.siteName = 'the basic blog';
app.locals.categories = store.CATEGORIES;
app.locals.formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
app.locals.formatDateTime = (date) =>
  new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/', (req, res) => res.redirect('/posts'));
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