const express = require('express');
const app = express();
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'bad_driver',
});

app.use(express.json());

app.get('/hello/:id', async (req, res) => {
    console.log(req.params)
    connection.query('SELECT * FROM `users` WHERE 1', (error, results, fields) => {
        if (error) {
            console.log(error);
        }
        res.send(results)
    });
})

app.listen(8081, () => {
    console.log('server is serving in port 8081')
})