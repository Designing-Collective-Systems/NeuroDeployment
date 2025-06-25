const pgClient = require('../db');

exports.getLatestResult = async (req, res) => {
    const participantId = req.query.participantid;

    try {
        const resp = await pgClient.query(
            'SELECT * FROM test_results WHERE participantid = $1 ORDER BY id DESC LIMIT 1',
            [participantId]
        );

        if (resp.rows.length === 0) {
            return res.status(200).json({ success: false, msg: 'No test results found' });
        }

        const obj = {
            success: true,
            blockno: resp.rows[0].blockno,
        };
        res.json(obj);
    } catch (error) {
        console.error('Error retrieving test results:', error);
        res.status(500).json({ success: false, msg: 'Error retrieving test results' });
    }
};


exports.getParameters = async (req, res) => {
    try {
        const resp = await pgClient.query('SELECT * FROM test_parameters where fixed_or_rand = true and num_blocks = 2 LIMIT 1');

        if (resp.rows.length === 0) {
            return res.status(404).json({ msg: 'No test parameters found' });
        }

        const row = resp.rows[0];

        const obj = {
            fixed_or_rand: row.fixed_or_rand,
            num_blocks: row.num_blocks,
            num_trials: row.num_trials,
            node_radius: row.node_radius,
            min_angle: row.min_angle
        };
        res.json(obj);
    } catch (error) {
        console.error('Error retrieving test parameters:', error);
        res.status(500).json({ msg: 'Error retrieving test parameters' });
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
                    data.participantid[i],
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


exports.submitMaxSpeedResult = async (req, res) => {
    try {
        const data = req.body;
        console.log("Received data:", data);

        for (let i = 0; i < data.coordx.length; i++) {
            await pgClient.query(
                'INSERT INTO max_speed (participantid, coordx, coordy, coordt) VALUES ($1, $2, $3, $4)',
                [
                    data.participantid[i],
                    data.coordx[i],
                    data.coordy[i],
                    data.coordt[i],
                ]
            );
        }

        res.status(200).json({ msg: 'Data successfully submitted' });
    } catch (error) {
        console.error('Error submitting data:', error);
        res.status(500).json({ msg: '500 Internal Server Error' });
    }
};
