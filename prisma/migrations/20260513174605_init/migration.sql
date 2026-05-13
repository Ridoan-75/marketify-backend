/*
  Warnings:

  - A unique constraint covering the columns `[firebaseUid]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "AuthProvider" ADD VALUE 'FACEBOOK';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "firebaseUid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");
