require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const users = [
  { user_id: 'author1', password: 'password123', name: 'jack' },
  { user_id: 'author2',   password: 'password123',     name: 'bob' },
  { user_id: 'author3', password: 'password123',     name: 'dave' },
];

const blogs = [
  {
    creator: 'author1', category: 'Tech', daysAgo: 6,
    title: 'post1',
    body: 'welcome to the blog this is the first post'

  },
  {
    creator: 'author2', category: 'Lifestyle', daysAgo: 4,
    title: 'post 2',
    body: 'this is the second post'

  },
  {
    creator: 'author3', category: 'Education', daysAgo: 3,
    title: 'post 3',
    body: 'post test number 3'

  },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // insert into users
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      await client.query(
        `INSERT INTO users (user_id, password, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
           SET password = EXCLUDED.password,
               name     = EXCLUDED.name`,
        [u.user_id, hash, u.name],
      );
    }
    console.log(`Seeded ${users.length} users.`);

    // insert into blogs
    for (const b of blogs) {
      const owner = users.find((u) => u.user_id === b.creator);
      const created = new Date(Date.now() - b.daysAgo * 86_400_000);

      await client.query(
        `INSERT INTO blogs
           (creator_name, creator_user_id, title, body, category, date_created, date_updated)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [owner.name, owner.user_id, b.title, b.body, b.category, created],
      );
    }
    console.log(`Seeded ${blogs.length} blogs.`);

    await client.query('COMMIT');
    console.log('Done.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();