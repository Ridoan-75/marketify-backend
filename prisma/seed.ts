import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // ============================================================
  // ADMIN
  // ============================================================
  const adminPassword = await bcrypt.hash('Admin@1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketify.com' },
    update: {},
    create: {
      name: 'Marketify Admin',
      email: 'admin@marketify.com',
      password: adminPassword,
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('Admin created:', admin.email);

  // ============================================================
  // SELLER
  // ============================================================
  const sellerPassword = await bcrypt.hash('Seller@1234', 12);

  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@marketify.com' },
    update: {},
    create: {
      name: 'Demo Seller',
      email: 'seller@marketify.com',
      password: sellerPassword,
      role: 'SELLER',
      isEmailVerified: true,
      isActive: true,
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      shopName: 'Demo Shop',
      shopSlug: 'demo-shop',
      shopDescription: 'This is a demo shop for testing purposes.',
      shopPhone: '01700000001',
      shopEmail: 'seller@marketify.com',
      shopAddress: 'Chittagong, Bangladesh',
      status: 'APPROVED',
    },
  });

  console.log('Seller created:', sellerUser.email);

  // ============================================================
  // USER
  // ============================================================
  const userPassword = await bcrypt.hash('User@1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'user@marketify.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'user@marketify.com',
      password: userPassword,
      role: 'USER',
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('User created:', user.email);

  // ============================================================
  // CATEGORIES
  // ============================================================
  const categories = [
    { name: 'Electronics', slug: 'electronics', sortOrder: 1 },
    { name: 'Fashion', slug: 'fashion', sortOrder: 2 },
    { name: 'Home & Living', slug: 'home-living', sortOrder: 3 },
    { name: 'Sports', slug: 'sports', sortOrder: 4 },
    { name: 'Books', slug: 'books', sortOrder: 5 },
    { name: 'Beauty', slug: 'beauty', sortOrder: 6 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        isActive: true,
        sortOrder: cat.sortOrder,
      },
    });
  }

  console.log('Categories created');

  // ============================================================
  // SUBCATEGORIES
  // ============================================================
  const electronicsCategory = await prisma.category.findUnique({
    where: { slug: 'electronics' },
  });

  const fashionCategory = await prisma.category.findUnique({
    where: { slug: 'fashion' },
  });

  if (electronicsCategory) {
    const subCategories = [
      { name: 'Phones', slug: 'phones' },
      { name: 'Laptops', slug: 'laptops' },
      { name: 'Headphones', slug: 'headphones' },
      { name: 'Cameras', slug: 'cameras' },
    ];

    for (const sub of subCategories) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {},
        create: {
          name: sub.name,
          slug: sub.slug,
          parentId: electronicsCategory.id,
          isActive: true,
          sortOrder: 0,
        },
      });
    }
  }

  if (fashionCategory) {
    const subCategories = [
      { name: "Men's Clothing", slug: 'mens-clothing' },
      { name: "Women's Clothing", slug: 'womens-clothing' },
      { name: 'Shoes', slug: 'shoes' },
      { name: 'Accessories', slug: 'accessories' },
    ];

    for (const sub of subCategories) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {},
        create: {
          name: sub.name,
          slug: sub.slug,
          parentId: fashionCategory.id,
          isActive: true,
          sortOrder: 0,
        },
      });
    }
  }

  console.log('Subcategories created');

  // ============================================================
  // SAMPLE PRODUCTS
  // ============================================================
  const phonesCategory = await prisma.category.findUnique({
    where: { slug: 'phones' },
  });

  if (phonesCategory && seller) {
    const products = [
      {
        name: 'Samsung Galaxy A54',
        slug: 'samsung-galaxy-a54',
        shortDesc: 'Mid-range smartphone with great camera',
        description: 'The Samsung Galaxy A54 features a 6.4-inch Super AMOLED display, 50MP camera, and 5000mAh battery.',
        basePrice: 35000,
        discountPrice: 32000,
        stock: 50,
        tags: ['samsung', 'android', 'smartphone'],
      },
      {
        name: 'iPhone 14',
        slug: 'iphone-14',
        shortDesc: 'Apple flagship smartphone',
        description: 'iPhone 14 features the A15 Bionic chip, 12MP camera system, and all-day battery life.',
        basePrice: 95000,
        discountPrice: 89000,
        stock: 20,
        tags: ['apple', 'iphone', 'ios'],
      },
      {
        name: 'Xiaomi Redmi Note 12',
        slug: 'xiaomi-redmi-note-12',
        shortDesc: 'Budget smartphone with AMOLED display',
        description: 'Xiaomi Redmi Note 12 comes with a 6.67-inch AMOLED display, 50MP camera, and 5000mAh battery.',
        basePrice: 22000,
        discountPrice: 19500,
        stock: 100,
        tags: ['xiaomi', 'redmi', 'android'],
      },
    ];

    for (const product of products) {
      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {},
        create: {
          sellerId: seller.id,
          categoryId: phonesCategory.id,
          name: product.name,
          slug: product.slug,
          shortDesc: product.shortDesc,
          description: product.description,
          basePrice: product.basePrice,
          discountPrice: product.discountPrice,
          stock: product.stock,
          status: 'ACTIVE',
          tags: product.tags,
          isFreeShipping: false,
        },
      });
    }

    console.log('Sample products created');
  }

  // ============================================================
  // BANNER
  // ============================================================
  await prisma.banner.upsert({
    where: { id: 'seed-banner-1' },
    update: {},
    create: {
      id: 'seed-banner-1',
      title: 'Welcome to Marketify',
      subtitle: 'New Arrivals',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      position: 'HERO',
      sortOrder: 0,
      isActive: true,
      link: '/products',
    },
  });

  console.log('Banner created');

  console.log('\nSeed completed successfully!');
  console.log('\nTest Credentials:');
  console.log('Admin  → admin@marketify.com  / Admin@1234');
  console.log('Seller → seller@marketify.com / Seller@1234');
  console.log('User   → user@marketify.com   / User@1234');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });