global.getLightweightSearchResults = require('./search-lightweight');
getLightweightSearchResults('John').then((e) => {
  console.log(e);
});

global.getSearchResults = require('./search');
getSearchResults('Charles').then((e) => {
  console.log(e);
});
