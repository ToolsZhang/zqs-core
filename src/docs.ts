import { mm2ssd } from './mm2ssd';
import * as lodash from 'lodash';
import * as mongoose from 'mongoose';

/**
 * Result options
 */
export interface IResultOptions {
  /**
   * Fileds to select
   * @example '_id name'
   */
  select?: string;

  /**
   * Fileds to exclude
   * @example
   *  'createdAt updatedAt'
   */
  exclude?: string;

  /**
   * Extra fields to append
   */
  extras?: {
    [index: string]: IDocsDataTypeItem;
  };
}

/**
 * DocSchema class
 */
export class DocSchema {
  private __schema: IDocsDataTypeItem;
  private __filters: IDocsParameter;
  private __result: IDocsDataTypeItem;
  private __paginateResult: IDocsDataTypeItem;
  private __body: IDocsParameter;

  constructor(private model: mongoose.PaginateModel<mongoose.Document>) {}

  /**
   * The swagger ui schema
   */
  get schema(): IDocsDataTypeItem {
    if (!this.__schema) this.__schema = model2Schema(this.model);
    return this.__schema;
  }

  /**
   * Filters in query
   */
  get filters(): IDocsParameter {
    if (!this.__filters) {
      let str = '\n    {\n';
      str += Object.keys(this.schema.properties)
        .map(k => `      ${k}: {}`)
        .join(',\n');
      str += '\n    }\n';
      this.__filters = {
        description: str,
        in: 'query',
        name: '_filters',
      };
    }

    return this.__filters;
  }

  /**
   * The default result
   */
  get result(): IDocsDataTypeItem {
    if (!this.__result)
      this.__result = lodash.merge(
        {
          properties: {
            _id: { type: 'string' },
            __v: { type: 'string' },
          },
        },
        this.schema
      );
    return this.__result;
  }

  /**
   * The default paginated result
   */
  get paginateResult(): IDocsDataTypeItem {
    if (!this.__paginateResult)
      this.__paginateResult = lodash.merge({}, PAGINATE_RESULT, {
        properties: {
          docs: {
            type: 'array',
            items: lodash.merge({}, this.result, { xml: { name: 'item' } }),
          },
        },
      });
    return this.__paginateResult;
  }

  /**
   * Result with options
   */
  public resultWithOptions = (options: IResultOptions): IDocsDataTypeItem => {
    const result = lodash.merge({}, this.result);
    const properties = result.properties;
    if (typeof options.select === 'string') {
      result.properties = {};
      for (const k of options.select.split(' ')) {
        if (k) result.properties[k] = properties[k];
      }
    } else if (typeof options.exclude === 'string') {
      for (const k of options.exclude.split(' ')) {
        if (k) delete result.properties[k];
      }
    }
    if (options.extras) lodash.merge(result.properties, options.extras);
    return result;
  };
  /**
   * Paginated result with options
   */
  public paginateResultWithOptions = (
    options: IResultOptions
  ): IDocsDataTypeItem => {
    return lodash.merge({}, PAGINATE_RESULT, {
      properties: {
        docs: {
          type: 'array',
          items: lodash.merge({}, this.resultWithOptions(options), {
            xml: { name: 'item' },
          }),
        },
      },
    });
  };

  /**
   * Paginate options in query
   */
  get paginateOptions(): IDocsParameter {
    return PAGINATE_OPTIONS;
  }

  /**
   * Show options in query
   */
  get showOptions(): IDocsParameter {
    return SHOW_OPTIONS;
  }

  /**
   * Id in path
   */
  get paramId(): IDocsParameter {
    return PARAM_ID;
  }

  /**
   * Body in body
   */
  get body(): IDocsParameter {
    if (!this.__body)
      this.__body = {
        in: 'body',
        name: 'body',
        schema: this.schema,
      };
    return this.__body;
  }

  /**
   * Body whit options
   */
  public bodyWithOptions = (options: IResultOptions): IDocsParameter => {
    const schema = lodash.merge({}, this.body.schema);
    const body = lodash.merge({}, this.body);
    const properties = schema.properties;
    if (typeof options.select === 'string') {
      schema.properties = {};
      for (const k of options.select.split(' ')) {
        if (k) schema.properties[k] = properties[k];
      }
    } else if (typeof options.exclude === 'string') {
      for (const k of options.exclude.split(' ')) {
        if (k) delete schema.properties[k];
      }
    }
    if (options.extras) lodash.merge(schema.properties, options.extras);
    body.schema = schema;
    return body;
  };

  /**
   * 4xx results
   */
  get response4xx() {
    return RESPONSE_4XX;
  }

  /**
   * 5xx results
   */
  get response5xx() {
    return RESPONSE_5XX;
  }
}
/**
 * Content-Types
 */
export type IDocsAccept =
  | 'application/xml'
  | 'application/json'
  | 'text/plain'
  | 'multipart/form-data';

/**
 * Swagger ui data types
 * {@link https://swagger.io/specification/#dataTypes}
 */
export type IDocsDataType =
  | 'integer'
  | 'number'
  | 'string'
  | 'boolean'
  | 'file'
  | 'array'
  | 'object';

