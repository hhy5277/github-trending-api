'use strict';

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var cheerio = _interopDefault(require('cheerio'));
var fetch = _interopDefault(require('node-fetch'));
var lodash = require('lodash');
var url = _interopDefault(require('url'));
var express = _interopDefault(require('express'));
var cache = _interopDefault(require('memory-cache'));
var bodyParser = _interopDefault(require('body-parser'));
var cors = _interopDefault(require('cors'));

const GITHUB_URL = 'https://github.com';

function getMatchString(value, pattern) {
  const match = value.match(pattern);

  if (match && match[1]) {
    return match[1];
  } else {
    return null;
  }
}

function filterLanguages(languages) {
  return languages.filter(lang => lang.urlParam && lang.urlParam !== 'unknown');
}

function omitNil(object) {
  return lodash.omitBy(object, lodash.isNil);
}

function removeDefaultAvatarSize(src) {
  /* istanbul ignore if */
  if (!src) {
    return src;
  }

  return src.replace(/\?s=.*$/, '');
}

async function fetchAllLanguages() {
  const data = await fetch(`${GITHUB_URL}/trending/`);
  const $ = cheerio.load(await data.text());

  const getLang = href => getMatchString(href, /\/trending\/([^?/]+)/i);

  const popularLanguages = $('.col-md-3 .filter-item')
    .get()
    .map(a => {
      const $a = $(a);
      return {
        urlParam: getLang($a.attr('href')),
        name: $a.text(),
      };
    });
  const allLanguages = $('.col-md-3 .select-menu-item')
    .get()
    .map(a => {
      const $a = $(a);
      return {
        urlParam: getLang($a.attr('href')),
        name: $a.children('.select-menu-item-text').text(),
      };
    });
  return {
    popular: filterLanguages(popularLanguages),
    all: filterLanguages(allLanguages),
  };
}
async function fetchRepositories({ language = '', since = 'daily' } = {}) {
  const url$$1 = `${GITHUB_URL}/trending/${language}?since=${since}`;
  const data = await fetch(url$$1);
  const $ = cheerio.load(await data.text());
  return $('.repo-list li')
    .get() // eslint-disable-next-line complexity
    .map(repo => {
      const $repo = $(repo);
      const title = $repo
        .find('h3')
        .text()
        .trim();
      const relativeUrl = $repo
        .find('h3')
        .find('a')
        .attr('href');
      const currentPeriodStarsString =
        $repo
          .find('.float-sm-right')
          .text()
          .trim() ||
        /* istanbul ignore next */
        '';
      const builtBy = $repo
        .find('span:contains("Built by")')
        .parent()
        .find('[data-hovercard-type="user"]')
        .map((i, user) => {
          const altString = $(user)
            .children('img')
            .attr('alt');
          const avatarUrl = $(user)
            .children('img')
            .attr('src');
          return {
            username: altString
              ? altString.slice(1)
              : /* istanbul ignore next */
                null,
            href: `${GITHUB_URL}${user.attribs.href}`,
            avatar: removeDefaultAvatarSize(avatarUrl),
          };
        })
        .get();
      const colorNode = $repo.find('.repo-language-color');
      const langColor = colorNode.length
        ? colorNode.css('background-color')
        : null;
      const langNode = $repo.find('[itemprop=programmingLanguage]');
      const lang = langNode.length
        ? langNode.text().trim()
        : /* istanbul ignore next */
          null;
      return omitNil({
        author: title.split(' / ')[0],
        name: title.split(' / ')[1],
        url: `${GITHUB_URL}${relativeUrl}`,
        description:
          $repo
            .find('.py-1 p')
            .text()
            .trim() ||
          /* istanbul ignore next */
          '',
        language: lang,
        languageColor: langColor,
        stars: parseInt(
          $repo
            .find(`[href="${relativeUrl}/stargazers"]`)
            .text()
            .replace(',', '') ||
            /* istanbul ignore next */
            0,
          10
        ),
        forks: parseInt(
          $repo
            .find(`[href="${relativeUrl}/network"]`)
            .text()
            .replace(',', '') ||
            /* istanbul ignore next */
            0,
          10
        ),
        currentPeriodStars: parseInt(
          currentPeriodStarsString.split(' ')[0].replace(',', '') ||
            /* istanbul ignore next */
            0,
          10
        ),
        builtBy,
      });
    });
}
async function fetchDevelopers({ language = '', since = 'daily' } = {}) {
  const data = await fetch(
    `${GITHUB_URL}/trending/developers/${language}?since=${since}`
  );
  const $ = cheerio.load(await data.text());
  return $('.explore-content li')
    .get()
    .map(dev => {
      const $dev = $(dev);
      const relativeUrl = $dev.find('.f3 a').attr('href');
      const name = getMatchString(
        $dev
          .find('.f3 a span')
          .text()
          .trim(),
        /^\((.+)\)$/i
      );
      $dev.find('.f3 a span').remove();
      const username = $dev
        .find('.f3 a')
        .text()
        .trim();
      const $repo = $dev.find('.repo-snipit');
      return omitNil({
        username,
        name,
        url: `${GITHUB_URL}${relativeUrl}`,
        avatar: removeDefaultAvatarSize($dev.find('img').attr('src')),
        repo: {
          name: $repo
            .find('.repo-snipit-name span.repo')
            .text()
            .trim(),
          description:
            $repo
              .find('.repo-snipit-description')
              .text()
              .trim() ||
            /* istanbul ignore next */
            '',
          url: `${GITHUB_URL}${$repo.attr('href')}`,
        },
      });
    });
}

