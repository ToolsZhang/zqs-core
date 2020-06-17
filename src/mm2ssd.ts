import { Model, Schema, SchemaType, SchemaTypes } from 'mongoose';

interface ISchemaType extends SchemaType {
  casterConstructor: any;
  constructor: Function;
  enumValues: any[];
  path: string;
  instance: string;
  isRequired: true;
  schema: Schema;
  options: any;
}

interface ISchemaBaseType {
  type: string;
  format?: string;
  items?: ISchemaBaseType;
  properties?: {
    [index: string]: ISchemaBaseType;
  };
  description?: string;
  required?: boolean | string[];
  xml?: {
    name: string;
  };
  enum?: any[];
}

export function mm2ssd(model: Model<any>, xmlTag?: string) {
  return new MM2SSD(model, xmlTag).toObject();
}

class MM2SSD {
  private __obj: ISchemaBaseType;
  constructor(model: Model<any>, xmlTag?: string) {
    this.__obj = this.processEmbedded(model.schema, xmlTag || model.modelName);
  }

  public toObject = (): any => {
    return this.__obj;
  };

  private processEmbedded = (
    schema: Schema,
    xmlTag: string
  ): ISchemaBaseType => {
    const obj = {
      type: 'object',
      properties: {},
      xml: {
        name: xmlTag,
      },
      required: schema.requiredPaths(),
    };

    schema.eachPath((name: string, type: ISchemaType) => {
      switch (type.constructor) {
        case SchemaTypes.Array:
          obj.properties[name] = this.processArray(type);
          break;
        case SchemaTypes.Boolean:
          obj.properties[name] = this.processBoolean(type);
          break;
        case SchemaTypes.Buffer:
          obj.properties[name] = this.processBuffer(type);
          break;
        case SchemaTypes.Date:
          obj.properties[name] = this.processDate(type);
          break;
        case SchemaTypes.Decimal128:
          obj.properties[name] = this.processDecimal128(type);
          break;
        case SchemaTypes.DocumentArray:
          obj.properties[name] = this.processDocumentArray(type);
          break;
        case SchemaType:
          obj.properties[name] = this.processEmbedded(type.schema, name);
          break;
        case SchemaTypes.Mixed:
          obj.properties[name] = this.processMixed(type);
          break;
        case SchemaTypes.Number:
          obj.properties[name] = this.processNumber(type);
          break;
        case SchemaTypes.ObjectId:
          obj.properties[name] = this.processObjectId(type);
          break;
        case SchemaTypes.String:
          obj.properties[name] = this.processString(type);
          break;
      }
    });
    return obj;
  };

  private processArray = (type: ISchemaType): ISchemaBaseType => {
    const obj: ISchemaBaseType = {
      type: 'array',
      required: !!type.isRequired,
    };
    if (type.casterConstructor.casterConstructor) {
      obj.items = this.processArray(type.casterConstructor);
      return obj;
    }
    switch (type.casterConstructor) {
      case SchemaTypes.Boolean:
        obj.items = this.processBoolean(type);
        break;
      case SchemaTypes.Buffer:
        obj.items = this.processBuffer(type);
        break;
      case SchemaTypes.Date:
        obj.items = this.processDate(type);
        break;
      case SchemaTypes.Decimal128:
        obj.items = this.processDecimal128(type);
        break;
      case SchemaTypes.Mixed:
        obj.items = this.processMixed(type);
        break;
      case SchemaTypes.Number:
        obj.items = this.processNumber(type);
        break;
      case SchemaTypes.ObjectId:
        obj.items = this.processObjectId(type);
        break;
      case SchemaTypes.String:
        obj.items = this.processString(type);
        break;
    }
    return obj;
  };

  private processBoolean = (type: ISchemaType): ISchemaBaseType => {
    const obj: ISchemaBaseType = {
      type: 'boolean',
      required: !!type.isRequired,
    };
    return obj;
  };

  private processBuffer = (type: ISchemaType): ISchemaBaseType => {
    return this.processString(type);
  };

  private processDate = (type: ISchemaType): ISchemaBaseType => {
    const obj: ISchemaBaseType = {
      type: 'string',
      format: 'date-time',
      required: !!type.isRequired,
    };
    return obj;
  };

  private processDecimal128 = (type: ISchemaType): ISchemaBaseType => {
    const obj: ISchemaBaseType = {
      type: 'number',
      format: 'double',
      required: !!type.isRequired,
    };
    if (type.options && type.options.enum) {
      obj.enum = type.options.enum;
    }
    return obj;
  };

  private processDocumentArray = (type: ISchemaType): ISchemaBaseType => {
    const obj: ISchemaBaseType = {
      type: 'array',
      items: this.processEmbedded(type.schema, 'item'),
      required: !!type.isRequired,
    };
    return obj;
  };

  private processMixed = (type: ISchemaType): ISchemaBaseType => {
    const obj: ISchemaBaseType = {
      type: 'object',
      properties: {},
      required: !!type.isRequired,
    };
    return obj;
  };

  private processNumber = (type: ISchemaType): ISchemaBaseType => {
    const obj: ISchemaBaseType = {
      type: 'integer',
      format: 'int64',
      required: !!type.isRequired,
    };
    if (type.options && type.options.enum) {
      obj.enum = type.options.enum;
    }
    return obj;
  };

  private processObjectId = (type: ISchemaType): ISchemaBaseType => {
    const obj: ISchemaBaseType = {
      type: 'string',
      required: !!type.isRequired,
    };
    return obj;
  };

  private processString = (type: ISchemaType): ISchemaBaseType => {
    const obj: ISchemaBaseType = {
      type: 'string',
      required: !!type.isRequired,
    };
    if (type.enumValues && type.enumValues.length) {
      obj.enum = type.enumValues;
    }
    return obj;
  };
}
