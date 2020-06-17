import { response } from '../src/response';
import { Js2Xml } from 'js2xml';

console.log = jest.fn();
console.error = jest.fn();

test('is should response without body', () => {
  const ctx: any = {
    headers: {
      accept: 'application/json',
    },
  };
  const body = { foo: 'bar' };
  response(ctx, 200);
  expect(ctx.status).toBe(200);
});

test('is should response json', () => {
  const ctx: any = {
    headers: {
      accept: 'application/json',
    },
  };
  const body = { foo: 'bar' };
  response(ctx, 200, body);
  expect(ctx.body).toBe(body);
  expect(ctx.status).toBe(200);
});

test('is should response xml', () => {
  const ctx: any = {
    headers: {
      accept: 'application/xml',
    },
  };
  const body = { foo: 'bar' };
  const json = JSON.stringify(body);
  const obj = JSON.parse(json);
  const xml: any = new Js2Xml('xml', obj);

  response(ctx, 200, body);
  expect(ctx.body).toBe(xml.toString());
  expect(ctx.status).toBe(200);
});
