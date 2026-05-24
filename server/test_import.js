import('./dist/models/User.js').then(m => {
  console.log('Keys:', Object.keys(m));
  console.log('Default:', m.default);
}).catch(console.error);
