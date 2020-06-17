import { DocSchema, IDocsParameter } from '../src/docs';
import { Model, Schema } from '../src/db';

// console.log = jest.fn();
console.error = jest.fn();
const data = {
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
const showOptionsData = {
  description: `
    {
      "select": String,
      "populate": String
    }
    `,
  in: 'query',
  name: '_options',
};
describe('test class DocSchema', () => {
  const model = Model({
    auth: true,
    name: 'test',
    schema: new Schema({
      name: String,
      info: String,
    }),
  });
  const docSchema = new DocSchema(model);

  // 1. test get schema()
  it('should match schema', () => {
    expect(docSchema.schema).toMatchObject({
      properties: {
        __auth: {
          required: true,
          type: 'string',
        },
        __v: {
          format: 'int64',
          required: false,
          type: 'integer',
        },
        _id: {
          required: false,
          type: 'string',
        },
        info: {
          required: false,
          type: 'string',
        },
        name: {
          required: false,
          type: 'string',
        },
      },
      required: ['__auth'],
      type: 'object',
      xml: {
        name: 'xml',
      },
    });
  });

  // 2. test get filters()
  it('should match filters', () => {
    const filters = docSchema.filters;
    // 2.1  __filters is false
    expect(filters).toMatchObject({
      in: 'query',
      name: '_filters',
    });
    expect(filters.description).toMatch(/name: \{\}/);
    expect(filters.description).toMatch(/info: \{\}/);

    // 2.2  __filters is true
    const model2 = Model({
      auth: true,
      name: 'test2',
      schema: new Schema({
        name: String,
        info: String,
      }),
    });
    const docSchema2: any = new DocSchema(model2);
    docSchema2.__filters = {
      in: 'query',
      name: '__filters',
      description: 'ok',
    };
    expect(docSchema2.filters.description).toMatch('ok');
  });

  // 3. test  get result()
  it('should match result', () => {
    expect(docSchema.result).toMatchObject({
      properties: {
        __auth: {
          required: true,
          type: 'string',
        },
        __v: {
          format: 'int64',
          required: false,
          type: 'integer',
        },
        _id: {
          required: false,
          type: 'string',
        },
        info: {
          required: false,
          type: 'string',
        },
        name: {
          required: false,
          type: 'string',
        },
      },
      required: ['__auth'],
      type: 'object',
      xml: {
        name: 'xml',
      },
    });
  });

  // 4. test get paginateResult()

  it('should match paginateResult', () => {
    const paginateResult = docSchema.paginateResult;
    // 4.1  paginateResult is false
    expect(paginateResult).toEqual({
      properties: {
        docs: {
          type: 'array',
          items: {
            properties: {
              __auth: {
                required: true,
                type: 'string',
              },
              __v: {
                format: 'int64',
                required: false,
                type: 'integer',
              },
              _id: {
                required: false,
                type: 'string',
              },
              info: {
                required: false,
                type: 'string',
              },
              name: {
                required: false,
                type: 'string',
              },
            },
            required: ['__auth'],
            type: 'object',
            xml: {
              name: 'item',
            },
          },
        },
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
    });

    const model4 = Model({
      auth: true,
      name: 'test4',
      schema: new Schema({
        name: String,
        info: String,
      }),
    });

    // 4.2 paginateResult is not false
    const docSchema4: any = new DocSchema(model4);
    docSchema4.__paginateResult = {
      type: 'IDocsDataType',
    };
    expect(docSchema4.paginateResult).toEqual({
      type: 'IDocsDataType',
    });
  });

  // 5. test resultWithOptions(options: IResultOptions)
  it('should match resultWithOptions', () => {
    // 5.1 test with 空对象
    const iResultOptions = {};
    const resultWithOptions = docSchema.resultWithOptions(iResultOptions);
    expect(resultWithOptions).toEqual({
      properties: {
        __auth: {
          required: true,
          type: 'string',
        },
        __v: {
          format: 'int64',
          required: false,
          type: 'integer',
        },
        _id: {
          required: false,
          type: 'string',
        },
        info: {
          required: false,
          type: 'string',
        },
        name: {
          required: false,
          type: 'string',
        },
      },
      required: ['__auth'],
      type: 'object',
      xml: {
        name: 'xml',
      },
    });
    // 5.2 test with select data
    const iResultOptions2 = {
      select: 'name  age',
      exclude: 'info',
    };
    const resultWithOptions2 = docSchema.resultWithOptions(iResultOptions2);
    expect(resultWithOptions2).toEqual({
      properties: {
        name: {
          required: false,
          type: 'string',
        },
        age: undefined,
      },
      required: ['__auth'],
      type: 'object',
      xml: {
        name: 'xml',
      },
    });

    // 5.3 test key: exclude
    const iResultOptions3 = {
      exclude: 'name   age',
      extras: {},
    };
    const resultWithOptions3 = docSchema.resultWithOptions(iResultOptions3);
    expect(resultWithOptions3).toEqual({
      properties: {
        __auth: {
          required: true,
          type: 'string',
        },
        __v: {
          format: 'int64',
          required: false,
          type: 'integer',
        },
        _id: {
          required: false,
          type: 'string',
        },
        info: {
          required: false,
          type: 'string',
        },
      },
      required: ['__auth'],
      type: 'object',
      xml: {
        name: 'xml',
      },
    });
  });

  // 6. test paginateResultWithOptions(options: IResultOptions)
  it('should match paginateResultWithOptions', () => {
    // 6.1 test with 空对象
    const resultWithOptions1 = {};
    const options = docSchema.paginateResultWithOptions(resultWithOptions1);
    expect(options).toEqual({
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
        docs: {
          type: 'array',
          items: {
            properties: {
              __auth: {
                required: true,
                type: 'string',
              },
              __v: {
                format: 'int64',
                required: false,
                type: 'integer',
              },
              _id: {
                required: false,
                type: 'string',
              },
              info: {
                required: false,
                type: 'string',
              },
              name: {
                required: false,
                type: 'string',
              },
            },
            required: ['__auth'],
            type: 'object',
            xml: {
              name: 'item',
            },
          },
        },
      },
      type: 'object',
      xml: {
        name: 'xml',
      },
    });
    // 6.2 test with select
    const resultWithOptions2 = {
      select: 'name info',
    };
    const options2 = docSchema.paginateResultWithOptions(resultWithOptions2);
    expect(options2).toEqual({
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
        docs: {
          type: 'array',
          items: {
            properties: {
              info: {
                required: false,
                type: 'string',
              },
              name: {
                required: false,
                type: 'string',
              },
            },
            required: ['__auth'],
            type: 'object',
            xml: {
              name: 'item',
            },
          },
        },
      },
      type: 'object',
      xml: {
        name: 'xml',
      },
    });
  });

  // 7. test get paginateOptions()
  it('test get paginateOptions()', () => {
    expect(docSchema.paginateOptions).toMatchObject(data);
  });
  // 8. test get showOptions()
  it('test get showOptions()', () => {
    expect(docSchema.showOptions).toMatchObject(showOptionsData);
  });

  // 9. test get paramId()
  it('test get paramId()', () => {
    expect(docSchema.paramId).toMatchObject({
      description: 'Unique id',
      in: 'path',
      name: 'id',
      required: true,
      type: 'string',
    });
  });

  // 10. test get body()
  it('test get body()', () => {
    // 10.1 body is false
    expect(docSchema.body).toMatchObject({
      in: 'body',
      name: 'body',
      schema: {
        properties: {
          __auth: {
            required: true,
            type: 'string',
          },
          __v: {
            format: 'int64',
            required: false,
            type: 'integer',
          },
          _id: {
            required: false,
            type: 'string',
          },
          info: {
            required: false,
            type: 'string',
          },
          name: {
            required: false,
            type: 'string',
          },
        },
        required: ['__auth'],
        type: 'object',
        xml: {
          name: 'xml',
        },
      },
    });
    expect(docSchema.bodyWithOptions({})).toMatchObject({
      in: 'body',
      name: 'body',
      schema: {
        properties: {
          __auth: {
            required: true,
            type: 'string',
          },
          __v: {
            format: 'int64',
            required: false,
            type: 'integer',
          },
          _id: {
            required: false,
            type: 'string',
          },
          info: {
            required: false,
            type: 'string',
          },
          name: {
            required: false,
            type: 'string',
          },
        },
        required: ['__auth'],
        type: 'object',
        xml: {
          name: 'xml',
        },
      },
    });
    expect(docSchema.bodyWithOptions({ select: 'name info' })).toMatchObject({
      in: 'body',
      name: 'body',
      schema: {
        properties: {
          info: {
            required: false,
            type: 'string',
          },
          name: {
            required: false,
            type: 'string',
          },
        },
        required: ['__auth'],
        type: 'object',
        xml: {
          name: 'xml',
        },
      },
    });
    expect(docSchema.bodyWithOptions({ select: 'name  info' })).toMatchObject({
      in: 'body',
      name: 'body',
      schema: {
        properties: {
          info: {
            required: false,
            type: 'string',
          },
          name: {
            required: false,
            type: 'string',
          },
        },
        required: ['__auth'],
        type: 'object',
        xml: {
          name: 'xml',
        },
      },
    });
    expect(
      docSchema.bodyWithOptions({ exclude: '__auth __v  _id', extras: {} })
    ).toMatchObject({
      in: 'body',
      name: 'body',
      schema: {
        properties: {
          info: {
            required: false,
            type: 'string',
          },
          name: {
            required: false,
            type: 'string',
          },
        },
        required: ['__auth'],
        type: 'object',
        xml: {
          name: 'xml',
        },
      },
    });
    // 10.2 body is true
    const model10 = Model({
      auth: true,
      name: 'test10',
      schema: new Schema({
        name: String,
        info: String,
      }),
    });
    const docSchema10: any = new DocSchema(model10);
    docSchema10.__body = {
      in: 'body',
      name: '__body',
    };
    expect(docSchema10.body).toMatchObject({
      in: 'body',
      name: '__body',
    });
  });

  // 11. test get response4xx()
  it('test get response4xx()', () => {
    expect(docSchema.response4xx).toMatchObject({
      description: 'Client side errors',
    });
  });

  // 12. test get response5xx()
  it('test get response5xx()', () => {
    expect(docSchema.response5xx).toMatchObject({
      description: 'Server side errors',
    });
  });
});
