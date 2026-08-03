export interface IQueryOptions<T> {
  where?: Partial<Record<keyof T, any>>;
  relations?: string[];
  skip?: number;
  take?: number;
  order?: Partial<Record<keyof T, "ASC" | "DESC">>;
}

export interface IBaseRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options: IQueryOptions<T>): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}
