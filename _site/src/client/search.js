const { Document } = require('flexsearch');
const data = require('../data/search-data');
const { highlightKeywords, getSentences, constrainSentencesToWordTotal, getWords, sortResultsByLanguage, addEllipses } = require('./util');

const index = new Document({
  document: {
    id: 'id',
    index: ['title', 'content'],
  },
});

data.forEach((item, itemIndex) => {
  index.addAsync({
    id: itemIndex,
    content: item.content,
    title: item.data.title,
  });
});

const getSearchResults = async (query, queryLang = 'en') =>
  new Promise((resolve) => {
    // limit results to 100
    index.searchAsync(query, 100, (results) => {
      results = results.reduce(
        (a, b) => [
          ...a,
          ...b.result.map((e) => {
            return {
              title: data[e].data.title,
              url: data[e].data.permalink,
              layout: data[e].data.layout,
              language: data[e].data.lang,
              content: (() => {
                const wordLimit = 100;
                const getSentenceSection = (sentences, sentenceIndex) =>
                  [...Array(20).keys()]
                    .map((e) => sentences[sentenceIndex + e])
                    .filter((e) => e !== undefined && e.trim().length > 0)
                    .join('. ');

                const keywords = getWords(query);
                const content = highlightKeywords(keywords, data[e].content);
                const contentSentences = getSentences(content);

                let matchingSentences = contentSentences.reduce((a, b, index) => {
                  if (b.match(new RegExp(keywords.join('|'), 'i'))) return [...a, getSentenceSection(contentSentences, index)];
                  return a;
                }, []);

                matchingSentences = matchingSentences.slice(0, 3);
                matchingSentences = constrainSentencesToWordTotal(matchingSentences, wordLimit);

                if (matchingSentences.length === 0) {
                  const result = constrainSentencesToWordTotal([getSentenceSection(contentSentences, 0)], wordLimit)[0];
                  if (result.length > 0) {
                    return addEllipses(result);
                  } else {
                    return 'No description is currently available for this page.';
                  }
                } else if (matchingSentences.length === 1) {
                  return addEllipses(matchingSentences[0]);
                } else {
                  return matchingSentences.join(' ... ');
                }
              })(),
              imageURL: data[e].imageURL,
            };
          }),
        ],
        []
      );
      results = sortResultsByLanguage(results, queryLang);
      resolve(results);
    });
  });

global.getSearchResults = getSearchResults;
