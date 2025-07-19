import type { SchemaProperty, ObjectSchema } from '../types';

/**
 * Pre-built schema helpers for common patterns
 */
export const schemas = {
  /**
   * String ID field
   */
  id: {
    type: 'string',
    description: 'Resource ID'
  } as SchemaProperty,

  /**
   * Search query string
   */
  search: {
    type: 'string',
    description: 'Search query'
  } as SchemaProperty,

  /**
   * Pagination schema with limit and offset
   */
  pagination: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        description: 'Number of items to return'
      },
      offset: {
        type: 'number',
        minimum: 0,
        description: 'Number of items to skip'
      }
    }
  } as ObjectSchema,

  /**
   * Create an object schema with properties and required fields
   * @param properties - Object properties
   * @param required - Required field names
   * @returns Object schema
   */
  objectBody: (properties: { [key: string]: SchemaProperty }, required: string[] = []): ObjectSchema => ({
    type: 'object',
    properties,
    required,
    additionalProperties: false
  }),

  /**
   * Create a string schema with common validations
   * @param options - String options
   * @returns String schema
   */
  string: (options: {
    description?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    format?: 'email' | 'uri' | 'date' | 'date-time';
    enum?: string[];
  } = {}): SchemaProperty => ({
    type: 'string',
    ...options
  }),

  /**
   * Create a number schema with common validations
   * @param options - Number options
   * @returns Number schema
   */
  number: (options: {
    description?: string;
    minimum?: number;
    maximum?: number;
    enum?: number[];
  } = {}): SchemaProperty => ({
    type: 'number',
    ...options
  }),

  /**
   * Create a boolean schema
   * @param description - Schema description
   * @returns Boolean schema
   */
  boolean: (description?: string): SchemaProperty => ({
    type: 'boolean',
    ...(description && { description })
  }),

  /**
   * Create an array schema
   * @param items - Array item schema
   * @param options - Array options
   * @returns Array schema
   */
  array: (items: SchemaProperty, options: {
    description?: string;
    minItems?: number;
    maxItems?: number;
  } = {}): SchemaProperty => ({
    type: 'array',
    items,
    ...options
  }),

  /**
   * Create an enum schema
   * @param values - Enum values
   * @param description - Schema description
   * @returns Enum schema
   */
  enum: (values: any[], description?: string): SchemaProperty => ({
    type: typeof values[0] === 'string' ? 'string' : 'number',
    enum: values,
    ...(description && { description })
  })
}; 