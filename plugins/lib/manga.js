const axios = require("axios");
const cheerio = require("cheerio");
const { dl } = require("./download");
const { createPdf } = require("./pdf");

async function getManga(url) {
  return new Promise((resolve) => {
    axios(url).then(async (response) => {
      const html = response.data;
      const ch = cheerio.load(html);
      const article = [];
      ch(".panel-search-story>.search-story-item h3", html).each(function () {
        const title = ch(this).find("a").text();
        const lin =
          "https://ww5.manganelo.tv/" + ch(this).find("a").attr("href");

        article.push({
          title,
          lin,
        });
      });
      resolve(article);
    });
  });
}
async function getChapter(url) {
  return new Promise((resolve) => {
    axios(url).then(async (response) => {
      const html = response.data;
      const ch = cheerio.load(html);
      const article = [];
      ch(".row-content-chapter .a-h", html).each(function () {
        const title = ch(this).find("a").text();
        const lin =
          "https://ww5.manganelo.tv/" + ch(this).find("a").attr("href");

        article.push({
          title,
          lin,
        });
      });
      resolve(article);
    });
  });
}

function getBuffArray(url) {
  return axios(url).then(async (response) => {
    const html = response.data;
    const ch = cheerio.load(html);
    const article = [];
    let name = 0;
    ch(".container-chapter-reader img", html).each(function () {
      const lin = ch(this).attr("data-src");
      article.push({
        lin,
      });
    });
    const promises = article.map(async (item) => {
      const buffer = await dl(item.lin);
      return { item, buffer };
    });

    const results = await Promise.all(promises);

    const arr = results.map((result) => result.buffer);

    return arr;
  });
}

async function getBuffer(url, title) {
  const array = await getBuffArray(url);
  return await createPdf(array, `${title}.pdf`);
}

module.exports = {
  getManga,
  getChapter,
  getBuffer,
};
