.PHONY: help install dev build migrate seed test clean docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start development (backend + frontend + electron)"
	@echo "  make build        - Build production bundles"
	@echo "  make migrate      - Run database migrations"
	@echo "  make seed         - Seed database with sample data"
	@echo "  make test         - Run all tests"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make docker-up    - Start Docker services"
	@echo "  make docker-down  - Stop Docker services"

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build
	pnpm build:electron

migrate:
	cd apps/backend && pnpm prisma migrate dev

seed:
	cd apps/backend && pnpm prisma db seed

test:
	pnpm test

clean:
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/*/dist apps/*/build apps/*/.next
	rm -rf apps/electron/out

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

