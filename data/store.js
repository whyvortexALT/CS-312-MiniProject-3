const CATEGORIES = ['Tech', 'Lifestyle', 'Education', 'Travel', 'Food', 'Other'];

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

let posts = [
  {
    id: 1,
    title: 'post 1',
    author: 'author 1',
    category: 'Tech',
    content: `welcome to the blog this is the first post`,
    createdAt: new Date(now - 6 * DAY),
    updatedAt: new Date(now - 6 * DAY),
  },
  {
    id: 2,
    title: 'post 2',
    author: 'author 2',
    category: 'Lifestyle',
    content: `this is the second post`,
    createdAt: new Date(now - 3 * DAY),
    updatedAt: new Date(now - 2 * DAY),
  },
  {
    id: 3,
    title: 'post 3',
    author: 'author 3',
    category: 'Education',
    content: `Post test number 3`,
    createdAt: new Date(now - 1 * DAY),
    updatedAt: new Date(now - 1 * DAY),
  },
];

let nextId = posts.length + 1;

function all() {
  return [...posts].sort((a, b) => b.createdAt - a.createdAt);
}

function byCategory(category) {
  if (!CATEGORIES.includes(category)) return all();
  return all().filter((p) => p.category === category);
}

function find(id) {
  return posts.find((p) => p.id === Number(id));
}

function create({ title, author, category, content }) {
  const timestamp = new Date();     
  const post = {
    id: nextId++,
    title,
    author,
    category,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  posts.push(post);
  return post;
}

function update(id, { title, author, category, content }) {
  const post = find(id);
  if (!post) return null;
  post.title = title;
  post.author = author;
  post.category = category;
  post.content = content;
  post.updatedAt = new Date();
  return post;
}

function remove(id) {
  const i = posts.findIndex((p) => p.id === Number(id));
  if (i === -1) return false;
  posts.splice(i, 1);
  return true;
}

module.exports = { CATEGORIES, all, byCategory, find, create, update, remove };