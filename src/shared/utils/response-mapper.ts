type TransformFn<T, R> = (value: T) => R;

interface MappingConfig<Entity, Response> {
  fields: Partial<Record<keyof Response, keyof Entity | TransformFn<any, any>>>;
  nested?: Partial<Record<keyof Response, ResponseMapper<any, any>>>;
}

export class ResponseMapper<Entity, Response> {
  private config: MappingConfig<Entity, Response>;

  public constructor(config: MappingConfig<Entity, Response>) {
    this.config = config;
  }

  public toResponse(entity: Entity): Response {
    const response = {} as Response;

    // Map fields based on configuration
    for (const [responseKey, entityKeyOrTransform] of Object.entries(
      this.config.fields
    )) {
      const key = responseKey as keyof Response;
      const value = this.getValue(entity, entityKeyOrTransform as keyof Entity);

      if (value !== undefined && value !== null) {
        response[key] = value as any;
      }
    }

    // Handle nested objects
    if (this.config.nested) {
      for (const [nestedKey, nestedMapper] of Object.entries(
        this.config.nested
      )) {
        const key = nestedKey as keyof Response;
        const nestedEntity = entity[nestedKey as keyof Entity];
        if (nestedEntity) {
          response[key] = (nestedMapper as ResponseMapper<any, any>).toResponse(
            nestedEntity as any
          ) as any;
        }
      }
    }

    return response;
  }

  public toResponseList(entities: Entity[]): Response[] {
    return entities.map((entity) => this.toResponse(entity));
  }

  private getValue(
    entity: Entity,
    entityKeyOrTransform: keyof Entity | TransformFn<any, any>
  ): any {
    if (typeof entityKeyOrTransform === "function") {
      // Handle transformations
      return entityKeyOrTransform(entity);
    }

    const fieldName = entityKeyOrTransform as keyof Entity;

    let value;
    if (entityKeyOrTransform.toString() in (entity as any)) {
      // First, try direct property access
      value = entity[fieldName];
      // If the fieldName itself is a getter method name, try calling it
      if (
        (typeof value === "function" ||
          value === undefined ||
          value === null) &&
        typeof fieldName === "string"
      ) {
        // Check if the fieldName is already a getter method name (like 'getName', 'getEmail', etc.)
        if (
          fieldName.startsWith("get") &&
          typeof (entity as any)[fieldName] === "function"
        ) {
          value = (entity as any)[fieldName]();
        }

        // Also check if it's a method without 'get' prefix
        if (
          (value === undefined || value === null) &&
          typeof (entity as any)[fieldName] === "function"
        ) {
          value = (entity as any)[fieldName]();
        }
      }
      // If still no value, try the exact getter name if it's a function
      if (
        (value === undefined || value === null) &&
        typeof (entity as any)[fieldName] === "function"
      ) {
        value = (entity as any)[fieldName]();
      }
    }

    // If value is undefined/null, try getter methods
    if (value === undefined || value === null) {
      // Try camelCase getter (getFieldName)
      const camelCaseGetter = `get${String(fieldName)[0].toUpperCase() + String(fieldName).slice(1)}`;
      if (typeof (entity as any)[camelCaseGetter] === "function") {
        value = (entity as any)[camelCaseGetter]();
      }
    }

    return value;
  }
}
