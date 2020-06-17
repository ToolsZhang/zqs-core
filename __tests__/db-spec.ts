import { Mongoose, Model, Schema, patchUpdates } from '../src/db';
import { setup as setupMongodb } from '../src/mongodb';
import { DocSchema, IDocs } from '../src/docs';

console.log = jest.fn();
console.error = jest.fn();

describe('test crud', () => {
  beforeAll(() => {});

  afterAll(() => {});
  // 1. test function model
  it('should create a model', async () => {
    const model = Model({
      auth: true,
      name: 'test',
      schema: new Schema({
        name: String,
        info: String,
      }),
    });
    expect(model.schema.path('name')).toBeTruthy();
    expect(model.schema.path('info')).toBeTruthy();
    // 1.3 test model['routes']
    const paths: IDocs[] = [
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
    expect(model.routes('prefix', ...paths).docs).toMatchObject({
      prefix: {
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
  });

  it('should update an entity', async () => {
    const entity: any = {};
    patchUpdates(entity, {
      a: 1,
    });
    expect(entity).toMatchObject({
      a: 1,
    });
  });
});
