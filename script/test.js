'use strict';

// Global variables
let virtualScreen;

// Timing
let startTime; // beginning of first touch

// Participant information
let pid;
let blockno;
let trialno = -1;

// Control variables
let start = 0;

// Base dimensions (Phone)
const BASE_WIDTH = 384;
const BASE_HEIGHT = 726;

// Current device dimensions
const deviceWidth = window.innerWidth;
const deviceHeight = window.innerHeight;

// Detect if the device is an iPad (assuming iPad has larger width than BASE_WIDTH)
const isIpad = deviceWidth > BASE_WIDTH;

// Calculate offset for virtual screen on iPad
let offsetX = 0;
let offsetY = 0;

if (isIpad) {
    offsetX = (deviceWidth - BASE_WIDTH) / 2;
    offsetY = (deviceHeight - BASE_HEIGHT) / 2;
}

// Circle radius in pixels (fixed)
const circleRadius = 40; // Node radius of 40 pixels (80 pixels diameter)

// Middle positions
let middlex = (BASE_WIDTH / 2) - circleRadius;
let middley = (BASE_HEIGHT / 2) - circleRadius;

// Block and trial limits
const blockLimit = 4;

// Define fixed relative positions for all checkpoints (9 entries)
const fixedRelativePositions = [
    [[10, 10], [60, 30]],     // Real: A, Fake: 2
    [[70, 60], [55, 20]],     // Real: 2, Fake: B
    [[10, 75], [70, 30]],     // Real: B, Fake: 3
    [[20, 30], [50, 30]],     // Real: 3, Fake: C
    [[70, 40], [20, 70]],     // Real: C, Fake: 4
    [[60, 10], [10, 50]],     // Real: 4, Fake: D
    [[10, 70], [30, 10]],     // Real: D, Fake: 5
    [[70, 10], [60, 50]],     // Real: 5, Fake: E
    [[20, 70], [75, 30]],      // Real: E, Fake: 6
    [[70, 10], [10, 50]]      // Real: 6, Fake: F
];

// Set trialLimit to match fixedRelativePositions length
const trialLimit = fixedRelativePositions.length;

// Define checkpoint pairs labels (9 entries)
const checkpointPairsLabel = [
    ['A', '2'],
    ['2', 'B'],
    ['B', '3'],
    ['3', 'C'],
    ['C', '4'],
    ['4', 'D'],
    ['D', '5'],
    ['5', 'E'],
    ['E', '6'],
    ['6', 'F'],
];

let checkpointPairsCoords = [];
let error = false; // if in error state

const coords = [];

// Fetch participant ID and block number
const getIDBlock = async function () {
    try {
        const response = await fetch('/calculateResult');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Correct way to parse JSON
        return data;
    } catch (error) {
        console.error('Error fetching ID and block:', error);
        // Handle the error appropriately, possibly by setting default values or notifying the user
        return { pid: 1, blockno: 0 }; // Example default values

    }
}

let end = 10;

// Function to get current time since start
function currentTime() {
    return Date.now() - startTime;
}

// Function to place points based on fixedRelativePositions
function placePoints(i) {
    let x1 = 0; // Real node x
    let y1 = 0; // Real node y
    let x2 = 0; // Fake node x
    let y2 = 0; // Fake node y

    // Use the fixed positions based on the iteration, scale them to the base dimensions
    if (i < fixedRelativePositions.length) {
        const realPos = fixedRelativePositions[i][0];
        const fakePos = fixedRelativePositions[i][1];

        // Scale percentages to actual pixel coordinates for real node
        x1 = (realPos[0] / 100) * BASE_WIDTH;
        y1 = (realPos[1] / 100) * BASE_HEIGHT;

        // Scale percentages to actual pixel coordinates for fake node
        x2 = (fakePos[0] / 100) * BASE_WIDTH;
        y2 = (fakePos[1] / 100) * BASE_HEIGHT;

        checkpointPairsCoords.push([[x1, y1], [x2, y2]]);
    } else {
        console.error("No more fixed positions available for iteration: " + i);
    }
}

