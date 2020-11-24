import * as boom from '@hapi/boom';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as compose from 'koa-compose';
import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import * as uniqueValidator from 'mongoose-unique-validator';
import { Zqs } from './app';
import { IContext } from './context';
import { handleError } from './errors';

export async function setup(app: Zqs) {
  AuthSchema = new mongoose.Schema(
    {
      password: {
        type: String,
        required() {
          if (!this.providers || !this.providers.length) return true;
          return false;
        },
        validate: {
          validator(v) {
            if (this.providers && this.providers.length) return true;
            return v.length;
          },
          message: app.config.auth.messages.errors.empty_password,
        },
      },
      providers: [
        {
          name: {
            required: true,
            type: String,
          },
          openid: String,
        },
      ],
      roles: {
        type: [String],
        default: app.config.auth.defaultRoles,
      },
      salt: {
        type: String,
      },
      username: {
        lowercase: true,
        required() {
          if (!this.providers || !this.providers.length) return true;
          return false;
        },
        type: String,
        unique: true,
        uniqueCaseInsensitive: true,
        validate: {
          validator(v) {
            if (this.providers && this.providers.length) return true;
            return v.length;
          },
          message: app.config.auth.messages.errors.empty_username,
        },
      },
    },
    { timestamps: {} }
  ).plugin(uniqueValidator, {
    message: app.config.auth.messages.errors.username_already_in_use,
  });
  AuthSchema.plugin(mongoosePaginate);

  AuthSchema.pre('validate', async function(next) {
    // Handle new/update passwords
    if (!this.isModified('password')) return next();

    // Password must not be empty if there is no any providers
    if (!this['password'] || !this['password'].length) {
      if (!this['providers'] || !this['providers'].length)
        return next(
          boom.badData(app.config.auth.messages.errors.invalid_password)
        );
      return next();
    }

    // Make salt
    try {
      this['salt'] = await makeSalt();
      const hashedPassword = await encryptPassword(
        this['password'],
        this['salt']
      );
      this['password'] = hashedPassword;
      next();
    } catch (e) {
      next(e);
    }

    /**
     * Make salt
     *
     * @param {Number} byteSize Optional salt byte size, default to 16
     * @return {String}
     * @api public
     */
    function makeSalt(byteSize: number = 16): Promise<any> {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(byteSize, (err, salt) => {
          if (err) {
            reject(err);
          } else {
            resolve(salt.toString('base64'));
          }
        });
      });
    }

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    function encryptPassword(password, salt): Promise<string> {
      return new Promise((resolve, reject) => {
        if (!password || !salt) reject(new Error('Missing password or salt'));
        const defaultIterations = 10000;
        const defaultKeyLength = 64;
        const salt_ = new Buffer(salt, 'base64');
        return crypto.pbkdf2(
          password,
          salt_,
          defaultIterations,
          defaultKeyLength,
          'sha256',
          (err, key) => {
            if (err) {
              reject(err);
            } else {
              resolve(key.toString('base64'));
            }
          }
        );
      });
    }
  });

  /**
   * Methods
   */
  AuthSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} password
     * @return {Boolean}
     * @api public
     */
    async authenticate(password): Promise<boolean> {
      const pwdGen = await this.encryptPassword(password);
      return this.password === pwdGen;
    },

    /**
     * Make salt
     *
     * @param {Number} byteSize Optional salt byte size, default to 16
     * @return {String}
     * @api public
     */
    makeSalt(byteSize: number = 16): Promise<any> {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(byteSize, (err, salt) => {
          if (err) {
            reject(err);
          } else {
            resolve(salt.toString('base64'));
          }
        });
      });
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword(password): Promise<string> {
      return new Promise((resolve, reject) => {
        if (!password || !this.salt)
          reject(new Error('Missing password or salt'));
        const defaultIterations = 10000;
        const defaultKeyLength = 64;
        const salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2(
          password,
          salt,
          defaultIterations,
          defaultKeyLength,
          'sha256',
          (err, key) => {
            if (err) {
              reject(err);
            } else {
              resolve(key.toString('base64'));
            }
          }
        );
      });
    },
  };

  AuthModel = mongoose.model('__auth', AuthSchema);
  signToken = (doc: mongoose.Document, options: jwt.SignOptions) => {
    return jwt.sign(
      {
        _id: doc._id,
        providers: doc['providers'],
        roles: doc['roles'],
        username: doc['username'],
      },
      app.config.auth.secret,
      options
    );
  };

  verifyToken = (token: string) => {
    if (!token) return null;
    return new Promise((resolve, reject) => {
      jwt.verify(token, app.config.auth.secret, (error, decoded) => {
        if (error) return resolve(null);
        resolve(decoded);
      });
    });
  };

  attach = () => {
    return async (ctx: IContext, next) => {
      try {
        if (ctx.request.auth) {
          const auth = await AuthModel.findById(ctx.request.auth._id).exec();
          if (!auth)
            throw boom.notAcceptable(
              app.config.auth.messages.errors.invalid_token
            );
        }
        await next();
      } catch (e) {
        handleError(ctx, e);
      }
    };
  };

  isAuthenticated = () => {
    return async (ctx: IContext, next) => {
      try {
        if (!ctx.request.auth)
          throw boom.unauthorized(app.config.auth.messages.errors.unauthorized);
        const auth = await AuthModel.findById(ctx.request.auth._id).exec();
        if (!auth)
          throw boom.notAcceptable(
            app.config.auth.messages.errors.invalid_token
          );
        await next();
      } catch (e) {
        handleError(ctx, e);
      }
    };
  };

  hasRoles = (...roles: string[]) => {
    return compose([
      isAuthenticated(),
      async (ctx: IContext, next) => {
        try {
          for (const role of roles) {
            if (!ctx.request.auth.roles.includes(role))
              throw boom.forbidden(
                app.config.auth.messages.errors.no_permission
              );
          }
          await next();
        } catch (e) {
          handleError(ctx, e);
        }
      },
    ]);
  };

  owns = model => {
    return compose([
      isAuthenticated(),
      async (ctx: IContext, next) => {
        try {
          const entity = await model.findById(ctx.params.id, '__auth').exec();
          if (!entity['__auth'].equals(ctx.request.auth._id))
            throw boom.forbidden('');
          ctx.request.auth.owns = true;
          await next();
        } catch (e) {
          handleError(ctx, e);
        }
      },
    ]);
  };

  ownsOrHasRoles = (model, ...roles) => {
    return compose([
      isAuthenticated(),
      async (ctx: IContext, next) => {
        try {
          const entity = await model.findById(ctx.params.id, '__auth').exec();
          if (entity['__auth'].equals(ctx.request.auth._id)) {
            ctx.request.auth.owns = true;
          } else {
            for (const role of roles) {
              if (!ctx.request.auth.roles.includes(role))
                throw boom.forbidden(
                  app.config.auth.messages.errors.no_permission
                );
            }
          }
          await next();
        } catch (e) {
          handleError(ctx, e);
        }
      },
    ]);
  };

  app.use(async (ctx: IContext, next) => {
    const token = getHeaderToken(ctx);
    ctx.request.auth = await verifyToken(token);
    await next();
  });
}

