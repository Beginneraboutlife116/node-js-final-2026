const { configDotenv } = require("dotenv");
configDotenv({ quiet: true });

const path = require("node:path");
const typeorm = require("typeorm");

const dataSource = new typeorm.DataSource({
	type: "postgres",
	host: process.env.DB_HOST || "localhost",
	port: Number(process.env.DB_PORT) || 5432,
	username: process.env.DB_USERNAME || "test",
	password: process.env.DB_PASSWORD || "admin",
	database: process.env.DB_DATABASE || "test",
	synchronize: process.env.DB_SYNCHRONIZE === "true",
	entities: [path.join(__dirname, "..", "entities", "*.js")],
	migrations: [path.join(__dirname, "migrations", "*.js")],
	migrationsRun: true,
});

module.exports = { dataSource };
