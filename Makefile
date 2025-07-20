# Variables
PROJECT_NAME = ft_transcendence

# Docker Compose commands
up:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

restart: down up

rebuild:
	docker-compose up -d --build --force-recreate

ps:
	docker-compose ps

exec-backend:
	docker exec -it $$(docker-compose ps -q backend) sh

clean:
	docker-compose down -v --remove-orphans

prune:
	docker system prune -af

db-reset:
	@echo "Removing old database file..."
	rm -f data/ft_transcendence.db
	@echo "Running migrations..."
	DB_PATH=../data/ft_transcendence.db npx knex migrate:latest --knexfile backend/knexfile.cjs
	@echo "Seeding achievements..."
	DB_PATH=../data/ft_transcendence.db npx knex seed:run --knexfile backend/knexfile.cjs --specific=001_achievements.cjs
	@echo "Database reset, migrated, and seeded!"

# Help command
help:
	@echo "Available targets:"
	@echo "  make up           - Build and start containers"
	@echo "  make down         - Stop and remove containers"
	@echo "  make restart      - Restart containers"
	@echo "  make logs         - Show logs"
	@echo "  make exec-backend - Enter backend container shell"
	@echo "  make clean        - Remove containers, volumes, orphans"
	@echo "  make prune        - Force remove all unused Docker data"
