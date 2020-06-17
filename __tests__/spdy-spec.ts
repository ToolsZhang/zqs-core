import { setup } from '../src/spdy';
import * as spdy from 'spdy';

console.log = jest.fn();
console.error = jest.fn();

test('it sould not run spdy', async () => {
  const app: any = {
    config: {
      spdy: false,
    },
  };
  const res = await setup(app);
  expect(res).toBe(false);
});

// test('it sould run spdy', async () => {
//   const app: any = {
//     config: {
//       spdy: {
//         options: true,
//         port: 433,
//       },
//       domain: 'test.com',
//     },
//     callback: () => true,
//   };
//   spdy.createServer = (a, b) => {
//     return {
//       listen: x => { },
//     };
//   }; const res = await setup(app);
//   expect(res).toBe(true);
// });
