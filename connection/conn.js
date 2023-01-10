const {Client} = require('pg');

const client  = new Client({
    user: 'postgres',
    password: 'admin',
    host: 'localhost',
    port:  5432,
    database: 'seles-app'
});

const conn =  client.connect(err => {
    if (err) throw err;
    if (!err) {
        console.log("connected databases : seles-app");
    }
});

module.exports = client, conn;
