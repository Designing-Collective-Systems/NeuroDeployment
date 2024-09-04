var prevcoord;
var index = 0;
var errorstate = 0;
var preverror = 0;
const circleradius = 40;

function speed(coord) {
    return Math.sqrt(Math.pow((coord[0] - prevcoord[0]), 2) + Math.pow((coord[1] - prevcoord[1]), 2)) / (coord[2] - prevcoord[2]);
}

function correctangle(coord) {
    var AB = Math.sqrt(Math.pow(prevcoord[0] - coord[0], 2) + Math.pow(prevcoord[1] - coord[1], 2));
    var BC = Math.sqrt(Math.pow(prevcoord[0] - (coord[4] + circleradius), 2) + Math.pow(prevcoord[1] - (coord[5] + circleradius), 2));
    var AC = Math.sqrt(Math.pow((coord[4] + circleradius) - coord[0], 2) + Math.pow((coord[5] + circleradius) - coord[1], 2));
    const angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    return (angle * 180) / Math.PI;
}

function wrongangle(coord) {
    var AB = Math.sqrt(Math.pow(prevcoord[0] - coord[0], 2) + Math.pow(prevcoord[1] - coord[1], 2));
    var BC = Math.sqrt(Math.pow(prevcoord[0] - (coord[7] + circleradius), 2) + Math.pow(prevcoord[1] - (coord[8] + circleradius), 2));
    var AC = Math.sqrt(Math.pow((coord[7] + circleradius) - coord[0], 2) + Math.pow((coord[8] + circleradius) - coord[1], 2));
    const angle = Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB));
    return (angle * 180) / Math.PI;
}

function calculate_measures(coords, data) {
    //console.log(coords);
    for (const coord of coords) {
        //console.log(coord[3]);
        if (index === 0 || errorstate === 1) {
            data.speed.push(0);
            data.pause.push(0);
            data.correctangle.push(0);
            data.wrongangle.push(0);
            data.error.push(0);
            data.errorcorrected.push(0);
            errorstate = 0;
        }
        else if (coord[0] === -1 || coord[0] === -2) {
            errorstate = 1;
            data.speed.push(0);
            data.pause.push(0);
            data.correctangle.push(0);
            data.wrongangle.push(0);
            data.error.push(0);
            data.errorcorrected.push(0);
        }
        else {
            //console.log("hello");
            data.speed.push(speed(coord));
            //console.log(speed(coord));
            data.pause.push(coord[2] - prevcoord[2]);
            const cangle = correctangle(coord);
            const wangle = wrongangle(coord);
            data.correctangle.push(cangle);
            data.wrongangle.push(wangle);
            if (preverror === 1 && cangle <= wangle) {
                data.errorcorrected.push(1)
            }
            else {
                data.errorcorrected.push(0)
            }
            if (cangle > wangle) {
                data.error.push(1);
                preverror = 1;
            }
            else {
                data.error.push(0);
                preverror = 0;
            }
        }
        index = index + 1;
        prevcoord = coord;
        //console.log(coord);
    }

    return data;
}