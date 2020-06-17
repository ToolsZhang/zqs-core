import { Model, Schema, show } from '../src/db';

console.log = jest.fn();
console.error = jest.fn();

describe('test show', () => {
  let model: any;

  beforeAll(() => {
    model = Model({
      auth: true,
      name: 'testShow',
      schema: new Schema({
        name: String,
        info: String,
      }),
    });
    model.findById = (id): any => {
      const data: any = {
        id: id,
      };
      const res: any = {};
      res.select = x => {
        data.select = x;
        return res;
      };
      res.populate = x => {
        data.populate = x;
        return res;
      };
      res.exec = () => Promise.resolve(data);
      return res;
    };
  });

  it('should show a model', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
      params: {
        id: 'test001',
      },
    };
    const doc1 = await show(model, ctx);
    expect(doc1).toMatchObject({
      id: ctx.params.id,
    });
  });

  it('should show a model with options', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
      params: {
        id: 'test001',
      },
    };
    ctx.request.query._options = JSON.stringify({
      select: 'a',
      populate: 'b',
    });
    const docs2 = await show(model, ctx);
    expect(docs2).toMatchObject({
      id: ctx.params.id,
      select: 'a',
      populate: 'b',
    });
  });

  it('should show a model with default options', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
      params: {
        id: 'test001',
      },
    };
    const docs3 = await show(model, ctx, {
      select: 'c',
      populate: 'd',
    });
    expect(docs3).toMatchObject({
      id: ctx.params.id,
      select: 'c',
      populate: 'd',
    });
  });

  it('should show a model override default options', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
      params: {
        id: 'test001',
      },
    };
    ctx.request.query._options = JSON.stringify({
      select: 'a',
      populate: 'b',
    });
    const docs4 = await show(model, ctx, {
      select: 'c',
      populate: 'd',
    });
    expect(docs4).toMatchObject({
      id: ctx.params.id,
      select: 'a',
      populate: 'b',
    });
  });

  it('should throw an error by options', async () => {
    const ctx: any = {
      request: {
        query: {},
      },
      params: {
        id: 'test001',
      },
    };
    ctx.request.query._options = 'xxx';
    await expect(show(model, ctx)).rejects.toEqual(expect.any(SyntaxError));
  });
});
