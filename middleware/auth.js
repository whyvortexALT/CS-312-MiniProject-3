function attachUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  next();
}

// need user to sign in first
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  const next_ = encodeURIComponent(req.originalUrl);
  res.redirect(`/auth/signin?next=${next_}`);
}

module.exports = { attachUser, requireAuth };