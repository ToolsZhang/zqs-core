import { Zqs } from '../src/app';
import * as auth from '../src/auth';

console.log = jest.fn();
console.error = jest.fn();

describe('AuthModel', () => {
  let use;
  beforeAll(() => {
    const app = Zqs.create('hi', {
      auth: {
        messages: {
          errors: {
            empty_username: 'Username cannot be blank',
            empty_password: 'Password cannot be blank',
            username_already_in_use:
              'The specified username is already in use.',
            username_not_registered: '该用户名未注册成为管理员.',
            invalid_password: 'Invalid password',
            unauthorized: 'Unauthorized',
            invalid_token: 'Invalid token',
            no_permission: 'No permission to access',
          },
        },
        secret: 'This is a secret',
        enableSimpleAuth: true,
        defaultRoles: ['user', 'admin', 'super'],
      },
    });

    const back = (app as any).use;
    (app as any).use = x => (use = x);
    auth.setup(app);
  });

  it('should create AuthSchema', async () => {
    expect(auth.AuthSchema).toBeTruthy();
  });

  it('should create AuthModel', async () => {
    expect(auth.AuthModel).toBeTruthy();
  });

  it('should get token', () => {
    expect(
      auth.getHeaderToken({ headers: { authorization: 'xxx' } } as any)
    ).toBe(null);
    expect(auth.getHeaderToken({ headers: {} } as any)).toBe(null);
    expect(
      auth.getHeaderToken({ headers: { authorization: 'Bearer xxx' } } as any)
    ).toBe('xxx');
  });

  it('should sign token', async () => {
    const doc = { _id: 1 };
    const signed = auth.signToken(doc as any, {});
    const verified = await auth.verifyToken(signed);
    expect(signed).toMatch(/^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/);
    expect(verified).toMatchObject(doc);
  });

  it('should call app use', async () => {
    use({ headers: { authorization: 'xxx' } }, () => Promise.resolve());
    expect(1).toBe(1);
  });
});