/**
 * Swagger ui data formats
 * {@link https://swagger.io/specification/#dataTypes}
 */
export type IDocsDataFormat =
  | 'int32'
  | 'int64'
  | 'float'
  | 'double'
  | 'binary'
  | 'date'
  | 'date-time'
  | 'password';
/**
 * Swagger ui schema item
 */
export interface IDocsDataTypeItem {
  type: IDocsDataType;
  format?: IDocsDataFormat;

  /**
   * Required when type is array
   */
  items?: IDocsDataTypeItem;

  /**
   * Required when type is object
   */
  properties?: IDocsDataTypeProperties;
  description?: string;
  required?: boolean;
  xml?: {
    name: string;
  };
}

/**
 * swagger ui object properties
 */
export interface IDocsDataTypeProperties {
  [index: string]: IDocsDataTypeItem;
}

/**
 * Swagger ui schema item
 */
export interface IDocsParameter {
  in: 'body' | 'query' | 'formData' | 'path';
  name: string;
  type?: IDocsDataType;
  items?: {
    type: IDocsDataType;
  };
  properties?: {
    [index: string]: {
      type: IDocsDataType;
    };
  };
  summary?: string;
  description?: string;
  required?: boolean;
  schema?: IDocsDataTypeItem;
}
/**
 * Zqs docs
 */
export interface IDocs {
  /**
   * Path to append to router
   */
  path: string;

  /**
   * HTTP methods
   */
  methods: Array<'post' | 'get' | 'put' | 'patch' | 'delete'>;

  /**
   * Controller function
   */
  controller: (ctx: any) => Promise<any>;

  /**
   * Authentication
   */
  auth?: {
    /**
     * Auth type
     */
    type?:
      | 'attach'
      | 'isAuthenticated'
      | 'owns'
      | 'hasRoles'
      | 'ownsOrHasRoles';

    /**
     * Required when type is hasRoles or ownsOrHasRoles
     */
    roles?: string[];
  };

  /**
   * Swagger ui tags
   */
  tags: string[];

  /**
   * Swagger ui summary
   */
  summary?: string;

  /**
   * Swagger ui description
   */
  description?: string;

  /**
   * Swagger ui consumes
   */
  consumes?: IDocsAccept[];

  /**
   * Swagger ui consumes
   */
  produces?: IDocsAccept[];

  /**
   * Swagger ui parameters
   */
  parameters?: IDocsParameter[];

  /**
   * Swagger ui responses
   */
  responses: {
    [index: string]: {
      description: string;
      schema?: any;
    };
  };
}
/**
 * Convert mongoose paginate model to Swagger ui schema
 * @param model {IModel} Zqs model
 */
export function model2Schema(
  model: mongoose.PaginateModel<mongoose.Document>
): IDocsDataTypeItem {
  return mm2ssd(model, 'xml');
}

const PAGINATE_OPTIONS: IDocsParameter = {
  description: `More info at [https://www.npmjs.com/package/mongoose-paginate](https://www.npmjs.com/package/mongoose-paginate)
        <br />
        {
            "lean": Boolean,
            "leanWithId": Boolean,
            "limit": Number,
            "offset": Number,
            "page": Number,
            "populate": String,
            "select": String,
            "sort": String
        }
        `,
  in: 'query',
  name: '_options',
};

const PAGINATE_RESULT: IDocsDataTypeItem = {
  properties: {
    limit: {
      type: 'number',
    },
    next: {
      type: 'number',
    },
    offset: {
      type: 'number',
    },
    page: {
      type: 'number',
    },
    pages: {
      type: 'number',
    },
    prev: {
      type: 'number',
    },
    total: {
      type: 'number',
    },
  },
  type: 'object',
  xml: {
    name: 'xml',
  },
};

const SHOW_OPTIONS: IDocsParameter = {
  description: `
    {
      "select": String,
      "populate": String
    }
    `,
  in: 'query',
  name: '_options',
};

const PARAM_ID: IDocsParameter = {
  description: 'Unique id',
  in: 'path',
  name: 'id',
  required: true,
  type: 'string',
};

const RESPONSE_4XX = {
  description: 'Client side errors',
};

const RESPONSE_5XX = {
  description: 'Server side errors',
};

export interface IConfig {
  /**
   * Swagger ui path
   */
  path: string;

  /**
   * Swagger ui options
   */
  options: {
    /**
     * Swagger ui version
     * @example
     * '2.0'
     */
    swagger: string;

    /**
     * Swagger ui info
     */
    info: {
      title: string;
      description: string;

      /**
       * Document version
       */
      version: string;
      contact: {
        email: string;
      };

      /**
       * license
       */
      license?: {
        /**
         * @example
         * Apache 2.0
         */
        name: string;

        /**
         * @example
         * http://www.apache.org/licenses/LICENSE-2.0.html
         */
        url: string;
      };
    };

    /**
     * Server host name
     * @example
     * example.com:8080
     */
    host: string;

    /**
     * Schemes
     * @example
     * ['http', 'https']
     */
    schemes: string[];

    /**
     * Swagger ui base path
     * @example
     * '/'
     */
    basePath: string;

    /**
     * Swagger ui produces
     */
    produces: IDocsAccept[];
  };
}
