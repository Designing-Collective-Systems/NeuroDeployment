var maxTime = 6;
var secondsLeft = maxTime;
var touchStarted = 0;
var touchCount = 0;
let xCoord;
let yCoord;
var totalDistance = 0;
var maxDistance = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
var maxAccuracy = 0;
var minAccuracy = 100;
var totalAccuracy = 0;
var maxPhases = 15;
var numberOfPhases = maxPhases;
const results = [];
var centerTouchX = 0.5 * window.innerWidth;
var centerTouchY = 0.5 * window.innerHeight;
var resultText = "";
var currentPhase = ["Full Screen 1: ", "Full Screen 2: ", "Full Screen 3: ", "Big Dot 1: ", "Big Dot 2: ", "Big Dot 3: ",
    "Big Dot 4: ", "Small Dot 1: ", "Small Dot 2: ", "Small Dot 3: ", "Small Dot 4: ", "Tiny Dot 1: ",
    "Tiny Dot 2: ", "Tiny Dot 3: ", "Tiny Dot 4: "];

// Function to calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
    var dx = x2 - x1 / 2;
    var dy = y2 - y1 / 2;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateAccuracy(tapDistance) {
    var acc = (maxDistance - tapDistance) / maxDistance;
    return acc * 100;
}

function defineElements() {
    document.getElementById("touchSpace").ontouchstart = function (e) {
        touchStarted = touchStarted + 1;
    };

    document.getElementById("touchSpace").ontouchend = function (e) {
        if (touchStarted > 0) {
            touchStarted = touchStarted - 1;
            touchCount = touchCount + 1;
            document.getElementById("count").innerHTML = touchCount;
            xCoord = e.changedTouches[0].pageX;
            yCoord = e.changedTouches[0].pageY;
            tapDistance = calculateDistance(window.innerWidth, window.innerHeight, xCoord, yCoord);
            totalDistance = totalDistance + tapDistance;
            tapAccuracy = calculateAccuracy(tapDistance);
            totalAccuracy = totalAccuracy + tapAccuracy;
            if (tapAccuracy > maxAccuracy) {
                maxAccuracy = tapAccuracy;
            }
            if (tapAccuracy < minAccuracy) {
                minAccuracy = tapAccuracy;
            }
        }
    };
}

function storeResults() {
    var averageAccuracy = totalAccuracy / touchCount;
    if (minAccuracy > maxAccuracy) {
        minAccuracy = 0;
    }
    results[maxPhases - numberOfPhases - 1] = [touchCount, Math.round(maxAccuracy * 10000) / 10000, Math.round(minAccuracy * 10000) / 10000, Math.round(averageAccuracy * 10000) / 10000,]
    resultText = resultText + "<br />" + currentPhase[maxPhases - numberOfPhases - 1] + touchCount.toString();
}

function resartPhase() {
    secondsLeft = maxTime;
    touchStarted = 0;
    touchCount = 0;
    totalDistance = 0;
    maxAccuracy = 0;
    minAccuracy = 100;
    totalAccuracy = 0;
    document.getElementById("count").innerHTML = 0;
    document.getElementById("resultPanel").style.visibility = "hidden";
    secondsLeft = maxTime;
}

function displayResults() {
    document.getElementById("touchSpace").ontouchstart = null;
    document.getElementById("touchSpace").ontouchend = null;
    document.getElementById("touchSpace").onmousedown = null;
    document.getElementById("touchSpace").onmouseup = null;
    document.getElementById("resultPanel").style.visibility = "visible";
    //document.getElementById("resultsText").innerHTML = "<br />Total number of taps: " + touchCount + "<br />Highest tap accuracy: " + Math.round(maxAccuracy * 10000) / 10000 + "<br />Lowest tap accuracy: " + Math.round(minAccuracy * 10000) / 10000 + "<br />Average tap accuracy: " + Math.round(averageAccuracy * 10000) / 10000;
    //document.getElementById("resultsText").innerHTML = "<br />T1.1: " + results[0][0] + "<br />T1.2: " + results[1][0] + "<br />T1.3: " + results[2][0] + "<br />T2: " + results[3][0] + "<br />T3: " + results[4][0] + "<br />T4: " + results[5][0];
    document.getElementById("resultsText").innerHTML = resultText;
    document.getElementById("restart").onclick = function (e) {
        numberOfPhases = maxPhases;
        document.getElementById("touchSpace").style.width = "100%";
        document.getElementById("touchSpace").style.height = "100%";
        document.getElementById("touchSpace").style.borderRadius = "0%";
        resultText = "";
        resartPhase();
    }
}

function changePosition() {
    maxTime = 2;
    newWidth = Math.random() * (85 - 15) + 15;
    newHeight = Math.random() * (85 - 15) + 15;
    centerTouchX = newWidth * window.innerWidth;
    centerTouchY = newHeight * window.innerHeight;
    document.getElementById("touchSpace").style.top = newHeight.toString() + "%";
    document.getElementById("touchSpace").style.left = newWidth.toString() + "%";
}

function resetPosition() {
    maxTime = 6;
    document.getElementById("touchSpace").style.top = "50%";
    document.getElementById("touchSpace").style.left = "50%";
}

function timerFunction() {
    if (secondsLeft === maxTime) {
        defineElements();
    }
    if (secondsLeft === 0) {
        document.getElementById("timer").innerHTML = secondsLeft + "s";
        clearInterval(timer);
        numberOfPhases = numberOfPhases - 1;
        storeResults();
        resetPosition();
        if (numberOfPhases === 0) {
            displayResults();
        }
        // big circle - multi finger
        if (numberOfPhases === maxPhases - 3) {
            document.getElementById("touchSpace").style.width = "1.25in";
            document.getElementById("touchSpace").style.height = "1.25in";
            document.getElementById("touchSpace").style.borderRadius = "50%";
            resartPhase();
        }
        // big moving circle - multi finger
        if (numberOfPhases <= maxPhases - 4 && numberOfPhases >= maxPhases - 6) {
            changePosition();
            resartPhase();
        }

        // small circle - finger size
        if (numberOfPhases === maxPhases - 7) {
            document.getElementById("touchSpace").style.width = "0.7in";
            document.getElementById("touchSpace").style.height = "0.7in";
            document.getElementById("touchSpace").style.borderRadius = "50%";
            resartPhase();
        }
        // small moving circle - multi finger
        if (numberOfPhases <= maxPhases - 8 && numberOfPhases >= maxPhases - 10) {
            changePosition();
            resartPhase();
        }

        // tiny circle - half finger size
        if (numberOfPhases === maxPhases - 11) {
            document.getElementById("touchSpace").style.width = "0.35in";
            document.getElementById("touchSpace").style.height = "0.35in";
            document.getElementById("touchSpace").style.borderRadius = "50%";
            resartPhase();
        }
        // tiny moving circle - multi finger
        if (numberOfPhases <= maxPhases - 12 && numberOfPhases >= maxPhases - 14) {
            changePosition();
            resartPhase();
        }

        if (numberOfPhases >= maxPhases - 2) {
            resartPhase();
        }

    }
    else {
        document.getElementById("timer").innerHTML = secondsLeft + "s";
        secondsLeft--;
    }
}

document.getElementById("start").onclick = function (e) {
    document.getElementById("infoPanel").style.visibility = "hidden";
    document.getElementById("touchBackground").style.visibility = "visible";
    const timer = setInterval(timerFunction, 1000);
}
