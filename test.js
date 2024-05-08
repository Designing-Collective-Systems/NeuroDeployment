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
const results = [];
const distances = [];
var centerTouchX = 0.5 * window.innerWidth;
var centerTouchY = 0.5 * window.innerHeight;
var resultText = "";
var currentPhase = [];
var section = 0;
var block = 0;
var pause = false;
var dropSeconds = 2;

// Function to calculate distance between two points
function calculateDistance(x1, y1, x2, y2) {
    var dx = x2 - x1 / 2;
    var dy = y2 - y1 / 2;
    return Math.sqrt(dx * dx + dy * dy);
}

// Function to calculate accuracy of tap
function calculateAccuracy(tapDistance) {
    var acc = (maxDistance - tapDistance) / maxDistance;
    return acc * 100;
}

// Function to define touch start and touch end functions
function defineElements() {
    document.getElementById("touchSpace").ontouchstart = function (e) {
        if (secondsLeft < maxTime - dropSeconds) {
            touchStarted = touchStarted + 1;
        }
    };

    document.getElementById("touchSpace").ontouchend = function (e) {
        if (touchStarted > 0) {
            touchStarted = touchStarted - 1;
            touchCount = touchCount + 1;
            document.getElementById("count").innerHTML = touchCount;
            xCoord = e.changedTouches[0].pageX;
            yCoord = e.changedTouches[0].pageY;
            tapDistance = calculateDistance(centerTouchX, centerTouchY, xCoord, yCoord);
            distances[touchCount - 1] = tapDistance;
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

// Function to store results after each block
function storeResults() {
    var averageAccuracy = totalAccuracy / touchCount;
    if (minAccuracy > maxAccuracy) {
        minAccuracy = 0;
    }
    results[block - 1] = [touchCount, Math.round(maxAccuracy * 10000) / 10000, Math.round(minAccuracy * 10000) / 10000, Math.round(averageAccuracy * 10000) / 10000,]
    resultText = resultText + "<br />" + currentPhase[block - 1] + touchCount.toString();
}

// Function to reset all variables at start of each new block
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
    pause = false;
}

// Function to continue to next block when button is clicked on
function onClickContinue(infoBlockName) {
    document.getElementById(infoBlockName).style.visibility = "hidden";
    document.getElementById("touchBackground").style.visibility = "visible";
    resartPhase();
}

// Function to define new block based on section/block number - shows info page for each block
function newBlock() {
    pause = true;
    document.getElementById("touchBackground").style.visibility = "hidden";
    document.getElementById("touchSpace").ontouchstart = null;
    document.getElementById("touchSpace").ontouchend = null;

    // section 1
    if (section === 1) {
        if (block === 2) {
            document.getElementById("infoPanel-2").style.visibility = "visible";
        }
        if (block === 3) {
            document.getElementById("infoPanel-3").style.visibility = "visible";
        }
    }

    // section 2
    if (section === 2) {
        if (block === 2) {
            document.getElementById("infoPanel-2").style.visibility = "visible";
        }
    }

    // section 3
    if (section === 3) {
        if (block === 2) {
            document.getElementById("infoPanel-2").style.visibility = "visible";
        }
    }

    // section 4
    if (section === 4) {
        if (block === 2) {
            document.getElementById("infoPanel-2").style.visibility = "visible";
        }
    }
}

// Function to display results at end of each section
function displayResults() {
    pause = true;
    document.getElementById("touchBackground").style.visibility = "hidden";
    document.getElementById("touchSpace").ontouchstart = null;
    document.getElementById("touchSpace").ontouchend = null;
    document.getElementById("touchSpace").onmousedown = null;
    document.getElementById("touchSpace").onmouseup = null;
    document.getElementById("resultPanel").style.visibility = "visible";
    document.getElementById("resultsText").innerHTML = resultText;
}

// Function to change position of dots randomly
function changePosition() {
    newWidth = Math.random() * (85 - 15) + 15;
    newHeight = Math.random() * (85 - 15) + 15;
    centerTouchX = newWidth * window.innerWidth + (document.getElementById("touchBackground").style.width / 2);
    centerTouchY = newHeight * window.innerHeight + (document.getElementById("touchBackground").style.height / 2);
    document.getElementById("touchSpace").style.top = newHeight.toString() + "%";
    document.getElementById("touchSpace").style.left = newWidth.toString() + "%";
}

// Function to reset position to center of screen
function resetPosition() {
    document.getElementById("touchSpace").style.top = "50%";
    document.getElementById("touchSpace").style.left = "50%";
}

// Timer function that runs every second
function timerFunction() {

    // Define elements at start of block
    if (secondsLeft === maxTime) {
        defineElements();
    }

    // Store results, reset position and proceed to next block when timer ends
    if (secondsLeft === 0) {
        if (pause === false) {
            var audio = document.getElementById("audio");
            audio.play();
            document.getElementById("timer").innerHTML = secondsLeft + "s";
            clearInterval(timer);
            storeResults();
            resetPosition();

            // section 1
            if (section === 1) {
                block = block + 1;
                if (block <= 3) {
                    newBlock();
                }
                if (block === 4) {
                    displayResults();
                }
            }

            // section 2
            if (section === 2) {
                block = block + 1;
                if (block === 2) {
                    newBlock();
                }
                if (block === 3) {
                    displayResults();
                }
            }

            // section 3
            if (section === 3) {
                block = block + 1;
                if (block === 2) {
                    newBlock();
                }
                if (block === 3) {
                    displayResults();
                }
            }

            // section 4
            if (section === 4) {
                block = block + 1;
                if (block === 2) {
                    newBlock();
                }
                if (block === 3) {
                    displayResults();
                }
            }
        }
    }
    else {
        // print timer 
        document.getElementById("timer").innerHTML = secondsLeft + "s";
        secondsLeft--;

        // change positions of dot randomly whenever required
        if (section != 1) {
            if (block === 2) {
                if (secondsLeft % 2 === 0) {
                    changePosition();
                }
            }
        }
    }
}

// Function to start a session - defines all section related variable and starts timer for block 1.
function onClickStart(sectionBlock) {
    // section 1
    if (sectionBlock === "s1") {
        section = 1;
        block = 1;
        currentPhase = ["Full Screen Normal: ", "Full Screen Away From Screen: ", "Full Screen Eyes Closed: "];
        document.getElementById("infoPanel-1").style.visibility = "hidden";
        document.getElementById("touchBackground").style.visibility = "visible";
        const timer = setInterval(timerFunction, 1000);
    }

    // section 2
    if (sectionBlock === "s2") {
        section = 2;
        block = 1;
        currentPhase = ["Big Dot Normal: ", "Big Dot Dynamic: "];
        document.getElementById("touchSpace").style.width = "1.25in";
        document.getElementById("touchSpace").style.height = "1.25in";
        document.getElementById("touchSpace").style.borderRadius = "50%";
        document.getElementById("infoPanel-1").style.visibility = "hidden";
        document.getElementById("touchBackground").style.visibility = "visible";
        const timer = setInterval(timerFunction, 1000);
    }

    // section 3
    if (sectionBlock === "s3") {
        section = 3;
        block = 1;
        currentPhase = ["Small Dot Normal: ", "Small Dot Dynamic: "];
        document.getElementById("touchSpace").style.width = "0.7in";
        document.getElementById("touchSpace").style.height = "0.7in";
        document.getElementById("touchSpace").style.borderRadius = "50%";
        document.getElementById("infoPanel-1").style.visibility = "hidden";
        document.getElementById("touchBackground").style.visibility = "visible";
        const timer = setInterval(timerFunction, 1000);
    }

    // section 4
    if (sectionBlock === "s4") {
        section = 4;
        block = 1;
        currentPhase = ["Tiny Dot Normal: ", "Tiny Dot Dynamic: "];
        document.getElementById("touchSpace").style.width = "0.35in";
        document.getElementById("touchSpace").style.height = "0.35in";
        document.getElementById("touchSpace").style.borderRadius = "50%";
        document.getElementById("infoPanel-1").style.visibility = "hidden";
        document.getElementById("touchBackground").style.visibility = "visible";
        const timer = setInterval(timerFunction, 1000);
    }

}
