import { Zqs } from '../src/app';

console.log = jest.fn();
console.error = jest.fn();

jest.mock(`../src/auth.ts`, () => {
  return {
    setup: jest.fn(),
  };
});
jest.mock(`../src/http.ts`, () => {
  return {
    setup: jest.fn(),
  };
});
jest.mock(`../src/spdy.ts`, () => {
  return {
    setup: jest.fn(),
  };
});
jest.mock(`../src/socket.ts`, () => {
  return {
    setup: jest.fn(),
  };
});
jest.mock(`../src/mongodb.ts`, () => {
  return {
    setup: jest.fn(),
  };
});
jest.mock(`../src/plugins.ts`, () => {
  return {
    setup: jest.fn(),
  };
});
jest.mock(`../src/routers.ts`, () => {
  return {
    setup: jest.fn(),
  };
});

jest.mock('koa-better-body', () => x => {
  const g = x.handler(
    {
      request: {
        text: (x: any) => '',
      },
    },
    {
      textLimit: 100,
    }
  );
  console.log(g.next());
  console.log(g.next('<a></a>'));
  return function*(next) {
    yield next;
  };
});

describe('Test class Zqs', () => {
  const app = Zqs.create('here', { cors: { ok: 'ok' } });
  console.log(app);

  it('shold be created', () => {
    expect(app).toBeTruthy();
    expect(Zqs.instance).toBe(app);
    expect(app.config).toMatchObject({});
    expect(app.dir).toBe('here');
  });

  it('shold started', () => {
    app.start();
  });
  it('shold started without cors', () => {
    app.config.cors = false;
    app.start();
  });
});
