var secondsLeft = 10;
var touchStarted = 0;
var touchCount = 0;
const timer = setInterval(function () {
    secondsLeft--;
    document.getElementById("timer").innerHTML = secondsLeft + "s";
    if (secondsLeft === 0) {
        clearInterval(timer);
        document.getElementById("touchSpace").ontouchstart = null;
        document.getElementById("touchSpace").ontouchend = null;
    }
    if (secondsLeft > 0) {
        document.getElementById("touchSpace").ontouchstart = function (e) {
            touchStarted = touchStarted + 1;
        };
        document.getElementById("touchSpace").ontouchend = function (e) {
            if (touchStarted > 0) {
                touchStarted = touchStarted - 1;
                touchCount = touchCount + 1;
                document.getElementById("count").innerHTML = touchCount;
            }
        };
    }
}, 1000);