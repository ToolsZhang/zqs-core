import * as boom from '@hapi/boom';
import * as ejs from 'ejs';
import * as fs from 'fs';
import * as koa from 'koa';
import * as mount from 'koa-mount';
import * as KRouter from 'koa-router';
import * as serve from 'koa-static';
import * as lodash from 'lodash';
import * as path from 'path';
import { promisify } from 'typed-promisify';
import { IContext } from './context';
import { IModel } from './db';
import { IDocs } from './docs';
import { handleError } from './errors';
import { routers as pluginRouters } from './plugins';
import { response } from './response';
import { Zqs } from './app';
import {
  attach,
  AuthModel,
  hasRoles,
  isAuthenticated,
  owns,
  ownsOrHasRoles,
  signToken,
} from './auth';

export async function setup(app: Zqs) {
  const docs: Router[] = [];
  const apiDir = path.join(app.dir, 'api');
  const dirs = await promisify(fs.readdir)(apiDir);
  for (const dir of dirs) {
    if (/^\./.test(dir)) continue;
    const stat = await promisify(fs.stat)(`${apiDir}/${dir}/router.js`);
    if (stat.isFile) {
      const router: Router = require(`${app.dir}/api/${dir}/router`).default;
      app.use(router.routes());
      docs.push(router);
    }
  }

  /**
   * Add basicAuth
   */
  if (app.config.auth.enableBasicAuth) {
    app.use(BasicAuthRouter.routes());
    docs.push(BasicAuthRouter);
  }

  /**
   * Add plugin
   */
  for (const router of pluginRouters) {
    app.use(router.routes());
    docs.push(router);
  }

  const docsPath = path.join(app.config.root, 'docs', 'www');
  const prefix = app.config.docs.path;
  app.use(mount(prefix, new koa().use(serve(docsPath))));

  const docPaths = docs
    .map(x => x.docs)
    .reduce((a, b) => {
      return lodash.merge(a, b);
    }, {});

  const optionRouter = new KRouter();
  for (const k of Object.keys(docPaths)) {
    const methods = Object.keys(docPaths[k]);
    optionRouter.options(k, ctx => {
      ctx.set('Allow', methods.join().toUpperCase());
      ctx.status = 200;
      ctx.body = '';
    });
    if (/:/.test(k)) {
      const nk = k.replace(/:(\w+)/g, '{$1}');
      docPaths[nk] = docPaths[k];
      delete docPaths[k];
    }
  }
  app.use(optionRouter.routes());

  const doc: any = Object.assign({}, app.config.docs.options);
  doc.paths = docPaths;
  doc.securityDefinitions = {
    Bearer: {
      description:
        'Authorization header using the Bearer schema. More info at [https://jwt.io/introduction/](https://jwt.io/introduction/)',
      in: 'header',
      name: 'Authorization',
      type: 'apiKey',
    },
  };

  const docRouter = new KRouter({
    prefix: app.config.docs.path,
  });

  docRouter.get('/', async ctx => {
    const html = await promisify(fs.readFile)(
      path.join(app.config.root, 'docs', 'index.ejs')
    );
    ctx.status = 200;
    ctx.body = ejs.render(html.toString(), {
      path: app.config.docs.path,
    });
  });

  docRouter.get('/index.json', async ctx => {
    ctx.status = 200;
    ctx.body = doc;
  });
  app.use(docRouter.routes());

  for (const s of app.config.statics) {
    app.use(mount(s.endpoint, new koa().use(serve(s.path))));
  }
}

/**
 * Zqs Router
 */
export class Router {
  public docs: any;
  /**
   * Zqs model
   *
   * @type {IModel}
   * @memberof Router
   */
  public model: IModel;
  private __router: KRouter;
  private __prefix: string;

  /**
   * Creating a router
   * @param path {string} The router path
   */
  constructor(path: string) {
    this.__prefix = path;
    this.__router = new KRouter({
      prefix: path,
    });
  }

  /**
   * Generating routers and docs
   * @param docs {IDocs} documents
   */
  public paths(...docs: IDocs[]): Router {
    for (const path of docs) {
      for (const method of path.methods) {
        this.docs = this.docs || {};
        let prefix = this.__prefix + path.path;
        if (prefix.endsWith('/')) {
          prefix = prefix.substring(0, prefix.length - 1);
        }
        this.docs[prefix] = this.docs[prefix] || {};
        this.docs[prefix][method] = this.docs[prefix][method] || {};
        for (const k of Object.keys(path)) {
          if (!['path', 'methods', 'controller', 'auth'].includes(k)) {
            this.docs[prefix][method][k] = path[k];
          }
        }

        if (path.auth) {
          let midware;
          switch (path.auth.type) {
            case 'attach':
              midware = attach();
              break;
            case 'isAuthenticated':
              midware = isAuthenticated();
              break;
            case 'owns':
              midware = owns(this.model);
              break;
            case 'hasRoles':
              midware = hasRoles(...path.auth.roles);
              break;
            case 'ownsOrHasRoles':
              midware = ownsOrHasRoles(this.model, ...path.auth.roles);
              break;
            default:
              midware = attach();
          }
          this.__router[method](path.path, midware, path.controller);
          this.docs[prefix][method].security = [{ Bearer: [] }];
          this.docs[prefix][method].description =
            this.docs[prefix][method].description || '';
          let affix = '<br />\n<b>Authorization:</b> ' + path.auth.type;
          if (path.auth.roles)
            affix += '\n<b>Roles:</b> ' + path.auth.roles.join();
          this.docs[prefix][method].description += affix;
        } else {
          this.__router[method](path.path, path.controller);
        }
      }
    }
    return this;
  }
  /**
   * The koa routes
   */
  public routes() {
    return this.__router.routes();
  }
}

export const BasicAuthRouter = new Router('/auth/basic').paths(
  {
    path: '/signin',
    methods: ['post'],
    controller: async (ctx: IContext) => {
      try {
        const auth: any = await AuthModel.findOne({
          username: ctx.request.fields.username,
        }).exec();
        if (!auth)
          throw boom.forbidden(
            Zqs.instance.config.auth.messages.errors.username_not_registered
          );
        if (!(await auth.authenticate(ctx.request.fields.password)))
          throw boom.forbidden(
            Zqs.instance.config.auth.messages.errors.invalid_password
          );
        const token = signToken(auth, {
          expiresIn: Zqs.instance.config.auth.expiresIn || '1h',
        });
        response(ctx, 200, { token });
      } catch (e) {
        handleError(ctx, e);
      }
    },
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
  {
    path: '/signup',
    methods: ['post'],
    controller: async (ctx: IContext) => {
      try {
        const auth = await AuthModel.create({
          username: ctx.request.fields.username,
          password: ctx.request.fields.password,
        });
        const token = signToken(auth, { expiresIn: '1h' });
        response(ctx, 200, { token });
      } catch (e) {
        handleError(ctx, e);
      }
    },
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
  {
    path: '/reset',
    methods: ['post'],
    controller: async (ctx: IContext) => {
      try {
        const auth: any = await AuthModel.findOne({
          username: ctx.request.fields.username,
        }).exec();
        if (!auth)
          throw boom.forbidden(
            Zqs.instance.config.auth.messages.errors.username_not_registered
          );
        if (!(await auth.authenticate(ctx.request.fields.oldPassword)))
          throw boom.forbidden(
            Zqs.instance.config.auth.messages.errors.invalid_password
          );
        auth['password'] = String(ctx.request.fields.newPassword);
        await auth.save();
        response(ctx, 204);
      } catch (e) {
        handleError(ctx, e);
      }
    },
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
  }
);
