const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Krmx Starter Server', () => {
  it('runs', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const server = require('../src/server').default;
    await sleep(2000);
    await server();
  });
});
