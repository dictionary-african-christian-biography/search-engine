require('./util');
const fs = require('fs');
const path = require('path');
const grayMatter = require('gray-matter');
const config = require('./config.json');
const striptags = require('striptags');
const cheerio = require('cheerio');
const KramdownAttrs = require('markdown-it-kramdown-attrs');

const markdownIt = new (require('markdown-it'))();
markdownIt.use(KramdownAttrs);

const logger = {
  log: (text) => console.log(text),
  error: (text) => console.log(`An error occurred with the message: ${text}.`),
};

const saveSearchData = (data) => {
  fs.writeFileSync(config['outpath'], `module.exports = ${JSON.stringify(data)};`);
  const lightweightData = data.reduce((a, b) => ({ ...a, [b.data.title]: b.data.permalink }), {});
  fs.writeFileSync(config['lightweight-outpath'], `module.exports = ${JSON.stringify(lightweightData)};`);
  logger.log(`Saved search data to ${config['outpath']} and lightweight data to ${config['lightweight-outpath']}.`);
};

const findPagesFilePaths = (startPath, ignoreDirectories = []) => {
  let filePaths = [];
  const filesAndDirectories = fs.readdirSync(startPath);
  filesAndDirectories.forEach((item) => {
    const itemPath = path.join(startPath, item);
    if (fs.lstatSync(itemPath).isDirectory() && !ignoreDirectories.contains(path.basename(itemPath))) {
      filePaths = [...filePaths, ...findPagesFilePaths(itemPath)];
    } else {
      const filename = path.basename(itemPath);
      if (filename.endsWith('.html') || filename.endsWith('.md') || filename.endsWith('.markdown')) {
        filePaths.push(itemPath);
      }
    }
  });
  return filePaths;
};

const isValidPage = (page) => {
  if (!page.data.title) return false;
  if (!page.data.permalink) return false;
  return true;
};

const getCleanFileContentAndBioImage = (content, isMarkdown = false) => {
  if (isMarkdown) {
    // convert markdown to HTML
    content = markdownIt.render(content);
  }

  // attempt to find bio image
  const $ = cheerio.load(content);
  const imageURL = $('img.bio').attr('src');

  // remove tags from HTML
  content = striptags(content);

  // convert all whitespace (ex: tabs, spaces, newlines) to spaces
  content = content.replace(/\s/g, ' ');

  return { cleanedContent: content, imageURL };
};

const getDataFromPagePaths = async (pagePaths) =>
  new Promise((resolve, reject) => {
    const pageData = [];
    let pagesCheckedCount = 0;
    pagePaths.forEach((pagePath) => {
      fs.readFile(pagePath, (err, rawContent) => {
        pagesCheckedCount++;
        if (!err) {
          const fileName = path.basename(pagePath);
          const { content, data } = grayMatter(rawContent.toString());
          const { cleanedContent, imageURL } = getCleanFileContentAndBioImage(content, !fileName.endsWith('html'));
          const page = { content: cleanedContent, data, fileName, imageURL };
          if (isValidPage(page)) pageData.push(page);
        }
        if (pagesCheckedCount === pagePaths.length) resolve(pageData);
        if (err) reject(err);
      });
    });
  });

const main = async () => {
  logger.log('Fetching list of pages...');
  const pagePaths = findPagesFilePaths('../', [
    'node_modules',
    '_site',
    'search-engine',
    '_includes',
    '_layouts',
    '_plugins',
    '_sass',
    'templates',
    'resources',
    'images',
    'assets',
  ]);
  logger.log('Fetching data from each page...');
  const pageData = await getDataFromPagePaths(pagePaths);
  logger.log(`Finished fetching data from ${pageData.length} pages.`);
  logger.log('Saving search data...');
  saveSearchData(pageData);
};

main();
