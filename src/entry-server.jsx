import { getDataFromTree } from '@apollo/client/react/ssr';
import { StaticRouter } from 'react-router-dom';
import { ApolloClient, ApolloProvider, createHttpLink } from '@apollo/client';
import App from './App';

export default function render(url, context) {
  const {
    apolloStore,
    ...ctx
  } = context;

  const client = new ApolloClient({
    link: createHttpLink({
      uri: 'http://localhost:3111/graphql',
      credentials: 'same-origin',
    }),
    ssrMode: true,
    cache: apolloStore,
    credentials: 'same-origin',
  });

  return getDataFromTree(
    <ApolloProvider client={client}>
      <StaticRouter location={url} context={ctx}>
        <App />
      </StaticRouter>
    </ApolloProvider>,
  );
}
