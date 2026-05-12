import { prisma } from "../../lib/prisma";
import { AppError } from "../../errors/AppError";
import { generateUniqueSlug } from "../../utils/slugify";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./category.validation";

export const createCategoryService = async (
  data: CreateCategoryInput,
  imageUrl?: string,
) => {
  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) throw new AppError("Parent category not found", 404);
  }

  const slug = await generateUniqueSlug(data.name, async (s) => {
    const found = await prisma.category.findUnique({ where: { slug: s } });
    return !!found;
  });

  return prisma.category.create({
    data: {
      ...data,
      slug,
      image: imageUrl,
    },
  });
};

export const getAllCategoriesService = async () => {
  // return tree structure — parent with children
  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  return categories;
};

export const getAllCategoriesFlatService = async () => {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: {
        select: { id: true, name: true },
      },
      _count: {
        select: { products: true },
      },
    },
  });
};

export const getCategoryBySlugService = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      parent: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!category) throw new AppError("Category not found", 404);
  return category;
};

export const updateCategoryService = async (
  id: string,
  data: UpdateCategoryInput,
  imageUrl?: string,
) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw new AppError("Category not found", 404);

  return prisma.category.update({
    where: { id },
    data: {
      ...data,
      ...(imageUrl && { image: imageUrl }),
    },
  });
};

export const deleteCategoryService = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: true,
      _count: { select: { products: true } },
    },
  });

  if (!category) throw new AppError("Category not found", 404);
  if (category.children.length > 0)
    throw new AppError("Cannot delete category with subcategories", 400);
  if (category._count.products > 0)
    throw new AppError("Cannot delete category with products", 400);

  await prisma.category.delete({ where: { id } });
  return true;
};
