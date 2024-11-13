//'use strict';

let startTime; // beginning of first touch

let pid;
let blockno;
let trialno = -1;

let start = 0;

const circleRadius = 40;
const minAngle = 30;

let middlex = (window.innerWidth / 2) - circleRadius;
let middley = (window.innerHeight / 4) + (window.innerHeight / 2) - circleRadius;

const blockLimit = 4;
const trialLimit = 5 * 2;

const checkpointStart = document.getElementById('checkpoint1');
const checkpointFinal = document.getElementById('checkpointE');
const checkpointPairsLabel = [['A', '2'], ['2', 'B'], ['B', '3'], ['3', 'C'], ['C', '4'], ['4', 'D'], ['D', '5'], ['5', 'E'], ['E', '6'], ['6', 'F'], ['F', '7'], ['7', 'G'],
['G', '8'], ['8', 'H'], ['H', '9'], ['9', 'I'], ['I', '10'], ['10', 'J'], ['J', '11'], ['11', 'K'], ['K', '12'], ['12', 'L'], ['L', '13'], ['13', 'M'], ['M', '14'], ['14', 'N'],
['N', '15'], ['15', 'O'], ['O', '16'], ['16', 'P'], ['P', '17'], ['17', 'Q'], ['Q', '18'], ['18', 'R'], ['R', '19'], ['19', 'S'], ['S', '20'], ['20', 'T'], ['T', '21'], ['21', 'U'],
['U', '22'], ['22', 'V'], ['V', '23'], ['23', 'W'], ['W', '24'], ['24', 'X'], ['X', '25'], ['25', 'Y'], ['Y', '26'], ['26', 'Z'], ['Z', '27']];
let checkpointPairsCoords = []
let error = false; // if in error state
// this is an array of arrays of coordinates.
const coords = [];
//let blockno = 1;

const getIDBlock = async function () {
    const response = await fetch('/calculateResult');
    const data = await response.json(); // Correct way to parse JSON
    return data;
}

//console.log(pid);
//console.log(blockno);
let end = 0;

function currentTime() {
    return Date.now() - startTime;
}


function placePoints(i) {
    let x1 = 0; // Real node x
    let y1 = 0; // Real node y
    let x2 = 0; // Fake node x
    let y2 = 0; // Fake node y

    // Get window dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Define fixed relative positions for real and fake nodes in opposite corners/sides
    const fixedRelativePositions = [
        [[10, 70], [30, 10]],     // M
        [[70, 10], [60, 50]],     // 14
        [[20, 70], [75, 30]],     // N
        [[50, 70], [30, 20]],     // 15
        [[10, 10], [60, 30]],     // O
        [[70, 40], [20, 70]],     // 16
        [[10, 70], [30, 10]],     // P
        [[70, 10], [60, 50]],     // 17
        [[20, 30], [50, 30]],     // Q
        [[60, 10], [10, 50]],     // 18
        [[10, 70], [30, 10]],     // R
        [[70, 10], [60, 50]],     // 19
        [[10, 10], [60, 30]],     // S
        [[70, 60], [55, 20]],     // 20
        [[10, 75], [70, 30]],     // T
        [[60, 10], [10, 50]],
        [[10, 10], [60, 30]],     // Real: A, Fake: 2
        [[70, 60], [55, 20]],     // Real: 2, Fake: B
        [[10, 75], [70, 30]],     // B
        [[20, 30], [50, 30]],     // 3
        [[70, 40], [20, 70]],     // C
        [[60, 10], [10, 50]],     // 4
        [[10, 70], [30, 10]],     // Real: D, Fake: 5
        [[70, 10], [60, 50]],     // 5
        [[20, 70], [75, 30]],     // E
        [[50, 70], [30, 20]],     // 6
        [[10, 10], [60, 30]],     // F
        [[70, 40], [20, 70]],     // 7
        [[10, 70], [30, 10]],     // G
        [[70, 10], [60, 50]],     // 8
        [[20, 30], [50, 30]],     // H
        [[60, 10], [10, 50]],     // 9
        [[10, 70], [30, 10]],     // I
        [[70, 10], [60, 50]],     // 10
        [[10, 10], [60, 30]],     // J
        [[70, 60], [55, 20]],     // 11
        [[10, 75], [70, 30]],     // K
        [[20, 30], [50, 30]],     // 12
        [[70, 40], [20, 70]],     // L
        [[60, 10], [10, 50]],     // 13    // 21
        [[10, 10], [60, 30]],     // U
        [[70, 60], [55, 20]],     // 22
        [[10, 75], [70, 30]],     // V
        [[20, 30], [50, 30]],     // 23
        [[70, 40], [20, 70]],     // W
        [[60, 10], [10, 50]],     // 24
        [[10, 70], [30, 10]],     // X
        [[70, 10], [60, 50]],     // 25
        [[10, 10], [60, 30]],     // Y
        [[70, 60], [55, 20]],     // 26
        [[10, 75], [70, 30]],     // Z
        [[60, 10], [10, 50]],     // 27
    ];

    // Use the fixed positions based on the iteration, scale them to the current screen size
    if (i < fixedRelativePositions.length) {
        // Scale percentages to actual pixel coordinates for real node
        x1 = (fixedRelativePositions[i][0][0] / 100) * screenWidth;
        y1 = (fixedRelativePositions[i][0][1] / 100) * screenHeight;

        // Scale percentages to actual pixel coordinates for fake node
        x2 = (fixedRelativePositions[i][1][0] / 100) * screenWidth;
        y2 = (fixedRelativePositions[i][1][1] / 100) * screenHeight;
        checkpointPairsCoords.push([[x1, y1], [x2, y2]]);
    } else {
        // console.error("No more fixed positions available for iteration: " + i);
    }
}


