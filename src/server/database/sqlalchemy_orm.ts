/**
 * SQLAlchemy Declarative ORM Emulator for Node.js / TypeScript
 * Provides Python SQLAlchemy-style declarative mapping, column types,
 * session management, and querying on top of SQLite DatabaseSync.
 */

import { getDatabase } from './sqlite.ts';
import { DatabaseSync } from 'node:sqlite';

export type ColumnType = 'INTEGER' | 'TEXT' | 'REAL' | 'DATETIME' | 'BOOLEAN';

export interface ColumnOptions {
  primaryKey?: boolean;
  nullable?: boolean;
  default?: any;
}

export class ColumnDef {
  constructor(
    public type: ColumnType,
    public options: ColumnOptions = {}
  ) {}
}

export function Column(type: ColumnType, options?: ColumnOptions): ColumnDef {
  return new ColumnDef(type, options);
}

export const Integer: ColumnType = 'INTEGER';
export const String: ColumnType = 'TEXT';
export const Text: ColumnType = 'TEXT';
export const Float: ColumnType = 'REAL';
export const Boolean: ColumnType = 'BOOLEAN';
export const DateTime: ColumnType = 'DATETIME';

export interface ModelMetadata {
  tableName: string;
  columns: Record<string, ColumnDef>;
}

const modelRegistry = new Map<any, ModelMetadata>();

export function declarativeBase() {
  return class BaseEntity {
    static __tablename__: string;
    static __table_columns__: Record<string, ColumnDef>;

    static register(tableName: string, columns: Record<string, ColumnDef>) {
      modelRegistry.set(this, { tableName, columns });
      this.__tablename__ = tableName;
      this.__table_columns__ = columns;
    }
  };
}

export class Query<T> {
  private conditions: string[] = [];
  private params: any[] = [];
  private orderClause: string = '';
  private limitCount?: number;

  constructor(private modelClass: any, private db: DatabaseSync) {}

  filterBy(criteria: Record<string, any>): this {
    for (const [key, value] of Object.entries(criteria)) {
      this.conditions.push(`${key} = ?`);
      this.params.push(value);
    }
    return this;
  }

  filter(sqlCondition: string, ...params: any[]): this {
    this.conditions.push(sqlCondition);
    this.params.push(...params);
    return this;
  }

  orderBy(orderSql: string): this {
    this.orderClause = orderSql;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  all(): T[] {
    const tableName = this.modelClass.__tablename__;
    let sql = `SELECT * FROM ${tableName}`;
    if (this.conditions.length > 0) {
      sql += ` WHERE ${this.conditions.join(' AND ')}`;
    }
    if (this.orderClause) {
      sql += ` ORDER BY ${this.orderClause}`;
    }
    if (this.limitCount) {
      sql += ` LIMIT ${this.limitCount}`;
    }
    const stmt = this.db.prepare(sql);
    return stmt.all(...this.params) as T[];
  }

  first(): T | null {
    this.limit(1);
    const rows = this.all();
    return rows.length > 0 ? rows[0] : null;
  }

  count(): number {
    const tableName = this.modelClass.__tablename__;
    let sql = `SELECT COUNT(*) as cnt FROM ${tableName}`;
    if (this.conditions.length > 0) {
      sql += ` WHERE ${this.conditions.join(' AND ')}`;
    }
    const stmt = this.db.prepare(sql);
    const res = stmt.get(...this.params) as { cnt: number };
    return res ? res.cnt : 0;
  }
}

export class Session {
  constructor(private db: DatabaseSync) {}

  query<T>(modelClass: any): Query<T> {
    return new Query<T>(modelClass, this.db);
  }

  add(modelClass: any, entity: Record<string, any>): void {
    const tableName = modelClass.__tablename__;
    const keys = Object.keys(entity);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => entity[k]);

    const sql = `INSERT OR REPLACE INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(sql);
    stmt.run(...values);
  }

  delete(modelClass: any, primaryKeyCol: string, id: any): void {
    const tableName = modelClass.__tablename__;
    const sql = `DELETE FROM ${tableName} WHERE ${primaryKeyCol} = ?`;
    const stmt = this.db.prepare(sql);
    stmt.run(id);
  }

  commit(): void {
    // DatabaseSync is auto-commit in SQLite
  }

  close(): void {
    // Session closed
  }
}

export function createSession(): Session {
  return new Session(getDatabase());
}
