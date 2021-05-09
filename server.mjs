// @ts-check
import serialize from 'serialize-javascript';
import fs from 'fs';
import path from 'path';
import express from 'express';
import fetch from 'node-fetch';
import compression from 'compression';
import { InMemoryCache } from '@apollo/client';
import { fileURLToPath } from 'url';
import { ApolloServer, gql } from 'apollo-server-express';

async function startApolloServer(app) {
  // Construct a schema, using GraphQL schema language
  const typeDefs = gql`
    type Query {
      hello: String
    }
  `;

  // Provide resolver functions for your schema fields
  const resolvers = {
    Query: {
      hello: () => 'Hello world!',
    },
  };

  const server = new ApolloServer({ typeDefs, resolvers });
  server.applyMiddleware({ app });
}

global.fetch = fetch;

// we need to change up how __dirname is used for ES6 purposes
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD;

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

export default async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
) {
  const resolve = (p) => path.resolve(__dirname, p);

  const indexProd = isProd
    ? fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
    : '';

  const app = express();
  startApolloServer(app);

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;
  if (!isProd) {
    // eslint-disable-next-line global-require
    vite = await (await import('vite')).createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true,
        watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
      },
    });
    // use vite's connect instance as middleware
    app.use(vite.middlewares);
  } else {
    app.use(compression());
    app.use('/assets', express.static(path.join(__dirname, './dist/client/assets')));
    app.use(
      '/favicon.ico',
      express.static(path.join(__dirname, 'src', 'favicon.ico')),
    );
  }

  app.get('*', async (req, res) => {
    try {
      const url = req.originalUrl;

      const context = {
        apolloStore: new InMemoryCache(),
      };

      let template;
      let
        render;
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).default;
      } else {
        template = indexProd;
        // eslint-disable-next-line global-require
        render = (await (import ('./dist/server/entry-server.js'))).default.default;
      }

      const appHtml = await render(url, context);

      if (context.url) {
        // Somewhere a `<Redirect>` was rendered
        return res.redirect(301, context.url);
      }

      console.log(`render from server ${url}`);

      const html = template
        .replace('<!--app-html-->', appHtml)
        .replace('<!--apollo-state-->', renderState(context.apolloStore.extract(), '__INITIAL_APOLLO_STATE__'));

      return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      if (!isProd) {
        vite.ssrFixStacktrace(e);
      }
      console.log(e.stack);
      return res.status(500).end(e.stack);
    }
  });

  return { app, vite };
}

if (!isTest) {
  createServer().then(({ app }) => app.listen(3111, () => {
    console.log('http://localhost:3111');
    console.log(`🚀 Server ready at http://localhost:3111/graphql`);
  }));
}
