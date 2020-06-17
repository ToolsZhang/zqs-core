import { Model, Schema, paginate } from '../src/db';

console.log = jest.fn();
console.error = jest.fn();

describe('test paginate', () => {
  let model: any;

  beforeAll(() => {
    model = Model({
      auth: true,
      name: 'testPaginate',
      schema: new Schema({
        name: String,
        info: String,
      }),
    });
    model.paginate = async (f, o): Promise<any> => {
      return {
        filters: f,
        options: o,
      };
    };
  });

  it('should paginate a model', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
    };
    const docs1 = await paginate(model, ctx);
    expect(docs1).toMatchObject({
      filters: {},
      options: {},
    });
  });

  it('should paginate a model with query', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
    };
    ctx.request.query._filters = JSON.stringify({ a: 1 });
    ctx.request.query._options = JSON.stringify({ a: 1 });
    const docs2 = await paginate(model, ctx);
    expect(docs2).toMatchObject({
      filters: { a: 1 },
      options: { a: 1 },
    });
  });

  it('should paginate a model with default query', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
    };
    ctx.request.query._filters = JSON.stringify({ a: 1 });
    ctx.request.query._options = JSON.stringify({ a: 1 });
    const docs3 = await paginate(
      model,
      ctx,
      {
        b: 2,
      },
      {
        populate: 'ok',
      }
    );
    expect(docs3).toMatchObject({
      filters: { a: 1, b: 2 },
      options: { a: 1, populate: 'ok' },
    });
  });

  it('should paginate a model overwrite default query', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
    };
    ctx.request.query._filters = JSON.stringify({ a: 1 });
    ctx.request.query._options = JSON.stringify({ a: 1 });
    const docs4 = await paginate(
      model,
      ctx,
      {
        a: 2,
      },
      {
        a: 2,
      } as any
    );
    expect(docs4).toMatchObject({
      filters: { a: 1 },
      options: { a: 1 },
    });
  });

  it('should throw an error by filters', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
    };
    ctx.request.query._filters = 'xxx';
    await expect(paginate(model, ctx)).rejects.toEqual(expect.any(SyntaxError));
  });

  it('should throw an error by options', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
    };
    ctx.request.query._options = 'xxx';
    await expect(paginate(model, ctx)).rejects.toEqual(expect.any(SyntaxError));
  });
});
