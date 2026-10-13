const express = require('express');
const db = require('../db');
const { CATEGORIES } = require('../config');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const POST_COLUMNS = `
  blog_id, creator_name, creator_user_id, title, body, category,
  date_created, date_updated
`;

// basic checks for post
function validate({ title = '', category = '', body = '' }) {
  const errors = [];
  if (!title.trim()) errors.push('A title is required.');
  else if (title.trim().length > 255) errors.push('Title must be 255 characters or fewer.');
  if (!CATEGORIES.includes(category)) errors.push('Please choose a category.');
  if (!body.trim()) errors.push('Some content is required.');
  else if (body.trim().length < 10) errors.push('Content must be at least 10 characters long.');
  return errors;
}

function clean({ title = '', category = '', body = '' }) {
  return { title: title.trim(), category: category.trim(), body: body.trim() };
}

// get the posts from sql
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    const filterActive = CATEGORIES.includes(category);

    const sql = filterActive
      ? `SELECT ${POST_COLUMNS} FROM blogs WHERE category = $1 ORDER BY date_created DESC`
      : `SELECT ${POST_COLUMNS} FROM blogs ORDER BY date_created DESC`;

    const { rows: posts } = await db.query(sql, filterActive ? [category] : []);

    res.render('index', {
      title: 'Home',
      posts,
      activeCategory: filterActive ? category : '',
      formData: { title: '', category: '', body: '' },
      errors: [],
    });
  } catch (err) {
    next(err);
  }
});

// make the new post under the current session user 
router.post('/', requireAuth, async (req, res, next) => {
  const errors = validate(req.body);
  const data = clean(req.body);

  if (errors.length) {
    try {
      const { rows: posts } = await db.query(
        `SELECT ${POST_COLUMNS} FROM blogs ORDER BY date_created DESC`,
      );
      return res.status(400).render('index', {
        title: 'Home',
        posts,
        activeCategory: '',
        formData: data,
        errors,
      });
    } catch (err) {
      return next(err);
    }
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO blogs (creator_name, creator_user_id, title, body, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING blog_id`,
      [req.session.user.name, req.session.user.user_id, data.title, data.body, data.category],
    );
    res.redirect(`/posts/${rows[0].blog_id}`);
  } catch (err) {
    next(err);
  }
});

// render it
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT ${POST_COLUMNS} FROM blogs WHERE blog_id = $1`,
      [req.params.id],
    );
    if (rows.length === 0) return next();
    res.render('show', { title: rows[0].title, post: rows[0] });
  } catch (err) {
    next(err);
  }
});

// check if ur the post creator before letting u edit
router.get('/:id/edit', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT ${POST_COLUMNS} FROM blogs WHERE blog_id = $1`,
      [req.params.id],
    );
    if (rows.length === 0) return next();

    const post = rows[0];
    if (post.creator_user_id !== req.session.user.user_id) {
      return res.status(403).render('error', {
        code: 403,
        heading: 'Not allowed',
        message: 'You can only edit posts that you created.',
      });
    }

    res.render('edit', { title: `Edit: ${post.title}`, post, errors: [] });
  } catch (err) {
    next(err);
  }
});

// check if ur the creator and update
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT ${POST_COLUMNS} FROM blogs WHERE blog_id = $1`,
      [req.params.id],
    );
    if (rows.length === 0) return next();

    const existing = rows[0];
    if (existing.creator_user_id !== req.session.user.user_id) {
      return res.status(403).render('error', {
        code: 403,
        heading: 'Not allowed',
        message: 'You can only edit posts that you created.',
      });
    }

    const errors = validate(req.body);
    const data = clean(req.body);

    if (errors.length) {
      return res.status(400).render('edit', {
        title: `Edit: ${existing.title}`,
        post: { ...existing, ...data },
        errors,
      });
    }

    await db.query(
      `UPDATE blogs
          SET title = $1, body = $2, category = $3, date_updated = NOW()
        WHERE blog_id = $4`,
      [data.title, data.body, data.category, req.params.id],
    );

    res.redirect(`/posts/${req.params.id}`);
  } catch (err) {
    next(err);
  }
});

// checks ownership and deletes form database
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT creator_user_id FROM blogs WHERE blog_id = $1',
      [req.params.id],
    );
    if (rows.length === 0) return next();

    if (rows[0].creator_user_id !== req.session.user.user_id) {
      return res.status(403).render('error', {
        code: 403,
        heading: 'Not allowed',
        message: 'You can only delete posts that you created.',
      });
    }

    await db.query('DELETE FROM blogs WHERE blog_id = $1', [req.params.id]);
    res.redirect('/posts');
  } catch (err) {
    next(err);
  }
});

module.exports = router;