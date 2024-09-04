const pgClient = require('../db');  


exports.getLatestResult = async (req, res) => {
    try {
        const resp = await pgClient.query('SELECT * FROM test_results ORDER BY id DESC LIMIT 1');
        const obj = {
            participantID: resp.rows[0].patientid,
            blockno: resp.rows[0].blockno,
        };
        res.json(obj);
    } catch (error) {
        console.error('Error retrieving test results:', error);
        res.status(500).json({ msg: 'Error retrieving test results' });
    }
};


exports.submitResult = async (req, res) => {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            const data = JSON.parse(body);

            for (let i = 0; i < data.coordx.length; i++) {
                await pgClient.query(
                    'INSERT INTO test_results (patientid, blockno, coordx, coordy, coordt, realpointid, realpointx, realpointy, fakepointid, fakepointx, fakepointy, speed, pausevalue, correctangle, wrongangle, err, errorcorrected) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
                    [data.patientid[i], data.blockno[i], data.coordx[i], data.coordy[i], data.coordt[i], data.realpointid[i], data.realpointx[i], data.realpointy[i], data.fakepointid[i], data.fakepointx[i], data.fakepointy[i], data.speed[i], data.pause[i], data.correctangle[i], data.wrongangle[i], data.error[i], data.errorcorrected[i]]
                );
            }

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Data successfully submitted');
        } catch (error) {
            console.error('Error submitting data:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
        }
    });
};
