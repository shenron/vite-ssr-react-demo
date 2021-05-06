import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import {
  ApolloClient,
  ApolloProvider,
} from '@apollo/client';
import { apolloCache } from './apolloClient';
import App from './App';

const client = new ApolloClient({
  uri: 'http://localhost:4000',
  cache: apolloCache.restore(window.__INITIAL_APOLLO_STATE__),
  credentials: 'same-origin',
});

delete window.__INITIAL_APOLLO_STATE__;

ReactDOM.hydrate(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ApolloProvider>,
  document.getElementById('app'),
);
