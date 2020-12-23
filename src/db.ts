import * as _ from 'lodash';
import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import { IContext } from './context';
import { DocSchema, IDocs } from './docs';
import { Boom } from './errors';
import { Router } from './routers';

/**
 * Model options
 */
export interface IModelOptions {
  /**
   * Wheather the document need be authenticated.
   */
  auth?: boolean;

  /**
   * Same as mongoose model collection
   */
  collection?: string;

  /**
   * Same as mongoose model name
   */
  name: string;

  /**
   * discriminator
   */
  discriminator?: any;

  /**
   * Same as mongoose schema
   */
  schema: mongoose.Schema;

  /**
   * Same as mongoose model skipInit
   */
  skipInit?: boolean;
}

/**
 * Zqs model
 */
export interface IModel extends mongoose.PaginateModel<mongoose.Document> {
  docSchema: DocSchema;
  routes: (prefix: string, ...paths: IDocs[]) => Router;
}

/**
 * Creating a Zqs model
 * @param options  {IModelOptions} model options
 */
export function Model(options: IModelOptions): IModel {
  options.schema.add({
    __auth: {
      ref: '__auths',
      required: !!options.auth,
      type: mongoose.SchemaTypes.ObjectId,
    },
  });
  options.schema.plugin(mongoosePaginate);

  let model;
  if (options.discriminator) {
    model = options.discriminator.discriminator(options.name, options.schema);
  } else {
    model = mongoose.model(
      options.name,
      options.schema,
      options.collection,
      options.skipInit
    );
  }
  model['docSchema'] = new DocSchema(model);
  model['routes'] = (prefix, ...paths) => {
    const router = new Router(prefix);
    router.model = model as IModel;
    router.paths(...paths);
    return router;
  };
  return model as IModel;
}

/**
 * Ref to mongoose.Schema
 */
export const Schema = mongoose.Schema;

/**
 * Ref to mongoose
 */
export const Mongoose = mongoose;

/**
 * Paginating docs
 * @param model {mongoose.PaginateModel<mongoose.Document>} Zqs model or mongoose PaginateModel
 * @param ctx  {IContext} Zqs context
 * @param filters {object} Custom filters
 * @param options {mongoose.PaginateOptions} Custom options. See {@link https://github.com/edwardhotchkiss/mongoose-paginate}
 */
export async function paginate(
  model: mongoose.PaginateModel<mongoose.Document>,
  ctx: IContext,
  filters?: { [x: string]: any },
  options?: mongoose.PaginateOptions
): Promise<mongoose.PaginateResult<mongoose.Document>> {
  let _filters = {};
  let _options: mongoose.PaginateOptions = {};

  if (filters) {
    _filters = _.merge(_filters, filters);
  }

  if (options) {
    _options = _.merge(_options, options);
  }
  if (ctx.request.query._filters) {
    try {
      const reqFilters = JSON.parse(ctx.request.query._filters);
      _filters = _.merge(_filters, reqFilters);
    } catch (e) {
      throw Boom.boomify(e, { statusCode: 422 });
    }
  }
  if (ctx.request.query._options) {
    try {
      const reqFilters = JSON.parse(ctx.request.query._options);
      _options = _.merge(_options, reqFilters);
    } catch (e) {
      throw Boom.boomify(e, { statusCode: 422 });
    }
  }
  return model.paginate(_filters, _options);
}

/**
 * Showing a doc with an id form ctx.params.id
 * @param model {mongoose.PaginateModel<mongoose.Document>} Zqs model or mongoose PaginateModel
 * @param ctx {IContext} Zqs context
 * @param options {mongoose.PaginateOptions} Custom options. Only select and populate making effects.
 */
export async function show(
  model: mongoose.PaginateModel<mongoose.Document>,
  ctx: IContext,
  options?: mongoose.PaginateOptions
): Promise<mongoose.Document> {
  let _options: mongoose.PaginateOptions = {};

  if (options) {
    _options = _.merge(_options, options);
  }

  if (ctx.request.query._options) {
    try {
      const reqOptions = JSON.parse(ctx.request.query._options);
      _options = _.merge(_options, reqOptions);
    } catch (e) {
      throw Boom.boomify(e, { statusCode: 422 });
    }
  }

  let query = model.findById(ctx.params.id);
  if (_options.select) query = query.select(_options.select);
  if (_options.populate) query = query.populate(_options.populate);

  return query.exec();
}

/**
 * Modifying an entity
 * @param entity {mongoose.Document} The old entity
 * @param updates {any} Fields to change
 */
export function patchUpdates(
  entity: mongoose.Document,
  updates: any
): mongoose.Document {
  for (const key of Object.keys(updates)) {
    entity[key] = updates[key];
  }
  return entity;
}