function endblock() {
    console.log("endblock");
    var data = { // create data object
        pid: [],
        blockno: [],
        coordx: [],
        coordy: [],
        coordt: [],
        realpointid: [],
        realpointx: [],
        realpointy: [],
        fakepointid: [],
        fakepointx: [],
        fakepointy: [],
        speed: [],
        pause: [],
        correctangle: [],
        wrongangle: [],
        error: [],
        errorcorrected: [],
    };
    blockno = blockno + 1;
    console.log(blockno);
    for (const coord of coords) { // add coords to data object
        data.pid.push(pid);
        data.blockno.push(blockno);
        data.coordx.push(Math.round(coord[0]));
        data.coordy.push(Math.round(coord[1]));
        data.coordt.push(coord[2]);
        data.realpointid.push(coord[3]);
        data.realpointx.push(coord[4]);
        data.realpointy.push(coord[5]);
        data.fakepointid.push(coord[6]);
        data.fakepointx.push(coord[7]);
        data.fakepointy.push(coord[8]);
    }

    //console.log(coords);

    data = calculate_measures(coords, data);


    //console.log(data); // TODO log data (debugging, remove later)

    fetch("/submitdata", { // send data to server
        method: "POST",
        headers: {
            "Content-Type": "application/json", // as json
        },
        body: JSON.stringify(data), // body is stringified json
    });
    if (blockno >= blockLimit) {
        document.getElementById("resultsModal").style.display = 'block';
    }
    else {
        document.getElementById("restartsModal").style.display = 'block';
    }
}

function placeChecks() {
    document.getElementById('real').style.left = `${checkpointPairsCoords[trialno][0][0]}px`;
    document.getElementById('real').style.top = `${checkpointPairsCoords[trialno][0][1]}px`;
    document.getElementById("realText").innerHTML = checkpointPairsLabel[trialno][0];

    document.getElementById('fake').style.left = `${checkpointPairsCoords[trialno][1][0]}px`;
    document.getElementById('fake').style.top = `${checkpointPairsCoords[trialno][1][1]}px`;
    document.getElementById("fakeText").innerHTML = checkpointPairsLabel[trialno][1];
}

