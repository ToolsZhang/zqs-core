import { handleError } from '../src/errors';
import * as boom from '@hapi/boom';

console.log = jest.fn();
console.error = jest.fn();

test('it should handle boom', () => {
  const err = boom.badData();
  const ctx: any = {};
  handleError(ctx, err);
  expect(ctx.status).toBe(422);
});

test('it should handle CastError', () => {
  const err = new Error();
  err.name = 'CastError';
  (<any>err).errors = { foo: 'bar' };
  const ctx: any = {};
  handleError(ctx, err);
  expect(ctx.status).toBe(422);
});

test('it should handle ValidationError', () => {
  const err = new Error();
  err.name = 'ValidationError';
  const ctx: any = {};
  handleError(ctx, err);
  expect(ctx.status).toBe(422);
});

test('it should handle SyntaxError', () => {
  const err = new Error();
  err.name = 'SyntaxError';
  const ctx: any = {};
  handleError(ctx, err);
  expect(ctx.status).toBe(422);
});

test('it should handle 5xx errors', () => {
  const err = new Error();
  const ctx: any = {};
  handleError(ctx, err);
  expect(ctx.status).toBe(500);
});
