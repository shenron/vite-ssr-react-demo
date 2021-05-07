// Pre-render the app into static HTML.
// run `npm run generate` and then `dist/static` can be served as a static site.

import serialize from 'serialize-javascript';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { InMemoryCache } from '@apollo/client';

// we need to change up how __dirname is used for ES6 purposes
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const toAbsolute = (p) => path.resolve(__dirname, p);

const template = fs.readFileSync(toAbsolute('dist/static/index.html'), 'utf-8');
const render = import('./dist/server/entry-server.js');

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

    const appHtml = await ((await render).default).default(url, context);

    const html = template
      .replace('<!--app-html-->', appHtml)
      .replace('<!--apollo-state-->', renderState(context.apolloStore.extract(), '__INITIAL_APOLLO_STATE__'));

    const filePath = `dist/static${url === '/' ? '/index' : url}.html`;
    fs.writeFileSync(toAbsolute(filePath), html);
    console.log('pre-rendered:', filePath);
  });
})();