/**
 * A mongoose schema
 */
export let AuthSchema: mongoose.Schema;

/**
 * A mongoose model with name `__auth`
 */
export let AuthModel: mongoose.Model<mongoose.Document>;

/**
 * Signing JWT token
 */
export let signToken: (
  doc: mongoose.Document,
  options: jwt.SignOptions
) => string;

/**
 * Verifying JWT token
 */
export let verifyToken: (token: string) => Promise<any>;

/**
 * Getting token from headers
 *
 * ```
 * Authorization: Bearer xxx
 * ```
 *
 * @param ctx {IContext} Koa context
 */
export function getHeaderToken(ctx: IContext): string {
  if (
    !ctx.headers.authorization ||
    !ctx.headers.authorization.startsWith('Bearer ')
  )
    return null;
  return ctx.headers.authorization.substring(7);
}

/**
 * Middleware to attach auth info.
 */
export let attach: () => any;

/**
 * Middleware to check if it is authenticated.
 */
export let isAuthenticated: () => any;

/**
 * Middleware to check if the authenticated user has specified roles.
 * @param roles {string[]} specified roles
 */
export let hasRoles: (...roles: string[]) => any;

/**
 * Middleware to check if the authenticated user owns the document by checking the field __auth.
 */
export let owns: (model: mongoose.PaginateModel<mongoose.Document>) => any;

/**
 * Middleware to check if the authenticated user has specified roles,
 * or the authenticated user owns the document by checking the field __auth.
 */
export let ownsOrHasRoles: (
  model: mongoose.PaginateModel<mongoose.Document>,
  ...roles: string[]
) => any;

export interface IConfig {
  /**
   * Messages
   */
  messages: {
    /**
     * Error messages
     */
    errors: {
      empty_username: string;
      empty_password: string;
      username_already_in_use: string;
      username_not_registered: string;
      invalid_password: string;
      unauthorized: string;
      invalid_token: string;
      no_permission: string;
    };
  };

  /**
   * JWT secret
   */
  secret: string;

  /**
   * Use build-in auth router
   */
  enableBasicAuth: boolean;

  /**
   * Default roles to sign to new user.
   */
  defaultRoles: string[];
}
