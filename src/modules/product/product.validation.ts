import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Product name must be at least 3 characters"),
    description: z.string().optional(),
    shortDesc: z.string().optional(),
    basePrice: z.coerce.number().positive("Price must be positive"),
    discountPrice: z.coerce.number().positive().optional(),
    sku: z.string().optional(),
    stock: z.coerce.number().int().min(0).default(0),
    categoryId: z.string().min(1, "Category is required"),
    isFreeShipping: z.coerce.boolean().optional(),
    weight: z.coerce.number().optional(),
    tags: z.array(z.string()).optional(),
    // variants as JSON string from form-data
    variants: z.string().optional(),
    attributes: z.string().optional(),
  }),
});

export const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    description: z.string().optional(),
    shortDesc: z.string().optional(),
    basePrice: z.coerce.number().positive().optional(),
    discountPrice: z.coerce.number().positive().optional(),
    sku: z.string().optional(),
    stock: z.coerce.number().int().min(0).optional(),
    categoryId: z.string().optional(),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).optional(),
    isFreeShipping: z.coerce.boolean().optional(),
    weight: z.coerce.number().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(12),
    category: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    sort: z
      .enum(["newest", "oldest", "price_asc", "price_desc", "popular"])
      .default("newest"),
    sellerId: z.string().optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
export type ProductQueryInput = z.infer<typeof productQuerySchema>["query"];
