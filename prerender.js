// Pre-render the app into static HTML.
// run `npm run generate` and then `dist/static` can be served as a static site.

const serialize = require('serialize-javascript');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { InMemoryCache } = require('@apollo/client');

const toAbsolute = (p) => path.resolve(__dirname, p);

const template = fs.readFileSync(toAbsolute('dist/static/index.html'), 'utf-8');
const render = require('./dist/server/entry-server.js').default;

global.fetch = fetch;

const renderState = (store, windowKey) => {
  const state = serialize(store);
  const autoRemove = ';(function(){var s;(s=document.currentScript||document.scripts[document.scripts.length-1]).parentNode.removeChild(s);}());';
  const nonceAttr = store.nonce ? ` nonce="${store.nonce}"` : '';
  return store
    ? `<script${
      nonceAttr
    }>window.${
      windowKey
    }=${
      state
    }${autoRemove
    }</script>`
    : '';
};

// determine routes to pre-render from src/pages
const routesToPrerender = fs
  .readdirSync(toAbsolute('src/pages'))
  .map((file) => {
    const name = file.replace(/\.jsx$/, '').toLowerCase();
    return name === 'home' ? '/' : `/${name}`;
  });

(async () => {
  // pre-render each route...
  routesToPrerender.forEach(async (url) => {
    const context = {
      apolloStore: new InMemoryCache(),
    };

    console.log(render);
    const appHtml = await render(url, context);

    const html = template
      .replace('<!--app-html-->', appHtml)
      .replace('<!--apollo-state-->', renderState(context.apolloStore.extract(), '__INITIAL_APOLLO_STATE__'));

    const filePath = `dist/static${url === '/' ? '/index' : url}.html`;
    fs.writeFileSync(toAbsolute(filePath), html);
    console.log('pre-rendered:', filePath);
  });
})();
