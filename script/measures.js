// Per-sample measures for the Crossroads tasks.
// Same algorithm as the original measures.js, but without global state so it can
// be run once per block without reloading the page.
//
// coord = [x, y, t, realLabel, realX, realY, fakeLabel, fakeX, fakeY]
// realX/realY/fakeX/fakeY are the TOP-LEFT corner of the node (original data format),
// so the node centre is (x + radius, y + radius).
(function (global) {
    'use strict';

    function calculateMeasures(coords, radius) {
        const out = { speed: [], pause: [], correctangle: [], wrongangle: [], error: [], errorcorrected: [] };
        let prev = null;
        let errorstate = 0;
        let preverror = 0;

        const angleTo = (prev, coord, nx, ny) => {
            const AB = Math.hypot(prev[0] - coord[0], prev[1] - coord[1]);
            const BC = Math.hypot(prev[0] - (nx + radius), prev[1] - (ny + radius));
            const AC = Math.hypot((nx + radius) - coord[0], (ny + radius) - coord[1]);
            return (Math.acos((BC * BC + AB * AB - AC * AC) / (2 * BC * AB)) * 180) / Math.PI;
        };
        const zeros = () => {
            out.speed.push(0); out.pause.push(0); out.correctangle.push(0);
            out.wrongangle.push(0); out.error.push(0); out.errorcorrected.push(0);
        };

        coords.forEach((coord, index) => {
            if (index === 0 || errorstate === 1) {
                zeros();
                errorstate = 0;
            } else if (coord[0] === -1 || coord[0] === -2) {
                errorstate = 1;
                zeros();
            } else {
                out.speed.push(Math.hypot(coord[0] - prev[0], coord[1] - prev[1]) / (coord[2] - prev[2]));
                out.pause.push(coord[2] - prev[2]);
                const cangle = angleTo(prev, coord, coord[4], coord[5]);
                const wangle = angleTo(prev, coord, coord[7], coord[8]);
                out.correctangle.push(cangle);
                out.wrongangle.push(wangle);
                out.errorcorrected.push(preverror === 1 && cangle <= wangle ? 1 : 0);
                if (cangle > wangle) { out.error.push(1); preverror = 1; }
                else { out.error.push(0); preverror = 0; }
            }
            prev = coord;
        });
        return out;
    }

    global.calculateMeasures = calculateMeasures;
})(typeof window !== 'undefined' ? window : globalThis);