// Function to end the block and submit data
function endblock() {
    console.log("endblock");
    // **these lines to remove touch event listeners**
    virtualScreen.removeEventListener("touchstart", touchStartHandler);
    virtualScreen.removeEventListener("touchmove", touchMoveHandler);
    virtualScreen.removeEventListener("touchend", touchEndHandler);
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

    // Process the data if needed
    if (typeof calculate_measures === 'function') {
        data = calculate_measures(coords, data);
    } else {
        console.warn('calculate_measures function is not defined.');
    }

    fetch("/submitdata", { // send data to server
        method: "POST",
        headers: {
            "Content-Type": "application/json", // as json
        },
        body: JSON.stringify(data), // body is stringified json
    }).then(response => {
        if (response.ok) {
            console.log("Data submitted successfully");
        } else {
            console.error("Data submission failed with status:", response.status);
        }
    }).catch(error => {
        console.error("Error submitting data:", error);
    });

    if (blockno === blockLimit) {
        document.getElementById("resultsModal").style.display = 'block';
    }
    else {
        document.getElementById("restartsModal").style.display = 'block';
    }
}

// Function to place checks (real and fake nodes)
function placeChecks() {
    if (trialno >= 0 && trialno < checkpointPairsCoords.length) {
        const realX = checkpointPairsCoords[trialno][0][0];
        const realY = checkpointPairsCoords[trialno][0][1];
        const fakeX = checkpointPairsCoords[trialno][1][0];
        const fakeY = checkpointPairsCoords[trialno][1][1];

        const realNode = document.getElementById('real');
        const fakeNode = document.getElementById('fake');

        realNode.style.left = `${realX}px`;
        realNode.style.top = `${realY}px`;
        document.getElementById("realText").innerHTML = checkpointPairsLabel[trialno][0];

        fakeNode.style.left = `${fakeX}px`;
        fakeNode.style.top = `${fakeY}px`;
        document.getElementById("fakeText").innerHTML = checkpointPairsLabel[trialno][1];
    }
}

// Initialize the app
getIDBlock().then(data => {
    console.log(data); // Logs the data after the promise is resolved
    pid = data.pid;
    blockno = data.blockno;

    if (blockno === blockLimit) {
        pid = pid + 1;
        blockno = 0;
    }

    for (let i = 0; i < checkpointPairsLabel.length; i++) {
        placePoints(i); // this generates the locations of all of the points ahead of time
    }

    // Set up virtualScreen
    virtualScreen = document.getElementById('virtualScreen');

    virtualScreen.style.position = 'absolute';
    virtualScreen.style.width = `${BASE_WIDTH}px`;
    virtualScreen.style.height = `${BASE_HEIGHT}px`;

    virtualScreen.style.left = `${offsetX}px`;
    virtualScreen.style.top = `${offsetY}px`;
    virtualScreen.style.border = `2px black solid`;

    // Place 'origin' within virtualScreen
    const origin = document.getElementById('origin');
    origin.style.left = `${middlex}px`;
    origin.style.top = `${middley}px`;
    origin.style.width = `${circleRadius * 2}px`;
    origin.style.height = `${circleRadius * 2}px`;
    origin.style.borderRadius = '50%';
    origin.style.display = 'flex';

    // Set sizes for 'real' and 'fake' nodes
    const realNode = document.getElementById('real');
    const fakeNode = document.getElementById('fake');

    realNode.style.width = `${circleRadius * 2}px`;
    realNode.style.height = `${circleRadius * 2}px`;
    realNode.style.borderRadius = '50%';

    fakeNode.style.width = `${circleRadius * 2}px`;
    fakeNode.style.height = `${circleRadius * 2}px`;
    fakeNode.style.borderRadius = '50%';

    // Hide real and fake nodes initially
    realNode.style.display = 'none';
    fakeNode.style.display = 'none';

    // Attach touch event handlers to virtualScreen
    virtualScreen.addEventListener("touchstart", touchStartHandler);
    virtualScreen.addEventListener("touchmove", touchMoveHandler);
    virtualScreen.addEventListener("touchend", touchEndHandler);
});

// Function to get virtual coordinates within virtualScreen
function getVirtualCoordinates(touch) {
    const rect = virtualScreen.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    return { x, y };
}

// Touch start handler
function touchStartHandler(e) {
    if (coords.length === 0) {
        startTime = Date.now(); // if first touch, set startTime
    }

    const touch = e.changedTouches[0];
    const virtualCoords = getVirtualCoordinates(touch);

    const elementsAtTouch = document.elementsFromPoint(touch.clientX, touch.clientY);

    if (elementsAtTouch.includes(document.getElementById('origin'))) {
        // Proceed as before
        trialno++;
        if (trialno >= trialLimit) {
            trialno = trialLimit - 1;
        }
        placeChecks();
        document.getElementById('real').style.display = 'flex';
        document.getElementById('fake').style.display = 'flex';
        if (error) {
            error = false;
        }
        coords.push([
            virtualCoords.x, virtualCoords.y, currentTime(),
            checkpointPairsLabel[trialno][0],
            checkpointPairsCoords[trialno][0][0],
            checkpointPairsCoords[trialno][0][1],
            checkpointPairsLabel[trialno][1],
            checkpointPairsCoords[trialno][1][0],
            checkpointPairsCoords[trialno][1][1]
        ]);
        start = 1;
    }
}

