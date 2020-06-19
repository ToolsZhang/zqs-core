import { setup } from '../src/plugins';

console.log = jest.fn();
console.error = jest.fn();

const zpb: any = require('zqs-plugin-bookmark');

jest.mock('fs');
jest.mock('zqs-plugin-bookmark', () => {
  return {
    setup: {
      pre: function() {
        return [1, 2, 3];
      },
      post: function() {},
    },
  };
});

// //  26,27,28,29,30
test('it should setup a plugin failed', async () => {
  const app: any = {
    dir: '/notExists',
  };
  const res = await setup(app, 'pre');
  expect(res).toBeFalsy();
});

test('it should setup a plugin', async () => {
  const app: any = {
    dir: 'E',
    config: {
      root: 'E',
    },
  };
  await setup(app, 'pre');
  zpb.setup = {
    pre: function() {},
    post: function() {},
  };
  await setup(app, 'pre');
  zpb.setup = {
    pre: function() {
      return [1, 2, 3];
    },
    post: function() {},
  };
  await setup(app, 'post');
  zpb.setup = {
    pre: function() {
      return [];
    },
    post: function() {},
  };
  await setup(app, 'pre');
  zpb.setup = {
    pre: false,
  };
  await setup(app, 'pre');
  zpb.setup = {};
  await setup(app, 'post');
  expect(0).toBeFalsy();
});
