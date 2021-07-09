# DACB Site Search Engine

## Description

Source code for the functionality of the site's search engine.

This not only encompasses the build stage — in compiling site data to be searched; and a search phase, which is to be run on the browser to search that compiled data.

## Deployment

The first version of deployment relies on this site being pushed to GitHub pages, and the DACB website requesting the search scripts directly from the GitHub pages URL. However, the current version, while possibly not yet deployed, builds search scripts directly to the DACB website source, meaning that GitHub pages on this site isn't necessary in that iteration. In fact, once that is completely phased out, the additional build directory (`dist`) on this repo could be completely removed too.

## Technologies

The search engine is written in Node.js, and comprises of a single build phase, which builds static JavaScript files to be fetched and run on the client side. These files include the full search functionality, including all of the search index and database necessary for it to function. Simply fetch a built search script, and a global function will be available to easily get results for search queries.

## Building

Information on building the search engine is available on the site documentation.

The current system uses a single build script titled `build`, which calls webpack to first compile a database of pages, and subsequently compile that database as well as the search functionality into the minified output files.

## Performance & Libraries Used

For the content search, Flexsearch is used, and fetched with NPM.

For the lightweight search, which only searches the titles of pages, a simple linear search implementation exists, which is efficient for the current ~3500 pages that are indexed.

## File Structure

The source code is split into three main parts: `compile` to handle compiling all of the page/site database; `data` to store all of the data compiled in `compile`; and client, the client side code that's actually built by webpack and consumed by the site on the browser.

The final built code to be used is located in the `dist` directory. Identical files are also built into the site `dacb/source` directory itself, which helps fix up some of the issues running the search engine offline.

## Markdown & HTML Parsing of Search Content

The data compilation phase first fetches a list of file paths of pages, written in Markdown or HTML. For Markdown files, the compile program parses the Markdown with Kramdown, just as Jekyll would. There are a couple of minor bugs that this can cause, particularly with embedded HTML. For example, if a particular page is formatted incorrectly and includes an error like `{:class=bio]` (wrong closing bracket), the Kramdown parser in Jekyll might ignore that issue if it is placed in a certain way, whereas the search Markdown parser might not.

This parsing also removes useless content and attempts to fix other some common issues as well.

## Site Content Build

`_data/site-content.yml` is a file that is responsible for storing a general index of the entire site for pages to consume. Ex: the sorts pages loop through the pages list defined in the site content file to sort and display appropriately.

The search engine is responsible for building this file as well as building the search files too. Originally this file was used in search but that's no longer the case for performance reasons and others.

The site content build was generally easier to create with JS as opposed to Jekyll. Originally it was built with Jekyll, but that basically required two build stages in which the first stage built the site content file (among others) and then the second stage built the pages that required the site content file to actually work and build properly. This was not generally ideal, so compiling with the search engine in JS is how the current system works.

**This is why the search engine build must always occur before the site build, and why some sort and data pages might not update until the search engine is built.**

## Multilingual Support

The global functions made available by the search engine code provide not only options for search for a particular query, but also prioritizing a language. For example, if a user is viewing the site French, they may want to see search results in French first. Providing a language option does exactly that.

## Text Highlighting

Text highlighting is done by searching for keywords within a search result's content and subsequently wrapping those highlighted keywords with HTML tags, for example. This can be customized in the code.

When displayed to the user, matching keywords are typically displayed in a well-formatted manner in which multiple matching sections are shown with a ' ... ' separator, and pages with no matches in the content (presumably there was only a match in the title) will simply display a preview of the content of the page with no highlights.

## Images in Search Results

Bios sometimes have images, indicated by image elements that have the 'bio' class. The search result compilation process parses the HTML of each page and fetches these images if applicable, adding them to the search database to be used in results.

## Extending This System & Making Improvements

The code in this repo only covers the simple question of entering a particular search query and then getting a simple list of results data. This does not cover the design, pagination functionality, and so on, which is available on the site. That is located on the site's JS assets itself.

If it is ever a consideration, it would be potentially possible and simple to push this code to a web server of some kind, so that search runs there.

Client-side search like this is generally massively inefficient in terms of affecting load times primarily. The search data itself is over 27mb at the moment, which is truly not ideal for a site like the DACB.

There are a couple of potential solutions to consider if performance becomes a huge issue. One is to separate the data from each language into separate files, and only fetch the file of the current language. The other is to not include metadata like language and image data in results immediately — once a list of results is determined, fetch the data only for those particular results then. The final one is to more effectively utilize workers to perform search faster; but this is more of a secondary optimization since the biggest problem with the search engine is the load times of the files with the data itself.
