import useGraphHello from '../useHelloGraphQuery';

export default function Home() {
  const { getGraphHello } = useGraphHello();

  return (
    <>
      {getGraphHello()}
      <h1>Home</h1>
    </>
  );
}
