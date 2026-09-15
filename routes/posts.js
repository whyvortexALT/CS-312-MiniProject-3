const express = require('express');
const store = require('../data/store');

const router = express.Router();

/* ---------- Validation ---------- */
function validate({ title = '', author = '', category = '', content = '' }) {
  const errors = [];

  if (!title.trim()) errors.push('A title is required.');
  else if (title.trim().length > 120) errors.push('Title must be 120 characters or fewer.');

  if (!author.trim()) errors.push('An author name is required.');
  else if (author.trim().length > 60) errors.push('Author name must be 60 characters or fewer.');

  if (!category || !store.CATEGORIES.includes(category))
    errors.push('Please choose a category from the list.');

  if (!content.trim()) errors.push('Some content is required.');
  else if (content.trim().length < 10) errors.push('Content must be at least 10 characters long.');

  return errors;
}

function clean({ title = '', author = '', category = '', content = '' }) {
  return {
    title: title.trim(),
    author: author.trim(),
    category: category.trim(),
    content: content.trim(),
  };
}

/* ---------- Homepage: list + create form ---------- */

// GET /posts  →  homepage (posts + inline create form)
router.get('/', (req, res) => {
  const { category } = req.query;
  const posts = category ? store.byCategory(category) : store.all();

  res.render('index', {
    title: 'Home',
    posts,
    activeCategory: category && store.CATEGORIES.includes(category) ? category : '',
    formData: { title: '', author: '', category: '', content: '' },
    errors: [],
  });
});

// POST /posts  →  handle form submission
router.post('/', (req, res) => {
  const errors = validate(req.body);
  const data = clean(req.body);

  if (errors.length) {
    // Re-render the homepage so the user can fix things, preserving input
    return res.status(400).render('index', {
      title: 'Home',
      posts: store.all(),
      activeCategory: '',
      formData: data,
      errors,
    });
  }

  const post = store.create(data);
  res.redirect(`/posts/${post.id}`);
});

/* ---------- Single post, edit, delete ---------- */

router.get('/:id', (req, res, next) => {
  const post = store.find(req.params.id);
  if (!post) return next();
  res.render('show', { title: post.title, post });
});

router.get('/:id/edit', (req, res, next) => {
  const post = store.find(req.params.id);
  if (!post) return next();
  res.render('edit', {
    title: `Edit: ${post.title}`,
    post,
    errors: [],
  });
});

router.put('/:id', (req, res, next) => {
  const existing = store.find(req.params.id);
  if (!existing) return next();

  const errors = validate(req.body);
  const data = clean(req.body);

  if (errors.length) {
    return res.status(400).render('edit', {
      title: `Edit: ${existing.title}`,
      post: { ...existing, ...data },
      errors,
    });
  }

  store.update(req.params.id, data);
  res.redirect(`/posts/${req.params.id}`);
});

router.delete('/:id', (req, res, next) => {
  const removed = store.remove(req.params.id);
  if (!removed) return next();
  res.redirect('/posts');
});

module.exports = router;