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

module.exports = { highlightKeywords, getSentences, constrainSentencesToWordTotal, getWords };
