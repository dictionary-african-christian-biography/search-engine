const { Index } = require('flexsearch');
const data = require('../data/search-data-lightweight');

const index = new Index('performance');
for (let [key, value] of Object.entries(data)) {
  index.addAsync(key, value);
}
const getSearchResults = async (query) =>
  new Promise((resolve) => {
    index.searchAsync(query, (results) => {
      resolve(results.map((e) => ({ url: e, title: data[e] })));
    });
  });

global.getLightweightSearchResults = getSearchResults;
