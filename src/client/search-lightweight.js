const { sortResultsByLanguage, getWords } = require('./util');
const data = require('../data/search-data-lightweight');

const index = {
  data: {},
  addAsync: async (key, value) => {
    data[key] = value;
  },
  searchAsync: async (query, limit, callback) => {
    let queryWords = getWords(query.toLowerCase());
    let results = {
      fullWordMatches: [],
      startMatches: [],
      startWordMatches: [],
    };
    Object.keys(data).forEach((toSearch) => {
      const toSearchCleaned = toSearch.toLowerCase().trim();
      let toSearchWords = getWords(toSearchCleaned);
      for (word of toSearchWords) {
        for (let queryWord of queryWords) {
          if (queryWord === word) return results.fullWordMatches.push(toSearch);
          if (toSearchCleaned.startsWith(queryWord)) return results.startMatches.push(toSearch);
          if (word.startsWith(queryWord)) return results.startWordMatches.push(toSearch);
        }
      }
    });
    results = [...results.fullWordMatches, ...results.startMatches, ...results.startWordMatches];
    results = results.slice(0, limit);
    callback(results);
  },
};

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
      let results = rawResults.map((e) => ({ title: e, url: data[languagesMap[e]][e], language: languagesMap[e] }));
      results = sortResultsByLanguage(results, queryLang);
      resolve(results);
    });
  });

global.getLightweightSearchResults = getSearchResults;