getIDBlock().then(data => {
    console.log(data); // Logs the data after the promise is resolved
    console.log(Date.now());
    pid = data.pid;
    blockno = data.blockno;

    if (blockno >= blockLimit) {
        pid = pid + 1;
        blockno = 0;
    }

    for (let i = 0; i < 52; i++) {
        placePoints(i); // this generates the locations of all of the points ahead of time
    }
    document.getElementById('origin').style.left = `${middlex}px`;
    document.getElementById('origin').style.top = `${middley}px`;
    document.getElementById('origin').style.display = 'flex';

    // At the touch start
    document.addEventListener("touchstart", e => {
        if (coords.length == 0) {
            startTime = Date.now(); // if first touch, set startTime
        }

        // add point to coords
        const touch = e.changedTouches[0];

        if (document.elementsFromPoint(touch.pageX, touch.pageY).includes(document.getElementById('origin'))) {
            trialno++;
            placeChecks();
            document.getElementById('real').style.display = 'flex';
            document.getElementById('fake').style.display = 'flex';

            const pointer = document.getElementById('pointer')
            pointer.style.display = 'flex';
            pointer.style.top = `${touch.pageY}px`
            pointer.style.left = `${touch.pageX}px`
            pointer.id = "pointer"

            if (error) {
                error = false;
            }
            coords.push([touch.screenX, touch.screenY, currentTime(), checkpointPairsLabel[trialno][0], checkpointPairsCoords[trialno][0][0], checkpointPairsCoords[trialno][0][1],
            checkpointPairsLabel[trialno][1], checkpointPairsCoords[trialno][1][0], checkpointPairsCoords[trialno][1][1]]);
            start = 1;
        }
    });

    document.addEventListener("touchmove", e => {
        const touch = e.changedTouches[0];

        const pointer = document.getElementById('pointer')
        pointer.style.top = `${touch.pageY}px`
        pointer.style.left = `${touch.pageX}px`

        // Advance trialno if on correct point, show error message if not
        if (!error && document.elementsFromPoint(touch.pageX, touch.pageY).includes(document.getElementById('real'))) {

            coords.push([touch.screenX, touch.screenY, currentTime(), checkpointPairsLabel[trialno][0], checkpointPairsCoords[trialno][0][0], checkpointPairsCoords[trialno][0][1],
            checkpointPairsLabel[trialno][1], checkpointPairsCoords[trialno][1][0], checkpointPairsCoords[trialno][1][1]]);

            trialno++;
            document.getElementById('origin').style.left = document.getElementById('real').style.left;
            document.getElementById('origin').style.top = document.getElementById('real').style.top;
            document.getElementById("originText").innerHTML = checkpointPairsLabel[trialno - 1][0];
            placeChecks();

            if (end === 0 && trialno === trialLimit) {
                end = 1;
                endblock();
            }

        } else if (!error && document.elementsFromPoint(touch.pageX, touch.pageY).includes(document.getElementById('fake'))) {
            coords.push([-2, -2, currentTime(), checkpointPairsLabel[trialno][0], checkpointPairsCoords[trialno][0][0], checkpointPairsCoords[trialno][0][1],
            checkpointPairsLabel[trialno][1], checkpointPairsCoords[trialno][1][0], checkpointPairsCoords[trialno][1][1]]);

            document.getElementById("errorModal").style.display = 'block'; // show error modal
            document.getElementById('real').style.display = 'none';
            document.getElementById('fake').style.display = 'none';
            trialno--; // force user to go back
            error = true; // set error state
            start = 0;
        }
        else {
            if (!error) {
                coords.push([touch.screenX, touch.screenY, currentTime(), checkpointPairsLabel[trialno][0], checkpointPairsCoords[trialno][0][0], checkpointPairsCoords[trialno][0][1],
                checkpointPairsLabel[trialno][1], checkpointPairsCoords[trialno][1][0], checkpointPairsCoords[trialno][1][1]]);
            }
        }
    });

    document.addEventListener("touchend", e => {
        // add point to coords
        const touch = e.changedTouches[0];

        const pointer = document.getElementById('pointer');
        pointer.style.display = 'none';

        //console.log(currentTime());

        if (end === 0 && document.elementsFromPoint(touch.pageX, touch.pageY).includes(document.getElementById('real')) && trialno === trialLimit) { // if at final point, submit data
            end = 1;
            endblock();
        }
        else {
            if (!error && end === 0 && start === 1) {

                coords.push([-1, -1, currentTime(), checkpointPairsLabel[trialno][0], checkpointPairsCoords[trialno][0][0], checkpointPairsCoords[trialno][0][1],
                checkpointPairsLabel[trialno][1], checkpointPairsCoords[trialno][1][0], checkpointPairsCoords[trialno][1][1]]);

                document.getElementById("liftModal").style.display = 'block'; // show error modal
                document.getElementById('real').style.display = 'none';
                document.getElementById('fake').style.display = 'none';

                trialno--; // force user to go back
                error = true; // set error state
                start = 0;
            }
        }
    });
});

function closeErrorModal() {
    document.getElementById("errorModal").style.display = 'none';
    document.getElementById("liftModal").style.display = 'none';
}

function closeResultsModal() {
    document.getElementById("resultsModal").style.display = 'none';
    window.location.replace("/maxspeedinstruction");

}

function closeRestartModal() {
    document.getElementById("restartsModal").style.display = 'none';
    window.location.reload();
}
