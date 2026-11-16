import { ref } from 'vue';
import type { z } from 'zod';

/**
 * Validates a form with the same Zod schema as the API and exposes
 * the first message of each field.
 */
export function useSchemaErrors<Schema extends z.ZodType>(schema: Schema) {
  const errors = ref<Record<string, string | undefined>>({});

  function validate(value: unknown): z.output<Schema> | undefined {
    const result = schema.safeParse(value);
    if (result.success) {
      errors.value = {};
      return result.data;
    }
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.map(String).join('.') || 'form';
      fieldErrors[field] ??= issue.message;
    }
    errors.value = fieldErrors;
    return undefined;
  }

  return { errors, validate };
}
