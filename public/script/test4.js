//spiral
export class SpiralTremorDetector {
    constructor(canvas, onComplete) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.onComplete = onComplete;

        this.points = [];
        this.isDrawing = false;

        this.initListeners();
        this.drawReferenceSpiral();
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
            this.drawReferenceSpiral();
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
            this.analyzeSpiral();
        };

        this.canvas.addEventListener("mousedown", e => start(...getCoords(e)));
        this.canvas.addEventListener("mousemove", e => move(...getCoords(e)));
        this.canvas.addEventListener("mouseup", end);
        this.canvas.addEventListener("mouseleave", end);

        this.canvas.addEventListener("touchstart", e => start(...getCoords(e)), { passive: false });
        this.canvas.addEventListener("touchmove", e => move(...getCoords(e)), { passive: false });
        this.canvas.addEventListener("touchend", e => end(), { passive: false });
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

    drawReferenceSpiral() {
        const ctx = this.ctx;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        ctx.beginPath();
        let a = 0;
        let b = 4;
        for (let theta = 0; theta < 4 * Math.PI; theta += 0.1) {
            const r = a + b * theta;
            const x = centerX + r * Math.cos(theta);
            const y = centerY + r * Math.sin(theta);
            if (theta === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(0, 0, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    analyzeSpiral() {
        if (this.points.length < 30) {
            return this.onComplete({ error: "Too little data. Draw a full spiral." });
        }

        // 1. Compute angle changes between consecutive segments
        const angles = [];
        for (let i = 2; i < this.points.length; i++) {
            const dx1 = this.points[i - 1].x - this.points[i - 2].x;
            const dy1 = this.points[i - 1].y - this.points[i - 2].y;
            const dx2 = this.points[i].x - this.points[i - 1].x;
            const dy2 = this.points[i].y - this.points[i - 1].y;

            const angle1 = Math.atan2(dy1, dx1);
            const angle2 = Math.atan2(dy2, dx2);
            let delta = angle2 - angle1;

            // Normalize angle to [-π, π]
            delta = Math.atan2(Math.sin(delta), Math.cos(delta));
            angles.push(delta);
        }

        // 2. Compute standard deviation of these angle changes
        const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
        const variance = angles.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / angles.length;
        const stdDev = Math.sqrt(variance);

        // 3. Define severity based on std deviation (in radians)
        let severity = "None";
        if (stdDev > 0.15 && stdDev <= 0.3) severity = "None";
        else if (stdDev > 0.3 && stdDev <= 0.6) severity = "Moderate";
        else if (stdDev > 0.6) severity = "Severe";

        this.onComplete({
            strokeJitter: stdDev.toFixed(3),
            severity
        });
    }


    resamplePath(points, n) {
        const result = [];
        const totalLength = this.pathLength(points);
        const interval = totalLength / (n - 1);

        let D = 0;
        result.push(points[0]);
        for (let i = 1; i < points.length; i++) {
            const d = this.distance(points[i - 1], points[i]);
            if ((D + d) >= interval) {
                const qx = points[i - 1].x + ((interval - D) / d) * (points[i].x - points[i - 1].x);
                const qy = points[i - 1].y + ((interval - D) / d) * (points[i].y - points[i - 1].y);
                const q = { x: qx, y: qy };
                result.push(q);
                points.splice(i, 0, q);
                D = 0;
            } else {
                D += d;
            }
        }

        while (result.length < n) {
            result.push(points[points.length - 1]);
        }
        return result;
    }

    pathLength(points) {
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            length += this.distance(points[i - 1], points[i]);
        }
        return length;
    }

    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
