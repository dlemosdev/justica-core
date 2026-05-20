module.exports = {
  '*.{ts,js,html,css,scss,json,md,yml,yaml}': ['prettier --write'],
  '*.{ts,js}': ['npm run lint']
};
