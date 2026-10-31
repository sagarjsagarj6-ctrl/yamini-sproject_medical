import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';

const memoryCollections = new Map();

export const newId = (prefix = 'rec') => `${prefix}-${randomUUID()}`;
export const isMongoReady = () => mongoose.connection.readyState === 1;

const collection = (Model) => {
  const name = Model.modelName;
  if (!memoryCollections.has(name)) memoryCollections.set(name, []);
  return memoryCollections.get(name);
};

const clone = (value) => typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));

const matchesValue = (actual, expected) => {
  if (expected instanceof Date) return new Date(actual).getTime() === expected.getTime();
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    return Object.entries(expected).every(([operator, operand]) => {
      const value = actual instanceof Date ? actual.getTime() : actual;
      const compare = operand instanceof Date ? operand.getTime() : operand;
      if (operator === '$in') return operand.some((item) => String(actual) === String(item));
      if (operator === '$ne') return String(actual) !== String(operand);
      if (operator === '$gte') return new Date(value).getTime() >= new Date(compare).getTime();
      if (operator === '$gt') return new Date(value).getTime() > new Date(compare).getTime();
      if (operator === '$lte') return new Date(value).getTime() <= new Date(compare).getTime();
      if (operator === '$lt') return new Date(value).getTime() < new Date(compare).getTime();
      return false;
    });
  }
  return String(actual ?? '') === String(expected ?? '');
};

const matches = (record, filter = {}) => Object.entries(filter).every(([key, expected]) => {
  if (key === '$or') return expected.some((branch) => matches(record, branch));
  if (key === '$and') return expected.every((branch) => matches(record, branch));
  return matchesValue(record[key], expected);
});

const plain = (record) => {
  if (!record) return null;
  return typeof record.toObject === 'function' ? record.toObject() : clone(record);
};

export const findRecords = async (Model, filter = {}, options = {}) => {
  if (isMongoReady()) {
    let query = Model.find(filter);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    return (await query.lean().exec()).map(plain);
  }

  let rows = collection(Model).filter((row) => matches(row, filter));
  if (options.sort) {
    const [[field, direction]] = Object.entries(options.sort);
    rows = rows.slice().sort((left, right) => {
      const a = left[field];
      const b = right[field];
      if (a == null || b == null) return a == null ? (b == null ? 0 : 1) : -1;
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction;
      const aDate = a instanceof Date ? a.getTime() : Date.parse(a);
      const bDate = b instanceof Date ? b.getTime() : Date.parse(b);
      if (Number.isFinite(aDate) && Number.isFinite(bDate)) return (aDate - bDate) * direction;
      return String(a).localeCompare(String(b)) * direction;
    });
  }
  if (options.limit) rows = rows.slice(0, options.limit);
  return rows.map(plain);
};

export const findRecord = async (Model, filter = {}) => {
  if (isMongoReady()) return plain(await Model.findOne(filter).lean().exec());
  return plain(collection(Model).find((row) => matches(row, filter)) || null);
};

export const createRecord = async (Model, value) => {
  const now = new Date();
  const record = { ...value, id: value.id || newId(Model.modelName.toLowerCase()), createdAt: value.createdAt || now, updatedAt: value.updatedAt || now };
  if (isMongoReady()) return plain(await Model.create(record));
  collection(Model).push(clone(record));
  return plain(record);
};

export const updateRecord = async (Model, filter, changes, { upsert = false } = {}) => {
  if (isMongoReady()) {
    return plain(await Model.findOneAndUpdate(filter, { $set: changes }, { new: true, runValidators: true, upsert }).lean().exec());
  }
  const rows = collection(Model);
  const index = rows.findIndex((row) => matches(row, filter));
  if (index < 0) {
    if (!upsert) return null;
    return createRecord(Model, { ...filter, ...changes });
  }
  rows[index] = { ...rows[index], ...clone(changes), updatedAt: new Date() };
  return plain(rows[index]);
};

export const updateRecords = async (Model, filter, changes) => {
  if (isMongoReady()) {
    const result = await Model.updateMany(filter, { $set: changes }, { runValidators: true }).exec();
    return result.modifiedCount;
  }
  let modified = 0;
  for (const row of collection(Model)) {
    if (matches(row, filter)) {
      Object.assign(row, clone(changes), { updatedAt: new Date() });
      modified += 1;
    }
  }
  return modified;
};

export const deleteRecords = async (Model, filter) => {
  if (isMongoReady()) return (await Model.deleteMany(filter).exec()).deletedCount;
  const rows = collection(Model);
  const remaining = rows.filter((row) => !matches(row, filter));
  const deleted = rows.length - remaining.length;
  memoryCollections.set(Model.modelName, remaining);
  return deleted;
};

