const pgClient = require('../db');  

exports.getLatestResult = async (req, res) => {
    try {
        const resp = await pgClient.query('SELECT * FROM test_results ORDER BY id DESC LIMIT 1');

        if (resp.rows.length === 0) {
           
            return res.status(404).json({ msg: 'No test results found' });
        }

        const obj = {
            participantid: resp.rows[0].participantid,  
            blockno: resp.rows[0].blockno,
        };
        res.json(obj);
    } catch (error) {
        console.error('Error retrieving test results:', error);
        res.status(500).json({ msg: 'Error retrieving test results' });
    }
};




exports.submitResult = async (req, res) => {
    try {
        const data = req.body; 
        console.log("Received data:", data);

        for (let i = 0; i < data.coordx.length; i++) {
            console.log("Inserting participant ID:", data.participantid); 
            // await pgClient.query(
            //     'INSERT INTO test_results (participantid, blockno, coordx, coordy, coordt, realpointid, realpointx, realpointy, fakepointid, fakepointx, fakepointy, speed, pausevalue, correctangle, wrongangle, err, errorcorrected) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
            //     [data.participantid[i], data.blockno[i], data.coordx[i], data.coordy[i], data.coordt[i], data.realpointid[i], data.realpointx[i], data.realpointy[i], data.fakepointid[i], data.fakepointx[i], data.fakepointy[i], data.speed[i], data.pause[i], data.correctangle[i], data.wrongangle[i], data.error[i], data.errorcorrected[i]]
            // );
            await pgClient.query(
                'INSERT INTO test_results (participantid, blockno, coordx, coordy, coordt, realpointid, realpointx, realpointy, fakepointid, fakepointx, fakepointy, speed, pausevalue, correctangle, wrongangle, err, errorcorrected) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
                [
                    data.participantid, 
                    data.blockno[i],
                    data.coordx[i],
                    data.coordy[i],
                    data.coordt[i],
                    data.realpointid[i],
                    data.realpointx[i],
                    data.realpointy[i],
                    data.fakepointid[i],
                    data.fakepointx[i],
                    data.fakepointy[i],
                    data.speed[i],
                    data.pause[i],
                    data.correctangle[i],
                    data.wrongangle[i],
                    data.error[i],
                    data.errorcorrected[i]
                ]
            );
            // console.log("Inserted row:", result.rows[0]); 
            
        }

        res.status(200).json({ msg: 'Data successfully submitted' });
    } catch (error) {
        console.error('Error submitting data:', error);
        res.status(500).json({ msg: '500 Internal Server Error' });
    }
};
