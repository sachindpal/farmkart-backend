require( "@babel/register" );
if ( process.env.NODE_ENV !== "production" ) {
    require( "dotenv" ).config( { "path": `${__dirname}/../.env` } );
}
// console.log('process.env.DB_PORT',process.env.DB_PORT)
// Default configuration for database connection
let connection = {
    "port": process.env.DB_PORT,
    "host": process.env.DB_HOST,
    "user": process.env.DB_USER,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "charset": process.env.DB_CHARSET,
    "collate": process.env.DB_COLLATE,
    "timezone": process.env.DB_TIMEZONE,
    "dateStrings": true
};

module.exports = {
    connection,
    "client": process.env.DB_CLIENT,
    "migrations": {
        
    },
    "seeds": {
        
    }
};

