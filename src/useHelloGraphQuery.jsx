import { gql, useQuery, useApolloClient } from '@apollo/client';
import { useEffect } from 'react'
import { apolloCache } from './apolloClient';


export default function () {
  useEffect(() => {
    return () => {
      apolloCache.evict({
        id: 'ROOT_QUERY',
        fieldName: 'hello'
      })
    }
  }, [])

  const GET_HELLO = gql`query Hello { hello }`;

  const getGraphHello = () => {
    const { loading, data } = useQuery(GET_HELLO);

    if (loading) {
      return <p>Loading ...</p>;
    }
    return <h1>{data.hello}</h1>;
  };

  return {
    getGraphHello,
  };
}

