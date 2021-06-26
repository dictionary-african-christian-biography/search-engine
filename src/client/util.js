const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getWordAtCharIndex = (words, index) => {
  let currentIndex = 0;
  for (const word of words) {
    const newCurrentIndex = currentIndex + word.length;
    if (currentIndex <= index && index < newCurrentIndex) return word;
    currentIndex = newCurrentIndex;
  }
};
const highlightKeywords = (keywords, content, delimiters = { start: '<strong>', end: '</strong>' }) => {
  const contentWords = content.split(/([\s\.\|\(\)\{\}\[\]\"\?\\\/\+\=!,;:\*]+)/g);

  let wordsToHighlight = new Set();

  keywords.forEach((keyword) => {
    const keywordExp = new RegExp(escapeRegExp(keyword), 'ig');
    const matches = content.matchAll(keywordExp);
    for (const match of matches) {
      wordsToHighlight.add(getWordAtCharIndex(contentWords, match.index));
    }
  });

  wordsToHighlight = Array.from(wordsToHighlight);
  wordsToHighlight.sort((a, b) => b.length - a.length); // longest to shortest so that if shorter strings are substrings of larger ones everything still goes smoothly

  wordsToHighlight.forEach((word) => {
    const replaceExp = new RegExp(escapeRegExp(word), 'ig');
    content = content.replace(replaceExp, (match) => `${delimiters.start}${match}${delimiters.end}`);
  });
  return content;
};
const getSentences = (content) => content.split(/[\.\?\|!]+\s*/g).map((e) => e.trim());
const getWords = (content) => content.split(/\s+/g);
const constrainSentencesToWordTotal = (sentences, wordTotal) => {
  const wordsPerSentence = Math.ceil(wordTotal / sentences.length);
  sentences.forEach((sentence, sentenceIndex) => {
    // the split will include delimiters, so N words with spaces is N * 2 - 1 total elements in the array.
    const newSentence = sentence
      .split(/(\s+)/g)
      .slice(0, wordsPerSentence * 2 - 1)
      .join('');
    sentences[sentenceIndex] = newSentence;
  });
  return sentences;
};

const sortResultsByLanguage = (results, language) => {
  let languagesList = Array.from(new Set(results.map((e) => e.language)));
  if (languagesList.indexOf(language) > -1) languagesList = [language, ...languagesList.filter((e) => e !== language)];
  results = results.map((e, i) => ({ ...e, __weight: i }));
  const calculateCompleteWeight = (item) => item.__weight + results.length * languagesList.indexOf(item.language);
  results.sort((a, b) => calculateCompleteWeight(a) - calculateCompleteWeight(b));
  results = results.map((e) => {
    delete e.__weight;
    return e;
  });
  return results;
};

const addEllipses = (text) => {
  // makes sure that only three periods are present at the end of the text -- no less and no more
  let lastIndex = text.length;
  for (let i = text.length - 1; i--; i <= 0) {
    if (text[i] !== '.') {
      lastIndex = i + 1;
      break;
    }
  }
  text = text.slice(0, lastIndex);
  text += '...';
  return text;
};

module.exports = { highlightKeywords, getSentences, constrainSentencesToWordTotal, getWords, sortResultsByLanguage, addEllipses };
