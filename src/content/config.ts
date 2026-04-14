import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),        // 記事一覧に出る冒頭文
    date: z.coerce.date(),
    tag: z.enum(["azure", "aws", "cloud", "dev", "infra"]),
    readingTime: z.number().optional(), // 読了時間（分）
    thumbnail: z.string().optional(),   // 画像を使う場合のパス
  }),
});

export const collections = { blog };
