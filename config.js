
module.exports ={
    production:{
        DBMYSQLCONNECTION: process.env.DB_PROD_MYSQL_CONNECTION,
        DBMYSQLHOST: process.env.DB_PROD_MYSQL_HOST,
        DBMYSQLPORT: process.env.DB_PROD_MYSQL_PORT,
        DBMYSQLDATABASE: process.env.DB_PROD_MYSQL_DATABASE,
        DBMYSQLUSERNAME: process.env.DB_PROD_MYSQL_USERNAME,
        DBMYSQLPASSWORD: process.env.DB_PROD_MYSQL_PASSWORD,
        DBMONGOURL: process.env.DB_PROD_MONGO_URL,
        DBMONGODATABASE: process.env.DB_PROD_MONGO_DATABASE,
        DBMONGOUSERNAME: process.env.DB_PROD_MONGO_USERNAME,
        DBMONGOPASSWORD: process.env.DB_PROD_MONGO_PASSWORD,
    },
    development: {
        DBMYSQLCONNECTION: process.env.DB_DEV_MYSQL_CONNECTION,
        DBMYSQLHOST: process.env.DB_DEV_MYSQL_HOST,
        DBMYSQLPORT: process.env.DB_DEV_MYSQL_PORT,
        DBMYSQLDATABASE: process.env.DB_DEV_MYSQL_DATABASE,
        DBMYSQLUSERNAME: process.env.DB_DEV_MYSQL_USERNAME,
        DBMYSQLPASSWORD: process.env.DB_DEV_MYSQL_PASSWORD,
        DBMONGOURL: process.env.DB_DEV_MONGO_URL,
        DBMONGODATABASE: process.env.DB_DEV_MONGO_DATABASE,
        DBMONGOUSERNAME: process.env.DB_DEV_MONGO_USERNAME,
        DBMONGOPASSWORD: process.env.DB_DEV_MONGO_PASSWORD,
         
    },
    test: {
        DBMYSQLCONNECTION: process.env.DB_TEST_MYSQL_CONNECTION,
        DBMYSQLHOST: process.env.DB_TEST_MYSQL_HOST,
        DBMYSQLPORT: process.env.DB_TEST_MYSQL_PORT,
        DBMYSQLDATABASE: process.env.DB_TEST_MYSQL_DATABASE,
        DBMYSQLUSERNAME: process.env.DB_TEST_MYSQL_USERNAME,
        DBMYSQLPASSWORD: process.env.DB_TEST_PASSWORD,
        DBMONGOURL: process.env.DB_TEST_MONGO_URL,
        DBMONGODATABASE: process.env.DB_TEST_MONGO_DATABASE,
        DBMONGOUSERNAME: process.env.DB_TEST_MONGO_USERNAME,
        DBMONGOPASSWORD: process.env.DB_TEST_MONGO_PASSWORD,
    }

}