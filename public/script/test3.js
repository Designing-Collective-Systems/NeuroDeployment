let startTime;
'use strict';

export class TremorDetector {
    constructor(canvas, onComplete) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.onComplete = onComplete;

        this.points = [];
        this.isDrawing = false;

        this.initListeners();
    }

    initListeners() {
        const getCoords = e => {
            if (e.touches && e.touches.length) {
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                return [touch.clientX - rect.left, touch.clientY - rect.top];
            } else {
                return [e.offsetX, e.offsetY];
            }
        };

        const start = (x, y) => {
            this.points = [{ x, y, time: performance.now() }];
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.isDrawing = true;
        };

        const move = (x, y) => {
            if (!this.isDrawing) return;
            const time = performance.now();
            this.points.push({ x, y, time });
            this.drawLine();
        };

        const end = () => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            this.analyzeData();
        };

        this.canvas.addEventListener("mousedown", e => start(...getCoords(e)));
        this.canvas.addEventListener("mousemove", e => move(...getCoords(e)));
        this.canvas.addEventListener("mouseup", end);
        this.canvas.addEventListener("mouseleave", end);

        this.canvas.addEventListener("touchstart", e => start(...getCoords(e)));
        this.canvas.addEventListener("touchmove", e => move(...getCoords(e)));
        this.canvas.addEventListener("touchend", end);
    }

    drawLine() {
        const pts = this.points;
        if (pts.length < 2) return;
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    analyzeData() {
        const points = this.points;
        if (points.length < 15) return this.onComplete({ error: "Too little data" });

        const firstX = points[0].x;
        const lastX = points[points.length - 1].x;

        if (lastX - firstX < 50) {
            return this.onComplete({ error: "Please draw from left to right." });
        }

        const totalTime = points[points.length - 1].time - points[0].time;
        const smoothed = this.smoothPoints(points, 5);
        const residuals = points.map((p, i) => p.y - smoothed[i].y);
        const stdDev = this.standardDeviation(residuals);

        let severity = "None";
        if (stdDev > 1.5 && stdDev <= 3) severity = "Mild";
        else if (stdDev > 3 && stdDev <= 6) severity = "Moderate";
        else if (stdDev > 6) severity = "Severe";

        this.onComplete({
            totalTime: totalTime.toFixed(2),
            tremorDeviation: stdDev.toFixed(2),
            severity
        });
    }

    smoothPoints(points, windowSize) {
        const smoothed = [];
        for (let i = 0; i < points.length; i++) {
            let start = Math.max(0, i - windowSize);
            let end = Math.min(points.length - 1, i + windowSize);
            let sumY = 0;
            for (let j = start; j <= end; j++) {
                sumY += points[j].y;
            }
            let avgY = sumY / (end - start + 1);
            smoothed.push({ x: points[i].x, y: avgY });
        }
        return smoothed;
    }

    standardDeviation(arr) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
        return Math.sqrt(variance);
    }
}


