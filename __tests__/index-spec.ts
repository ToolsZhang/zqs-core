import 'jest';
import * as index from '../src/index';

console.log = jest.fn();
console.error = jest.fn();

test('Should have Greeter available', () => {
  expect(index.Zqs).toBeTruthy();
});
