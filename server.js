const express = require('express');
const app = express();
const mysql = require('promise-mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const asyncVerify = promisify(jwt.verify);

const jwtKey = 'my_secret_key';

const connectionPromise = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password',
	database: 'bad_driver',
});

app.use(express.json());

app.get('/users', async (req, res) => {
	const connection = await connectionPromise;
	const results = await connection.query('SELECT * FROM users');
	res.send(results);
});

app.get('/vehicules', async (req, res) => {
	const connection = await connectionPromise;
	const authHeader = req.headers.authorization;

	if (authHeader) {
		const token = authHeader.split(' ')[1];

		await asyncVerify(token, jwtKey)
			.catch(() => {
				return res.status(403).send({ error: 'acces non autorisé'});
			});

		const vehiculeSale = await connection.query('SELECT * from `vehicule`').catch(error => console.log(error));
		const result = vehiculeSale.map(async ( vehicule ) => {
			const comments = await connection.query(`SELECT * FROM Comments WHERE licensePlate = '${vehicule.licensePlate}'`);

			return {
				...vehicule,
				comments
			};
		});

		return res.send(await Promise.all(result));
	} else {
		return res.status(401).send({ error: 'acces non autorisé'});
	}
    
	
});

app.post('/create-user', async (req, res) => {
	const connection = await connectionPromise;
	const firstname = req.body.firstname;
	const lastname = req.body.lastname;
	const email = req.body.email;
	const password = bcrypt.hashSync(req.body.password, 10);

	const requestResult = await connection.query(`INSERT INTO users (firstname, lastname, email, password) VALUES ('${firstname}', '${lastname}', '${email}', '${password}')`);
    
	const result = {
		'id': requestResult.insertId,
		'firstname': firstname,
		'lastname': lastname,
		'email': email,
		'password': password
	};
    
	console.log('create user result', result);
	res.send(result);
});

app.post('/create-vehicule', async (req, res) => {
	const connection = await connectionPromise;
	const licensePlate = req.body.licensePlate;
	const brand = req.body.brand;
	const model = req.body.model;
	const description = req.body.description;

	if(!licensePlate){
		return res.status(500).send({error: 'no license plate'});
	}

	if(licensePlate.length !== 9) {
		return res.status(500).send({error: 'not valid license plate'});
	}
	
	const results = await connection.query(`INSERT INTO vehicule (licensePlate, brand, model, description) VALUES ('${licensePlate}', '${brand}', '${model}', '${description}')`);

	const result = {
		'id': results.insertId,
		'licensePlate': licensePlate,
		'brand': brand,
		'model': model,
		'description': description,
	};
	res.send(result);

});

app.post('/add-comment', async (req, res) => {
	const connection = await connectionPromise;
	const licensePlate = req.body.licensePlate;
	const tag = req.body.tag;
	const message = req.body.message;
	const userId = req.body.userId;

	if(!licensePlate) {
		return res.status(500).send({error: 'no license plate'});
	}

	if(licensePlate.length !== 9) {
		return res.status(500).send({error: 'not valid license plate'});
	}

	if(!tag) {
		return res.status(500).send({error: 'no tag'});
	}

	if(!userId) {
		return res.status(500).send({error: 'no userID'});
	}


	const addComment = await connection.query(`INSERT INTO Comments (licensePlate, tag, message, userId) VALUES ('${licensePlate}', '${tag}', '${message}', '${userId}')`);

	const results = await connection.query(`SELECT * from users WHERE id = ${userId}`);
	const result = {
		'id': results.insertId,
		'licensePlate': licensePlate,
		'tag': tag,
		'message': message,
		'user': results,
	};
	res.send(result);

});

app.post('/login', async (req, res) => {
	const connection = await connectionPromise;
	const email = req.body.email;
	const password = req.body.password;

	if (!email) {
		return res.status(500).send({error: 'not valid Email'});
	}

	if (!password) {
		return res.status(500).send({error: 'not valid password'});
	}

	const results = await connection.query(`SELECT * FROM users WHERE email = '${email}'`);

	if(results.length === 0) {
		return res.status(500).send({error: 'not valid Email'});
	}

	const payload = 
		{
			id: results[0].id,
			firstname: results[0].firstname,
			lastname: results[0].lastname,
			email: results[0].email
		}
	;

	const token = jwt.sign(payload, jwtKey, {
		algorithm: 'HS256',
		expiresIn: 60*60*12,
	});

	if(bcrypt.compareSync(password, results[0].password)) {
		return res.send(token);
	} else {
		return res.status(500).send({error: 'not good password'});
	}
        
});

app.listen(8081, () => {
	console.log('server is serving in port 8081');
});
