const { Document } = require('flexsearch');
const data = require('./search-data');

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

const getSearchResults = async (query) =>
  new Promise((resolve) => {
    index.searchAsync(query, (results) => {
      resolve(
        results.reduce(
          (a, b) => [
            ...a,
            b.result.map((e) => {
              return {
                title: data[e].data.title,
                url: data[e].data.permalink,
                content: data[e].content.slice(0, 150).trim() + '...',
                imageURL: data[e].imageURL,
              };
            }),
          ],
          []
        )
      );
    });
  });

module.exports = getSearchResults;