const Towxml = require('towxml');

const towxml = new Towxml();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.get('/languages', async (req, res) => {
  const cached = cache.get('languages');

  if (Boolean(cached)) {
    return res.json(cached);
  }

  const data = await fetchAllLanguages();
  cache.put('languages', data, 1000 * 3600 * 24); // Store for a day

  res.json(data);
});
app.get('/repositories', async (req, res) => {
  try {
    const parsedUrl = url.parse(req.originalUrl);
    const queryString = parsedUrl.query;
    const params = {};

    if (queryString) {
      for (const param of queryString.split('&')) {
        // eslint-disable-next-line prefer-const
        let [key, value] = param.split('='); // Missing `=` should be `null`:
        // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters

        value = value === undefined ? null : value;
        params[key] = value;
      }
    }

    const { language, since } = params;
    const cacheKey = `repositories::${language || 'nolang'}::${since ||
      'daily'}`;
    const cached = cache.get(cacheKey);

    if (Boolean(cached) && cache.length > 0) {
      return res.json(cached);
    }

    const data = await fetchRepositories({
      language,
      since,
    });
    cache.put(cacheKey, data, 1000 * 3600); // Store for a hour

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.toJSON());
  }
});
app.get('/developers', async (req, res) => {
  try {
    const { language, since } = req.query;
    const cacheKey = `developers::${language || 'nolang'}::${since || 'daily'}`;
    const cached = cache.get(cacheKey);

    if (Boolean(cached) && cache.length > 0) {
      return res.json(cached);
    }

    const data = await fetchDevelopers({
      language,
      since,
    });
    cache.put(cacheKey, data, 1000 * 3600); // Store for a hour

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.toJSON());
  }
});
app.get('/parse', async (req, res) => {
  try {
    const { type, content } = req.query;

    if (type === 'markdown') {
      const data = await towxml.toJson(content || '', 'markdown');
      res.json(data);
    } else {
      const data = await towxml.toJson(content || '', 'html');
      res.json(data);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err.toJSON());
  }
});
app.post('/parse', async (req, res) => {
  try {
    const { type, content } = req.body;

    if (type === 'markdown') {
      const data = await towxml.toJson(content || '', 'markdown');
      res.json(data);
    } else {
      const data = await towxml.toJson(content || '', 'html');
      res.json(data);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err.toJSON());
  }
});
app.get('/memsize', (req, res) => {
  res.send(`memsize=${cache.memsize()}`);
});
app.post('/memclear', (req, res) => {
  cache.clear();
  res.sendStatus(200);
});
app.listen(process.env.PORT || 5000, () => {
  console.log('Server started.');
});
