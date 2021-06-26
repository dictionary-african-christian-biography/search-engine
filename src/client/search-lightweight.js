const { sortResultsByLanguage } = require('./util');
const { Index } = require('flexsearch');
const data = require('../data/search-data-lightweight');

const index = new Index('performance');

const languagesMap = {};
Object.keys(data).forEach((lang) => {
  for (let [key, value] of Object.entries(data[lang])) {
    languagesMap[key] = lang;
    index.addAsync(key, value);
  }
});

const getSearchResults = async (query, queryLang = 'en') =>
  new Promise((resolve) => {
    // limit results to 100
    index.searchAsync(query, 100, (rawResults) => {
      let results = rawResults.map((e) => ({ url: e, title: data[e], language: languagesMap[e] }));
      results = sortResultsByLanguage(results, queryLang);
      resolve(results);
    });
  });

global.getLightweightSearchResults = getSearchResults;
