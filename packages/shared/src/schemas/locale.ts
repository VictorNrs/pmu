import { z } from 'zod';

/** Validation messages are shown to French-speaking users, in the API and in the forms. */
z.config(z.locales.fr());
