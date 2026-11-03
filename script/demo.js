// Looping instructional animation shown before each task.
// Uses its own small layout (NOT the real task positions) so it teaches the
// interaction without rehearsing the test layout.
(function (global) {
    'use strict';

    // Safari < 16 has no CanvasRenderingContext2D.roundRect
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            r = Math.min(r, w / 2, h / 2);
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
        };
    }

    const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const lerp = (a, b, t) => a + (b - a) * t;

    // Demo layout in canvas-relative units (0..1).
    const DEMO_ORIGIN = { x: 0.5, y: 0.8 };
    const DEMO_STEPS = [
        { real: { x: 0.2, y: 0.42 }, fake: { x: 0.78, y: 0.34 } },
        { real: { x: 0.62, y: 0.18 }, fake: { x: 0.38, y: 0.66 } },
        { real: { x: 0.84, y: 0.64 }, fake: { x: 0.16, y: 0.8 } },
    ];

    function setupCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const size = { w: 0, h: 0 };
        const fit = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            size.w = rect.width;
            size.h = rect.height;
            canvas.width = Math.max(1, Math.round(rect.width * dpr));
            canvas.height = Math.max(1, Math.round(rect.height * dpr));
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        fit();
        const ro = new ResizeObserver(fit);
        ro.observe(canvas);
        return { ctx, size, stop: () => ro.disconnect() };
    }

    function drawNode(ctx, x, y, r, label, opts = {}) {
        if (opts.pulse) {
            const p = (performance.now() % 1400) / 1400;
            ctx.beginPath();
            ctx.arc(x, y, r + p * r * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(37, 99, 235, ${0.45 * (1 - p)})`;
            ctx.fill();
        }
        ctx.globalAlpha = opts.alpha === undefined ? 1 : opts.alpha;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.round(r * 0.75)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y + 1);
        ctx.globalAlpha = 1;
    }

    function drawFinger(ctx, x, y, pressed, scale) {
        if (pressed) {
            ctx.beginPath();
            ctx.arc(x, y, 12 * scale, 0, Math.PI * 2);
            ctx.fillStyle = '#000';
            ctx.fill();
        }
        // simple pointing hand: finger + palm, fingertip at (x, y)
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#f2c9a0';
        ctx.strokeStyle = '#8a5a35';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 40, 7);           // index finger
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(-10, 30, 34, 36, 12);         // palm
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 40, 7);           // redraw finger over palm edge
        ctx.fill();
        ctx.restore();
    }

    function drawBanner(ctx, size, text) {
        const h = Math.max(44, size.h * 0.16);
        ctx.fillStyle = 'rgba(240, 253, 244, 0.95)';
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(size.w * 0.15, size.h / 2 - h / 2, size.w * 0.7, h, 14);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#15803d';
        ctx.font = `bold ${Math.round(h * 0.4)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size.w / 2, size.h / 2 + 1);
    }

    // ----- Crossroads (A or B) -----
    function crossroads(task, showDistractor) {
        const label = k => global.TMTLayout.sequenceLabel(task, k);
        const APPROACH = 1500, PRESS = 900, SLIDE = 1300, SETTLE = 700, END = 2200;
        const STEP = SLIDE + SETTLE;
        const total = APPROACH + PRESS + DEMO_STEPS.length * STEP + END;

        return function frame(ctx, size, t) {
            t = t % total;
            const P = p => ({ x: p.x * size.w, y: p.y * size.h });
            const r = Math.max(14, Math.min(size.w, size.h) * 0.065);
            const fs = Math.max(0.6, Math.min(1.2, size.w / 420));

            // Which step are we on and where is the finger?
            let current = P(DEMO_ORIGIN), currentLabel = label(0);
            let finger, pressed = false, pairVisible = false, step = 0, caption;
            const trail = [];

            if (t < APPROACH) {
                const k = easeInOut(t / APPROACH);
                finger = { x: lerp(size.w * 0.92, current.x, k), y: lerp(size.h * 1.15, current.y, k) };
                caption = `Place your finger on dot ${label(0)}`;
            } else if (t < APPROACH + PRESS) {
                finger = current; pressed = true; pairVisible = t > APPROACH + 250;
                caption = 'Keep your finger on the screen';
            } else {
                let tt = t - APPROACH - PRESS;
                pressed = true;
                trail.push(current);
                step = Math.min(DEMO_STEPS.length, Math.floor(tt / STEP));
                for (let i = 0; i < step; i++) {
                    current = P(DEMO_STEPS[i].real);
                    currentLabel = label(i + 1);
                    trail.push(current);
                }
                tt -= step * STEP;
                if (step < DEMO_STEPS.length) {
                    const target = P(DEMO_STEPS[step].real);
                    const k = easeInOut(Math.min(1, tt / SLIDE));
                    finger = { x: lerp(current.x, target.x, k), y: lerp(current.y, target.y, k) };
                    trail.push(finger);
                    pairVisible = true;
                    caption = `Slide to ${label(step + 1)} without lifting your finger`;
                    if (tt >= SLIDE) { // arrived: it becomes the current dot
                        current = target; currentLabel = label(step + 1);
                        pairVisible = false;
                        caption = 'Keep going to the next dot';
                    }
                } else {
                    finger = current;
                    pressed = tt < 500;
                    caption = 'Reach the last dot to finish the round';
                }
            }

            ctx.clearRect(0, 0, size.w, size.h);

            // trail
            if (trail.length > 1) {
                ctx.strokeStyle = 'rgba(37, 99, 235, 0.45)';
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
                ctx.stroke();
            }

            const onStep = Math.min(step, DEMO_STEPS.length - 1);
            if (pairVisible && step < DEMO_STEPS.length) {
                const s = DEMO_STEPS[onStep];
                drawNode(ctx, s.real.x * size.w, s.real.y * size.h, r, label(onStep + 1));
                if (showDistractor) drawNode(ctx, s.fake.x * size.w, s.fake.y * size.h, r, label(onStep + 2));
            }
            drawNode(ctx, current.x, current.y, r, currentLabel, { pulse: !pressed && t < APPROACH + PRESS });
            drawFinger(ctx, finger.x, finger.y, pressed, fs);

            if (t > total - END + 500) drawBanner(ctx, size, '✓ Round complete');
            return caption;
        };
    }

    // ----- Swiping -----
    function swiping(durationSec) {
        const APPROACH = 1200, COUNT = Math.min(durationSec, 6), SWIPE = COUNT * 1000, END = 1800;
        const total = APPROACH + SWIPE + END;
        const history = [];

        return function frame(ctx, size, t) {
            t = t % total;
            const fs = Math.max(0.6, Math.min(1.2, size.w / 420));
            const centre = { x: size.w * 0.5, y: size.h * 0.6 };
            let finger, pressed = false, caption, remaining = COUNT;

            if (t < APPROACH) {
                history.length = 0;
                const k = easeInOut(t / APPROACH);
                finger = { x: lerp(size.w * 0.95, centre.x, k), y: lerp(size.h * 1.15, centre.y, k) };
                caption = 'Place your finger on the screen to start the timer';
            } else if (t < APPROACH + SWIPE) {
                const s = (t - APPROACH) / 1000;
                const amp = Math.min(1, s * 2);
                finger = {
                    x: centre.x + amp * size.w * 0.36 * Math.sin(s * 5.2),
                    y: centre.y + amp * size.h * 0.22 * Math.sin(s * 8.3 + 0.6),
                };
                pressed = true;
                remaining = Math.max(0, Math.ceil(COUNT - s));
                history.push(finger);
                if (history.length > 40) history.shift();
                caption = 'Slide in any direction, as fast as you can, without lifting';
            } else {
                finger = history[history.length - 1] || centre;
                remaining = 0;
                caption = 'Keep going until the timer hits 0';
            }

            ctx.clearRect(0, 0, size.w, size.h);
            ctx.fillStyle = '#111827';
            ctx.font = `bold ${Math.round(Math.max(14, size.w * 0.045))}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`Continue swiping for: ${remaining} seconds!`, size.w / 2, size.h * 0.05);

            for (let i = 1; i < history.length; i++) {
                ctx.strokeStyle = `rgba(37, 99, 235, ${(i / history.length) * 0.6})`;
                ctx.lineWidth = 5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(history[i - 1].x, history[i - 1].y);
                ctx.lineTo(history[i].x, history[i].y);
                ctx.stroke();
            }
            drawFinger(ctx, finger.x, finger.y, pressed, fs);
            if (t > APPROACH + SWIPE + 300) drawBanner(ctx, size, '✓ Done!');
            return caption;
        };
    }

    // Public: start an animation; returns a stop function.
    function start(canvas, captionEl, opts) {
        const { ctx, size, stop: stopResize } = setupCanvas(canvas);
        const frame = opts.task === 'swipe' ? swiping(opts.durationSec || 10) : crossroads(opts.task, opts.showDistractor !== false);
        const t0 = performance.now();
        let raf = 0, lastCaption = '';
        const loop = now => {
            if (size.w > 0) {
                const caption = frame(ctx, size, now - t0);
                if (captionEl && caption !== lastCaption) { captionEl.textContent = caption; lastCaption = caption; }
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => { cancelAnimationFrame(raf); stopResize(); };
    }

    global.TMTDemo = { start };
})(window);
