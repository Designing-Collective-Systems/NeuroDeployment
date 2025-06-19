//phone gyroscope
// test5.js
export class HoldTremorDetector {
    constructor(onComplete) {
        this.onComplete = onComplete;
        this.motionHandler = this.handleMotion.bind(this);
        this.data = [];
        this.startTime = null;
        this.recording = false;
    }

    start() {
        if (typeof DeviceMotionEvent === "undefined") {
            return this.onComplete({ error: "DeviceMotion not supported." });
        }

        this.data = [];
        this.recording = true;
        this.startTime = performance.now();

        window.addEventListener("devicemotion", this.motionHandler, true);

        // Stop after 8 seconds
        setTimeout(() => this.stop(), 8000);
    }

    stop() {
        window.removeEventListener("devicemotion", this.motionHandler, true);
        this.recording = false;
        this.analyzeMotion();
    }

    handleMotion(event) {
        if (!this.recording) return;
        const now = performance.now();
        const time = now - this.startTime;

        const acc = event.acceleration;
        if (!acc) return;

        const magnitude = Math.sqrt(
            (acc.x || 0) ** 2 +
            (acc.y || 0) ** 2 +
            (acc.z || 0) ** 2
        );

        this.data.push({ time, magnitude });
    }

    analyzeMotion() {
        if (this.data.length < 30) {
            return this.onComplete({ error: "Not enough motion data." });
        }

        // Detrend and smooth data
        const values = this.data.map(d => d.magnitude);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const deviations = values.map(v => v - mean);

        const stdDev = Math.sqrt(
            deviations.reduce((sum, d) => sum + d * d, 0) / deviations.length
        );

        let severity = "None";
        if (stdDev > 0.05 && stdDev <= 0.17) severity = "None";
        else if (stdDev > 0.17 && stdDev <= 0.2) severity = "Mild";
        else if (stdDev > 0.2 && stdDev<0.3) severity = "Moderate";
        else if (stdDev > 0.3) severity = "Severe";

        this.onComplete({
            stdDev: stdDev.toFixed(4),
            severity
        });
    }
}
