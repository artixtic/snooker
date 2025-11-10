-- Migration: Make tax field nullable in Sale table
-- Run this SQL directly on your database if Prisma migrate fails

ALTER TABLE "Sale" ALTER COLUMN "tax" DROP NOT NULL;

