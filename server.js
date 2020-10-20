const express = require('express');
const app = express();
const mysql = require('promise-mysql');
const bcrypt = require('bcrypt');

const connectionPromise = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password',
	database: 'bad_driver',
});

app.use(express.json());

app.get('/users', async (req, res) => {
	connection.query('SELECT * FROM `users` WHERE 1', (error, results, fields) => {
		if (error) {
			console.log(error);
		}
		res.send(results);
	});
});

app.get('/vehicules', async (req, res) => {

	let arrayWithAll = [];
    
	const connection = await connectionPromise;
	console.log('connection', connection);
    
	connection.query('SELECT * from `vehicule`', (error, results, fields) => {
		if (error) {
			return res.send(error);
		}

		// res.send(results[0]);
		const osef = results.map((elt) => {
			const lol = connection.query('SELECT * FROM Comments WHERE licensePlate = \'22-123-23\'', (error, results, fields) => {
				if(error) {
					return res.send(error); 
				}

				const allStuff = {
					id: elt.id,
					'licensePlate': elt.licensePlate,
					'brand': elt.brand,
					'model': elt.model,
					'description': elt.description,
					'comments': results,
				};
                
				//arrayWithAll.push({lo: 'lo'});
				return allStuff;
			});
			return lol;
		});

		console.log('osef', osef);
		return res.send(osef);
	});
});

app.post('/create-user', async (req, res) => {
	const firstname = req.body.firstname;
	const lastname = req.body.lastname;
	const email = req.body.email;
	const password = bcrypt.hashSync(req.body.password, 10);

	connection.query(`INSERT INTO users (firstname, lastname, email, password) VALUES ('${firstname}', '${lastname}', '${email}', '${password}')`, (error, results, fields) => {
		if(error) {
			console.log(error);
		}
		const result = {
			'id': results.insertId,
			'firstname': firstname,
			'lastname': lastname,
			'email': email,
			'password': password
		};
		res.send(result);
	});
});

app.post('/create-vehicule', async (req, res) => {
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

	connection.query(`INSERT INTO vehicule (licensePlate, brand, model, description) VALUES ('${licensePlate}', '${brand}', '${model}', '${description}')`, (error, results, fields) => {
		if(error) {
			return res.send(error);
		}
		const result = {
			'id': results.insertId,
			'licensePlate': licensePlate,
			'brand': brand,
			'model': model,
			'description': description,
		};
		res.send(result);
	});
});

app.post('/add-comment', async (req, res) => {
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


	connection.query(`INSERT INTO Comments (licensePlate, tag, message, userId) VALUES ('${licensePlate}', '${tag}', '${message}', '${userId}')`, (error, results, fields) => {
		if(error) {
			return res.send(error);
		}

		connection.query(`SELECT * from users WHERE id = ${userId}`, (error, results, fields) => {
			if(error) {
				return res.send(error);
			}
			const result = {
				'id': results.insertId,
				'licensePlate': licensePlate,
				'tag': tag,
				'message': message,
				'user': results,
			};
			res.send(result);
		});

	});
});

app.post('/login', async (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

	if (!email) {
		return res.status(500).send({error: 'not valid Email'});
	}

	if (!password) {
		return res.status(500).send({error: 'not valid password'});
	}

	connection.query(`SELECT * FROM users WHERE email = '${email}'`, (error, results, fields) => {
		if(error) {
			return res.send(error);
		}

		if(results.length === 0) {
			return res.status(500).send({error: 'not valid Email'});
		}

		if(bcrypt.compareSync(password, results[0].password)) {
			return res.send(results);
		} else {
			return res.status(500).send({error: 'not good password'});
		}
        
	});
});

app.listen(8081, () => {
	console.log('server is serving in port 8081');
});
