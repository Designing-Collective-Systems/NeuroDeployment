//'use strict';

let startTime; // beginning of first touch

let participantID;

let start = 0;

let error = false; // if in error state
// this is an array of arrays of coordinates.
const coords = [];

let end = 0;

var intervalId;

function currentTime() {
    return Date.now() - startTime;
}


function endblock() {
    console.log("endblock");
    if (!participantID) {
        alert("Participant ID is missing. Please log in.");
        return;
    }
    var data = { // create data object
        participantid: [],
        coordx: [],
        coordy: [],
        coordt: []
    };
    for (const coord of coords) { // add coords to data object
        data.participantid.push(participantID);
        data.coordx.push(Math.round(coord[0]));
        data.coordy.push(Math.round(coord[1]));
        data.coordt.push(coord[2]);
    }

    fetch("/api/results/submitmaxspeeddata", { // send data to server
        method: "POST",
        headers: {
            "Content-Type": "application/json", // as json
        },
        body: JSON.stringify(data), // body is stringified json
    });

    document.getElementById("resultsModal").style.display = 'block';
}

function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    intervalId = setInterval(function () {
        minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer == -1) {
            endblock();
        }
    }, 1000);
}


participantID = sessionStorage.getItem('participantId');
// participantID = data.participantID;
if (!participantID) {
    alert("Participant ID is missing. Please log in.");
    window.location.replace("/login.html"); // Redirect to login if no participant ID
} else {
    // check this
    document.addEventListener("touchstart", e => {
        if (coords.length == 0) {
            startTime = Date.now(); // if first touch, set startTime
        }

        var maxtimer = 10,
            display = document.querySelector('#time');
        startTimer(maxtimer, display);

        // add point to coords
        const touch = e.changedTouches[0];

        coords.push([touch.screenX, touch.screenY, currentTime()]);
    });

    document.addEventListener("touchmove", e => {
        const touch = e.changedTouches[0];

        coords.push([touch.screenX, touch.screenY, currentTime()]);
    });

    document.addEventListener("touchend", e => {
        // add point to coords
        const touch = e.changedTouches[0];

        //console.log(currentTime());

        coords.push([-1, -1, currentTime()]);
        document.getElementById("liftModal").style.display = 'block'; // show error modal
    });
}



function closeErrorModal() {
    document.getElementById("liftModal").style.display = 'none';
    window.location.reload();
}

function closeResultsModal() {
    document.getElementById("resultsModal").style.display = 'none';
    // window.location.replace("/thanks");
    window.location.replace("/");
}

