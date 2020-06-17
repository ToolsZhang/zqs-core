import { setup } from '../src/http';
import * as http from 'http';

console.log = jest.fn();
console.error = jest.fn();

// 1. test http
// 1.1 test run http with preListen
test('it sould run http', async () => {
  const app: any = {
    config: {
      http: {
        preListen: x => {},
      },
      domain: 'test.com',
      port: 80,
    },
    callback: () => true,
  };
  (<any>http).createServer = x => {
    return {
      listen: x => {},
    };
  };
  const res = await setup(app);
  expect(res).toBe(undefined);
});
// 1.2 test run http without preListen
test('it sould run http without preListen', async () => {
  const app: any = {
    config: {
      http: {},
      domain: 'test.com',
      port: 80,
    },
    callback: () => true,
  };
  (<any>http).createServer = x => {
    return {
      listen: x => {},
    };
  };
  const res = await setup(app);
  expect(res).toBe(undefined);
});
// there is wrong... 47,48,50,51
// 2. test run socketIo
test('it sould run socket', async () => {
  const app: any = {
    dirname: __dirname,
    config: {
      http: {
        socket: {
          onConnection: true,
        },
      },
      domain: 'test.com',
      port: 80,
    },
    callback: () => true,
  };
  (<any>http).createServer = x => {
    return {
      listen: x => {},
    };
  };

  // const res = await setupSocketIo(app,  app.callback());
  // expect(res).toBe(undefined);
});
