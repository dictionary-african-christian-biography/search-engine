require('./util');
const fs = require('fs');
const path = require('path');
const grayMatter = require('gray-matter');
const { titleCase } = require('title-case');
const striptags = require('striptags');
const cheerio = require('cheerio');
const strftime = require('strftime').timezone(0); // use UTC
const KramdownAttrs = require('markdown-it-kramdown-attrs');
const config = require('./config.json');

const markdownIt = new (require('markdown-it'))({
  html: true,
});
markdownIt.use(KramdownAttrs);

const logger = {
  log: (text) => console.log(text),
  error: (text) => console.log(`An error occurred with the message: ${text}.`),
};

const saveSiteContent = (siteContent) => {
  const siteContentYML = siteContent
    .map((e) => {
      let res = '- ';
      Object.keys(e).forEach((key, i) => {
        if (i > 0) res += '  ';
        res += `${key}: "${e[key].replace(/"/g, '\\"')}"\n`;
      });
      return res;
    })
    .join('\n');
  fs.writeFileSync(config['site-content-outpath'], siteContentYML);
  logger.log(`Saved site content to ${config['site-content-outpath']}.`);
};

const saveSearchData = (data) => {
  fs.writeFileSync(config['outpath'], `module.exports = ${JSON.stringify(data)};`);
  const lightweightData = data.reduce((a, b) => {
    const lang = b.data.lang || 'en';
    return { ...a, [lang]: { ...a[lang], [b.data.title]: b.data.permalink } };
  }, {});
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

  if (isMarkdown) {
    // render another time so that markdown within embedded HTML is rendered
    // ex: markdown that looks like <em>**text here**</em> becomes **text here** when rendering only once.
    // NOTE: this is currently commented because it seems to cause an issue with the Kramdown Attrs package. This isn't that big of a problem so it's fine to leave it here.
    // content = markdownIt.render(content);
  }

  // special case for trying to remove bio image leftover Kramdown Markdown
  content = content.replace(/{:class="bio"}/g, '');

  // remove liquid tags like {{stuff here}} and {%stuff here%}
  content = content.replace(/{%.*%}|{{.*}}/g, '');

  // convert all whitespace (ex: tabs, spaces, newlines) to spaces
  content = content.replace(/\s+/g, ' ');

  return { cleanedContent: content, imageURL };
};

const getCleanFileData = (data) => {
  if (data.title) {
    data.title = titleCase(data.title);
  }
  return data;
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
          let { content, data } = grayMatter(rawContent.toString());
          const { cleanedContent, imageURL } = getCleanFileContentAndBioImage(content, !fileName.endsWith('html'));
          data = getCleanFileData(data);
          const page = { content: cleanedContent, data, fileName, imageURL };
          if (isValidPage(page)) pageData.push(page);
        }
        if (pagesCheckedCount === pagePaths.length) resolve(pageData);
        if (err) reject(err);
      });
    });
  });

const createSiteContentFromPageData = (pageData) => {
  const siteContent = [];
  const frontMatterKeys = [
    'title',
    'date',
    'index',
    'century',
    'tradition',
    'affiliation',
    'categories',
    'lang',
    'languages-available',
    'author',
    'institution',
    'upload',
    'country',
    'tags',
    'url',
  ];
  const tagKeys = [
    'ancient',
    'artist',
    'catechist',
    'clergy',
    'diaspora',
    'ecologist',
    'ecumenist',
    'evangelist',
    'nationalist',
    'martyr',
    'persecuted',
    'medical',
    'missionary',
    'musician',
    'nonafrican',
    'nonchristian',
    'photo',
    'scholar',
    'theologian',
    'translator',
    'women',
    'youth',
  ];
  const multikeyLengths = {
    affiliation: 3,
    'languages-available': 4,
    country: 3,
    century: 2,
  };
  pageData.forEach(({ data, content }) => {
    const pageContent = {};
    let pageType;
    let additionalFrontMatterKeys = [];

    // only accept bios, histories, or memories
    if (data.layout === 'single-bio') {
      pageType = 'bio';
    } else if (data.history === 'history') {
      pageType = 'history';
      pageContent.history = 'history';
    } else if (data.memory === 'memory') {
      pageType = 'memory';
      pageContent.memory = 'memory';
      pageContent.content = content.split(' ').slice(0, 100).join(' ') + '...';
      additionalFrontMatterKeys = ['image'];
    } else {
      return;
    }

    // go through keys and take into account each
    [...frontMatterKeys, ...additionalFrontMatterKeys].forEach((rawKey) => {
      const key = rawKey === 'url' ? 'permalink' : rawKey;
      if (data[key]) {
        if (pageType === 'history' && rawKey === 'country') {
          // history pages only have one country
          pageContent[rawKey] = data[key];
        } else if (multikeyLengths[rawKey]) {
          if (multikeyLengths[rawKey] > 2) {
            if (!Array.isArray(data[key])) data[key] = [data[key]];
            for (let i = 0; i < multikeyLengths[rawKey]; i++) {
              pageContent[`${rawKey}${i}`] = data[key][i] || '';
            }
          } else {
            pageContent[rawKey] = data[key].join(', ');
          }
        } else {
          if (data[key] instanceof Date) data[key] = strftime('%Y-%m-%d', data[key]);
          if (Array.isArray(data[key])) data[key] = data[key].join(', ');
          if (!data[key] instanceof String) data[key] = data[key].toString();
          pageContent[rawKey] = data[key];
        }
      } else {
        // the institution and title keys, when left blank are 'none' whereas others are simply empty
        if (rawKey === 'institution' || rawKey === 'title') {
          pageContent[rawKey] = 'none';
        } else {
          pageContent[rawKey] = '';
        }
      }
    });

    const tags = tagKeys.filter((tag) => data[tag] === tag);
    pageContent['tags'] = tags.join(', ') + ', ';

    siteContent.push(pageContent);
  });
  return siteContent;
};

const main = async (sitePath = config['site-path']) => {
  logger.log('Fetching list of pages...');
  const pagePaths = findPagesFilePaths(sitePath, [
    '_site',
    '_includes',
    '_layouts',
    '_plugins',
    '_sass',
    '_templates',
    'resources',
    'images',
    'assets',
  ]);
  logger.log('Fetching data from each page...');
  const pageData = await getDataFromPagePaths(pagePaths);
  logger.log(`Finished fetching data from ${pageData.length} pages.`);
  logger.log('Fetching and saving site content...');
  saveSiteContent(createSiteContentFromPageData(pageData));
  logger.log('Saving search data...');
  saveSearchData(pageData);
};

module.exports = main;
