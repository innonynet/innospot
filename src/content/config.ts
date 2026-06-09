import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    readingTime: z.number().optional(),
    thumbnail: z.string().optional(),
    likes: z.number().optional(),
  }),
});

export const collections = { blog };
