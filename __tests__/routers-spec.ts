import * as boom from '@hapi/boom';
import { Router, BasicAuthRouter } from '../src/routers';
import { IDocs } from '../src/docs';
import { Zqs } from '../src/app';
import { IContext } from '../src/context';
import { response } from '../src/response';
import { handleError } from '../src/errors';
import * as auth from '../src/auth';

console.log = jest.fn();
console.error = jest.fn();

jest.mock('../src/auth.ts', () => {
  return {
    isAuthenticated: jest.fn(),
    owns: jest.fn(),
    hasRoles: jest.fn(),
    ownsOrHasRoles: jest.fn(),
  };
});

// 331,332,334

describe('test module routers', () => {
  // test class router
  it('test class router', () => {
    // 1 test function paths,
    const router = new Router('myPath');
    // 1.2 paths(...docs: IDocs[]) have params
    const docs2: IDocs[] = [
      {
        path: '/',
        methods: ['put', 'patch'],
        controller: async (ctx: any) => {
          return true;
        },
        tags: ['docs2'],
        responses: {
          200: {
            description: 'Successful operation',
          },
        },
      },
    ];
    expect(router.paths(...docs2).docs).toMatchObject({
      myPath: {
        put: {
          tags: ['docs2'],
          responses: {
            200: {
              description: 'Successful operation',
            },
          },
        },
        patch: {
          tags: ['docs2'],
          responses: {
            200: {
              description: 'Successful operation',
            },
          },
        },
      },
    });

    // 1.3  paths(...docs: IDocs[]) have params with auth
    // ??? auth的问题
    // TypeError: auth_1.ownsOrHasRoles is not a function
    // (auth as any).isAuthenticated.mockImplementation(() => jest.fn().mockImplementation(() => true));
    // const docs3: IDocs[] = [
    //   {
    //     path: '/',
    //     methods: ['delete'],
    //     controller: async (ctx: IContext) => {
    //       try {
    //         const auth = {
    //           username: 'ctx.request.fields.username',
    //           password: 'ctx.request.fields.password',
    //         };
    //         response(ctx, 204);
    //       } catch (e) {
    //         handleError(ctx, e);
    //       }
    //     },
    //     auth: {
    //       type: 'ownsOrHasRoles',
    //       roles: ['user', 'admin'],
    //     },
    //     tags: ['docs3'],
    //     responses: {
    //       204: {
    //         description: 'Successful operation',
    //       },
    //     },
    //   },
    // ];

    // expect(router.paths(...docs3).docs).toMatchObject({
    //   myPath: {
    //     delete: {
    //       description:
    //         '<br />\n<b>Authorization:</b> ownsOrHasRoles\n<b>Roles:</b> user,admin',
    //       security: [{ Bearer: [] }],
    //       tags: ['docs3'],
    //       responses: {
    //         204: {
    //           description: 'Successful operation',
    //         },
    //       },
    //     },
    //   },
    // });

    // // 2. test function routes() return function  这样写对吗？
    // expect(router.routes.name).toEqual('routes');
  });

  // test BasicAuthRouter
  it('test BasicAuthRouter', () => {
    expect(BasicAuthRouter.docs).toMatchObject({
      '/auth/basic/signin': {
        post: {
          tags: ['Auth'],
          summary: 'Sign in',
          description: 'Sign in with username and password',
          consumes: ['application/json', 'application/xml'],
          produces: ['application/json', 'application/xml'],
          parameters: [
            {
              in: 'body',
              name: 'body',
              required: true,
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                  },
                },
                xml: {
                  name: 'xml',
                },
              },
            },
          ],
          responses: {
            200: {
              description: 'Successful operation',
              schema: {
                type: 'object',
                properties: {
                  token: {
                    type: 'string',
                  },
                },
                xml: {
                  name: 'xml',
                },
              },
            },
            403: {
              description: 'Failed',
            },
          },
        },
      },
      '/auth/basic/signup': {
        post: {
          tags: ['Auth'],
          summary: 'Sign in',
          description: 'Sign in with username and password',
          consumes: ['application/json', 'application/xml'],
          produces: ['application/json', 'application/xml'],
          parameters: [
            {
              in: 'body',
              name: 'body',
              required: true,
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                  },
                  password: {
                    type: 'string',
                    format: 'password',
                  },
                },
                xml: {
                  name: 'xml',
                },
              },
            },
          ],
          responses: {
            201: {
              description: 'Successful operation',
              schema: {
                type: 'object',
                properties: {
                  token: {
                    type: 'string',
                  },
                },
                xml: {
                  name: 'xml',
                },
              },
            },
            403: {
              description: 'Failed',
            },
          },
        },
      },
      '/auth/basic/reset': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password',
          description: 'Reset password',
          consumes: ['application/json', 'application/xml'],
          produces: ['text/plain'],
          parameters: [
            {
              in: 'body',
              name: 'body',
              required: true,
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string',
                  },
                  oldPassword: {
                    type: 'string',
                    format: 'password',
                  },
                  newPassword: {
                    type: 'string',
                    format: 'password',
                  },
                },
                xml: {
                  name: 'xml',
                },
              },
            },
          ],
          responses: {
            204: {
              description: 'Successful operation',
            },
            403: {
              description: 'Failed',
            },
          },
        },
      },
    });
    expect(BasicAuthRouter.routes.name).toBe('routes');
  });
});
