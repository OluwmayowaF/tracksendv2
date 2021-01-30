// SEQUELIZE-CLI CONFIG FILE

module.exports = {
    "development": {
        "username": process.env.DB_DEV_MYSQL_USERNAME,
        "password": process.env.DB_DEV_MYSQL_PASSWORD,
        "database": process.env.DB_DEV_MYSQL_DATABASE,
        "host": process.env.DB_DEV_MYSQL_HOST,
        "dialect": "mysql",

        "migrationStorage": "json",

    },
   /* "test": {
        "username": "root",
        "password": null,
        "database": "database_test",
        "host": "127.0.0.1",
        "dialect": "mysql"
    },*/
    "production": {
        "username": process.env.DB_PROD_MYSQL_USERNAME,
        "password": process.env.DB_PROD_MYSQL_PASSWORD,
        "database": process.env.DB_PROD_MYSQL_DATABASE,
        "host": process.env.DB_PROD_MYSQL_HOST,
        "dialect": "mysql"

        "migrationStorage": "json",

    }
}