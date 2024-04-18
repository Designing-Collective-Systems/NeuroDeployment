var maxTime = 10;
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
    /*
    document.getElementById("touchSpace").onmousedown = function (e) {
        touchStarted = touchStarted + 1;
    };
    */
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
    /*
    document.getElementById("touchSpace").onmouseup = function (e) {
        if (touchStarted > 0) {
            touchStarted = touchStarted - 1;
            touchCount = touchCount + 1;
            document.getElementById("count").innerHTML = touchCount;
            xCoord = e.pageX;
            yCoord = e.pageY;
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
    */
}

function timerFunction() {
    if (secondsLeft === maxTime) {
        defineElements();
    }
    if (secondsLeft === -1) {
        clearInterval(timer);
        document.getElementById("touchSpace").ontouchstart = null;
        document.getElementById("touchSpace").ontouchend = null;
        document.getElementById("touchSpace").onmousedown = null;
        document.getElementById("touchSpace").onmouseup = null;
        document.getElementById("resultPanel").style.visibility = "visible";
        var averageAccuracy = totalAccuracy / touchCount;
        document.getElementById("resultsText").innerHTML = "<br />Total number of taps: " + touchCount + "<br />Highest tap accuracy: " + Math.round(maxAccuracy * 10000) / 10000 + "<br />Lowest tap accuracy: " + Math.round(minAccuracy * 10000) / 10000 + "<br />Average tap accuracy: " + Math.round(averageAccuracy * 10000) / 10000;
    }
    else {
        document.getElementById("timer").innerHTML = secondsLeft + "s";
        secondsLeft--;
    }
}

document.getElementById("restart").onclick = function (e) {
    secondsLeft = maxTime;
    touchStarted = 0;
    touchCount = 0;
    totalDistance = 0;
    maxAccuracy = 0;
    minAccuracy = 100;
    totalAccuracy = 0;
    document.getElementById("resultPanel").style.visibility = "hidden";
    secondsLeft = maxTime;
    // defineElements();
    // const timer = setInterval(timerFunction, 1000);
}

document.getElementById("start").onclick = function (e) {
    document.getElementById("infoPanel").style.visibility = "hidden";
    document.getElementById("touchBackground").style.visibility = "visible";
    const timer = setInterval(timerFunction, 1000);
}
