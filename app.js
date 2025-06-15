const http = require('node:http');
const fs = require('node:fs');
const url = require('node:url');
const pg = require('pg');

var blockno;
var pid;

// const hostname = 'https://cognition-a0e89b43ca6a.herokuapp.com/' || 'localhost';
const port = process.env.PORT || 8080;

const pgClient = new pg.Client({
	connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/cognition',
	ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
	//ssl: process.env.DATABASE_URL ? true : false

	//comment below code in localhost
	/*
	ssl: {
		require: true,
		rejectUnauthorized: false
	}*/
});

pgClient.connect(err => {
	if (err) {
		// Log error if connection fails
		console.error('Connection to PostgreSQL failed:', err.stack);
	} else {
		// Log success message if connection is successful
		console.log('Connected to PostgreSQL');
	}
});
const server = http.createServer((req, res) => {
	const pathname = url.parse(req.url).pathname;

	// Function to serve files
	const serveFile = (filePath, contentType) => {
		fs.readFile(filePath, (err, data) => {
			if (err) {
				console.error(err.stack);
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('500 Internal Server Error');
			} else {
				res.writeHead(200, { 'Content-Type': contentType });
				res.end(data);
			}
		});
	};

	if (req.method === 'GET') {
		console.log(pathname);
		if (pathname === '/') {
			serveFile('./html/instructions.html', 'text/html; charset=utf-8');
		} else if (pathname === '/instructions') {
			serveFile('./html/instructions.html', 'text/html; charset=utf-8');
		} else if (pathname === '/instructions2') {
			serveFile('./html/instructions2.html', 'text/html; charset=utf-8');
		} else if (pathname === '/instructions3') {
			serveFile('./html/instructions3.html', 'text/html; charset=utf-8');
		} else if (pathname === '/instructions4') {
			serveFile('./html/instructions4.html', 'text/html; charset=utf-8');
		} else if (pathname === '/maxspeedinstruction') {
			serveFile('./html/maxspeedinstruction.html', 'text/html; charset=utf-8');
		} else if (pathname === '/maxspeed') {
			serveFile('./html/maxspeed.html', 'text/html; charset=utf-8');
		} else if (pathname === '/thanks') {
			serveFile('./html/thanks.html', 'text/html; charset=utf-8');
		} else if (pathname === '/test') {
			serveFile('./html/test.html', 'text/html; charset=utf-8');
		} else if (pathname === '/test2') {
			serveFile('./html/test2.html', 'text/html; charset=utf-8');
		} else if (pathname === '/oldtest') {
			serveFile('./html/oldtest.html', 'text/html; charset=utf-8');
		} else if (pathname === '/style.css') {
			serveFile('./styles/style.css', 'text/css');
		} else if (pathname === '/instructions.js') {
			serveFile('./script/instructions.js', 'application/javascript');
		} else if (pathname === '/maxspeed.js') {
			serveFile('./script/maxspeed.js', 'application/javascript');
		} else if (pathname === '/test.js') {
			console.log(1);
			serveFile('./script/test.js', 'application/javascript');
		} else if (pathname === '/test2.js') {
			console.log(2);
			serveFile('./script/test2.js', 'application/javascript');
		} else if (pathname === '/oldtest.js') {
			console.log(3);
			serveFile('./script/oldtest.js', 'application/javascript');
		} else if (pathname === '/measures.js') {
			serveFile('./script/measures.js', 'application/javascript');
		} else if (pathname === '/calculateResult') {
			async function getData() {
				const resp = await pgClient.query('SELECT * FROM test_results ORDER BY Id DESC LIMIT 1');
				//console.log(resp.rows[0]);
				const obj = {
					pid: resp.rows[0].pid,
					blockno: resp.rows[0].blockno,
				};
				res.end(JSON.stringify(obj));
			}
			getData();
		} else {
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('404 page not found');
		}
	} else if (req.method === 'POST' && pathname === '/submitdata') {
		let body = '';

		req.on('data', chunk => {
			body += chunk.toString();
		});

		req.on('end', async () => {
			try {
				const data = JSON.parse(body);


				// Insert data into the database
				for (let i = 0; i < data.coordx.length; i++) {
					await pgClient.query(
						'INSERT INTO test_results (pid, blockno, coordx, coordy, coordt, realpointid, realpointx, realpointy, fakepointid, fakepointx, fakepointy, speed, pausevalue, correctangle, wrongangle, err, errorcorrected) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
						[data.pid[i], data.blockno[i], data.coordx[i], data.coordy[i], data.coordt[i], data.realpointid[i], data.realpointx[i], data.realpointy[i], data.fakepointid[i], data.fakepointx[i], data.fakepointy[i], data.speed[i], data.pause[i], data.correctangle[i], data.wrongangle[i], data.error[i], data.errorcorrected[i]]
					);
				}

				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('Data successfully submitted');
			} catch (error) {
				console.error(error.stack);
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('500 Internal Server Error');
			}
		});
	} else if (req.method === 'POST' && pathname === '/submitmaxspeeddata') {
		let body = '';

		req.on('data', chunk => {
			body += chunk.toString();
		});

		req.on('end', async () => {
			try {
				const data = JSON.parse(body);


				// Insert data into the database
				for (let i = 0; i < data.coordx.length; i++) {
					await pgClient.query(
						'INSERT INTO max_speed (pid, coordx, coordy, coordt) VALUES ($1, $2, $3, $4)',
						[data.pid[i], data.coordx[i], data.coordy[i], data.coordt[i]]
					);
				}

				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end('Data successfully submitted');
			} catch (error) {
				console.error(error.stack);
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('500 Internal Server Error');
			}
		});
	}
	else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('404 page not found');
	}
});

server.listen(port, () => {
	//console.log(`Server running at http://${hostname}:${port}/`);
});


