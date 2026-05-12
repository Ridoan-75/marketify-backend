import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { generateUniqueSlug } from "../../utils/slugify";
import { paginate, paginateMeta } from "../../utils/paginate";
import {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from "./product.validation";

interface VariantInput {
  sku?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  image?: string;
  attributes: { name: string; value: string }[];
}

export const createProductService = async (
  userId: string,
  data: CreateProductInput,
  imageUrls: string[],
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Seller not found", 404);
  if (seller.status !== "APPROVED")
    throw new AppError("Your shop is not approved yet", 403);

  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw new AppError("Category not found", 404);

  const slug = await generateUniqueSlug(data.name, async (s) => {
    const found = await prisma.product.findUnique({ where: { slug: s } });
    return !!found;
  });

  // parse variants and attributes from JSON string (form-data)
  const variants: VariantInput[] = data.variants
    ? JSON.parse(data.variants)
    : [];
  const attributes: { name: string; values: string[] }[] = data.attributes
    ? JSON.parse(data.attributes)
    : [];

  const product = await prisma.product.create({
    data: {
      sellerId: seller.id,
      categoryId: data.categoryId,
      name: data.name,
      slug,
      description: data.description,
      shortDesc: data.shortDesc,
      basePrice: data.basePrice,
      discountPrice: data.discountPrice,
      sku: data.sku,
      stock: data.stock,
      isFreeShipping: data.isFreeShipping ?? false,
      weight: data.weight,
      tags: data.tags ?? [],
      images: {
        create: imageUrls.map((url, index) => ({
          url,
          isPrimary: index === 0,
          sortOrder: index,
        })),
      },
      attributes: {
        create: attributes.map((attr) => ({
          name: attr.name,
          values: {
            create: attr.values.map((val) => ({ value: val })),
          },
        })),
      },
    },
    include: {
      images: true,
      attributes: { include: { values: true } },
    },
  });

  // create variants if provided
  if (variants.length > 0) {
    for (const variant of variants) {
      const createdVariant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: variant.sku,
          price: variant.price,
          discountPrice: variant.discountPrice,
          stock: variant.stock,
          image: variant.image,
        },
      });

      // link variant to attribute values
      for (const attr of variant.attributes) {
        const attribute = product.attributes.find((a) => a.name === attr.name);
        if (!attribute) continue;

        const attrValue = await prisma.attributeValue.findFirst({
          where: { attributeId: attribute.id, value: attr.value },
        });
        if (!attrValue) continue;

        await prisma.variantAttributeValue.create({
          data: {
            variantId: createdVariant.id,
            attributeValueId: attrValue.id,
          },
        });
      }
    }
  }

  return prisma.product.findUnique({
    where: { id: product.id },
    include: {
      images: true,
      attributes: { include: { values: true } },
      variants: {
        include: { attributes: { include: { attributeValue: true } } },
      },
      category: { select: { id: true, name: true, slug: true } },
    },
  });
};

export const getProductsService = async (query: ProductQueryInput) => {
  const { skip, take, page, limit } = paginate({
    page: query.page,
    limit: query.limit,
  });

  const where: object = {
    status: "ACTIVE",
    ...(query.category && {
      category: { slug: query.category },
    }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { tags: { has: query.search } },
      ],
    }),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          basePrice: {
            ...(query.minPrice !== undefined && { gte: query.minPrice }),
            ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
          },
        }
      : {}),
    ...(query.sellerId && { sellerId: query.sellerId }),
  };

  const orderBy = {
    newest: { createdAt: "desc" as const },
    oldest: { createdAt: "asc" as const },
    price_asc: { basePrice: "asc" as const },
    price_desc: { basePrice: "desc" as const },
    popular: { totalSold: "desc" as const },
  }[query.sort];

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, shopName: true, shopSlug: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, meta: paginateMeta(total, page, limit) };
};

export const getProductBySlugService = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: { select: { id: true, name: true, slug: true } },
      seller: {
        select: {
          id: true,
          shopName: true,
          shopSlug: true,
          shopLogo: true,
          rating: true,
          ratingCount: true,
        },
      },
      attributes: { include: { values: true } },
      variants: {
        where: { isActive: true },
        include: {
          attributes: {
            include: { attributeValue: true },
          },
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, avatar: true } },
        },
      },
    },
  });

  if (!product) throw new AppError("Product not found", 404);
  if (product.status !== "ACTIVE")
    throw new AppError("Product is not available", 403);

  return product;
};

export const getSellerProductsService = async (
  userId: string,
  query: ProductQueryInput,
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Seller not found", 404);

  const { skip, take, page, limit } = paginate({
    page: query.page,
    limit: query.limit,
  });

  const where = {
    sellerId: seller.id,
    ...(query.search && {
      name: { contains: query.search, mode: "insensitive" as const },
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { id: true, name: true } },
        _count: { select: { orderItems: true, reviews: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, meta: paginateMeta(total, page, limit) };
};

export const updateProductService = async (
  userId: string,
  productId: string,
  data: UpdateProductInput,
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Seller not found", 404);

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: seller.id },
  });
  if (!product) throw new AppError("Product not found", 404);

  return prisma.product.update({
    where: { id: productId },
    data,
    include: {
      images: true,
      category: { select: { id: true, name: true } },
    },
  });
};

export const deleteProductService = async (
  userId: string,
  productId: string,
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Seller not found", 404);

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: seller.id },
  });
  if (!product) throw new AppError("Product not found", 404);

  await prisma.product.delete({ where: { id: productId } });
  return true;
};

export const addProductImagesService = async (
  userId: string,
  productId: string,
  imageUrls: string[],
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Seller not found", 404);

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: seller.id },
    include: { images: true },
  });
  if (!product) throw new AppError("Product not found", 404);

  const startOrder = product.images.length;

  await prisma.productImage.createMany({
    data: imageUrls.map((url, index) => ({
      productId,
      url,
      isPrimary: startOrder === 0 && index === 0,
      sortOrder: startOrder + index,
    })),
  });

  return prisma.product.findUnique({
    where: { id: productId },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
};

export const deleteProductImageService = async (
  userId: string,
  imageId: string,
) => {
  const seller = await prisma.seller.findUnique({ where: { userId } });
  if (!seller) throw new AppError("Seller not found", 404);

  const image = await prisma.productImage.findFirst({
    where: { id: imageId, product: { sellerId: seller.id } },
  });
  if (!image) throw new AppError("Image not found", 404);

  await prisma.productImage.delete({ where: { id: imageId } });
  return true;
};