// Touch move handler
function touchMoveHandler(e) {
    const touch = e.changedTouches[0];
    const virtualCoords = getVirtualCoordinates(touch);

    const elementsAtTouch = document.elementsFromPoint(touch.clientX, touch.clientY);

    if (trialno >= 0 && trialno < trialLimit) {
        // Advance trialno if on correct point, show error message if not
        if (!error && elementsAtTouch.includes(document.getElementById('real'))) {

            coords.push([
                virtualCoords.x, virtualCoords.y, currentTime(),
                checkpointPairsLabel[trialno][0],
                checkpointPairsCoords[trialno][0][0],
                checkpointPairsCoords[trialno][0][1],
                checkpointPairsLabel[trialno][1],
                checkpointPairsCoords[trialno][1][0],
                checkpointPairsCoords[trialno][1][1]
            ]);

            trialno++;
            end--;
            if (trialno >= trialLimit) {
                trialno = trialLimit - 1;
            } else {
                document.getElementById('origin').style.left = document.getElementById('real').style.left;
                document.getElementById('origin').style.top = document.getElementById('real').style.top;
                document.getElementById("originText").innerHTML = checkpointPairsLabel[trialno - 1][0];
                placeChecks();
            }

            // Check if the last node is reached
            if (end === 0 && trialno === trialLimit - 1) { // Adjust condition to trialLimit -1
                end = 10;
                endblock();
            }

        } else if (!error && elementsAtTouch.includes(document.getElementById('fake'))) {
            coords.push([
                -2, -2, currentTime(),
                checkpointPairsLabel[trialno][0],
                checkpointPairsCoords[trialno][0][0],
                checkpointPairsCoords[trialno][0][1],
                checkpointPairsLabel[trialno][1],
                checkpointPairsCoords[trialno][1][0],
                checkpointPairsCoords[trialno][1][1]
            ]);

            document.getElementById("errorModal").style.display = 'block'; // show error modal
            document.getElementById('real').style.display = 'none';
            document.getElementById('fake').style.display = 'none';
            trialno = Math.max(trialno - 1, 0); // ensure trialno does not go below 0
            error = true; // set error state
            start = 0;
        }
        else {
            if (!error) {
                coords.push([
                    virtualCoords.x, virtualCoords.y, currentTime(),
                    checkpointPairsLabel[trialno][0],
                    checkpointPairsCoords[trialno][0][0],
                    checkpointPairsCoords[trialno][0][1],
                    checkpointPairsLabel[trialno][1],
                    checkpointPairsCoords[trialno][1][0],
                    checkpointPairsCoords[trialno][1][1]
                ]);
            }
        }
    }
}

// Touch end handler
function touchEndHandler(e) {
    const touch = e.changedTouches[0];
    const virtualCoords = getVirtualCoordinates(touch);
    const elementsAtTouch = document.elementsFromPoint(touch.clientX, touch.clientY);

    if (end === 0 && elementsAtTouch.includes(document.getElementById('real')) && trialno === trialLimit - 1) { // if at final point, submit data
        end = 10;
        endblock();
    }
    else {
        if (!error && end === 0 && start === 1) {

            coords.push([
                -1, -1, currentTime(),
                checkpointPairsLabel[trialno][0],
                checkpointPairsCoords[trialno][0][0],
                checkpointPairsCoords[trialno][0][1],
                checkpointPairsLabel[trialno][1],
                checkpointPairsCoords[trialno][1][0],
                checkpointPairsCoords[trialno][1][1]
            ]);

            document.getElementById("liftModal").style.display = 'block'; // show lift modal
            document.getElementById('real').style.display = 'none';
            document.getElementById('fake').style.display = 'none';

            trialno = Math.max(trialno - 1, 0); // ensure trialno does not go below 0
            error = true; // set error state
            start = 0;
        }
    }
}

// Functions to close modals
function closeErrorModal() {
    document.getElementById("errorModal").style.display = 'none';
    document.getElementById("liftModal").style.display = 'none';
}

function closeResultsModal() {
    document.getElementById("resultsModal").style.display = 'none';
    window.location.replace("/thanks");
}

function closeRestartModal() {
    document.getElementById("restartsModal").style.display = 'none';
    window.location.reload();
}
