// Shared geometry + labels for Crossroads-A / Crossroads-B.
// Used by the participant app and by the admin preview.
(function (global) {
    'use strict';

    // Radius of the node in the original task (80px circles). The original
    // positions are the TOP-LEFT corner of the node, as a % of screen width/height.
    const ORIGINAL_RADIUS = 40;

    // Fixed relative positions from the original task: [[real], [fake]] per trial.
    // Do not edit: these define the task geometry and must stay identical between A and B.
    const POSITIONS = [
        [[10, 10], [60, 30]], [[70, 60], [55, 20]], [[10, 75], [70, 30]], [[20, 30], [50, 30]],
        [[70, 40], [20, 70]], [[60, 10], [10, 50]], [[10, 70], [30, 10]], [[70, 10], [60, 50]],
        [[20, 70], [75, 30]], [[50, 70], [30, 20]], [[10, 10], [60, 30]], [[70, 40], [20, 70]],
        [[10, 70], [30, 10]], [[70, 10], [60, 50]], [[20, 30], [50, 30]], [[60, 10], [10, 50]],
        [[10, 70], [30, 10]], [[70, 10], [60, 50]], [[10, 10], [60, 30]], [[70, 60], [55, 20]],
        [[10, 75], [70, 30]], [[20, 30], [50, 30]], [[70, 40], [20, 70]], [[60, 10], [10, 50]],
        [[10, 70], [30, 10]], [[70, 10], [60, 50]], [[20, 70], [75, 30]], [[50, 70], [30, 20]],
        [[10, 10], [60, 30]], [[70, 40], [20, 70]], [[10, 70], [30, 10]], [[70, 10], [60, 50]],
        [[20, 30], [50, 30]], [[60, 10], [10, 50]], [[10, 70], [30, 10]], [[70, 10], [60, 50]],
        [[10, 10], [60, 30]], [[70, 60], [55, 20]], [[10, 75], [70, 30]], [[60, 10], [10, 50]],
        [[10, 10], [60, 30]], [[70, 60], [55, 20]], [[10, 75], [70, 30]], [[20, 30], [50, 30]],
        [[70, 40], [20, 70]], [[60, 10], [10, 50]], [[10, 70], [30, 10]], [[70, 10], [60, 50]],
        [[10, 10], [60, 30]], [[70, 60], [55, 20]], [[10, 75], [70, 30]], [[60, 10], [10, 50]],
    ];

    // Start node ("1"): centred horizontally, at 3/4 of the screen height (original task).
    const ORIGIN = { x: 0.5, y: 0.75 };

    const MAX_TRIALS = POSITIONS.length - 2;
    const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Sequence of node labels. B: 1, A, 2, B, 3, C ...   A: 1, 2, 3, 4 ...
    function sequenceLabel(task, k) {
        if (task === 'tmt_a') return String(k + 1);
        return k % 2 === 0 ? String(k / 2 + 1) : LETTERS[(k - 1) / 2];
    }

    // Labels for trial i: [correct next node, distractor]. Same index structure
    // for A and B, so only the labels differ between the two tasks.
    function trialLabels(task, i) {
        return [sequenceLabel(task, i + 1), sequenceLabel(task, i + 2)];
    }

    // Default (original) positions in the stored format:
    //   origin: centre of the start dot, % of screen width/height
    //   pairs:  [[real], [fake]] per move, TOP-LEFT of an 80px dot, % of screen width/height
    function defaultPositions() {
        return { origin: [ORIGIN.x * 100, ORIGIN.y * 100], pairs: POSITIONS.map(p => [[...p[0]], [...p[1]]]) };
    }

    // Occlusion-safe layouts for the first 10 moves, designed for a RIGHT hand (mirrored for
    // left-handed participants) on an iPad in portrait. Relative to the current dot, every target
    // and distractor lies between 25 and 200 degrees (anticlockwise from "right"), i.e. outside the
    // area covered by a right hand and forearm (below/right of the fingertip). Target and distractor
    // are within 7% of the same distance and 45-73 degrees apart; the target is on each side of the
    // distractor in 5 of 10 moves. Each preset belongs to a task-area height (the scale depends on
    // it), so loading one also sets that height. Moves 11+ keep the original positions.
    const PRESETS = {
        occlusionSafe60: {
            label: 'Occlusion-safe, task area bottom 60%',
            layout: { area: 'bottom', areaHeightPct: 60 },
            origin: [51.53, 77.99],
            pairs: [
                [[66.04, 49.74], [18.63, 55.14]], [[28.01, 53.32], [47.12, 28.06]], [[52.24, 35.84], [19.32, 29.65]],
                [[20.87, 43.08], [24.96, 25.63]], [[55.71, 30.37], [21.04, 16.84]], [[21.79, 37.99], [27.04, 14.92]],
                [[59.31, 25.37], [16.07, 11]], [[25.2, 33.95], [29.16, 14.72]], [[-5.68, 37.96], [10.24, 14.12]],
                [[25.63, 26.64], [-3.71, 13.38]],
            ],
        },
        occlusionSafe85: {
            label: 'Occlusion-safe, more varied, task area bottom 85%',
            layout: { area: 'bottom', areaHeightPct: 85 },
            origin: [23.24, 84.28],
            pairs: [
                [[34.65, 62.87], [6.34, 62.86]], [[59.62, 47.05], [33.34, 39.24]], [[33.39, 47.17], [45.6, 31.12]],
                [[51.59, 30.21], [14.97, 29.72]], [[20.67, 37.76], [29.72, 11.28]], [[40.71, 25.51], [12.57, 18.98]],
                [[14.33, 29.61], [20.61, 11.47]], [[45.09, 18.39], [21.89, 6.69]], [[16.86, 20.42], [22.89, 5.82]],
                [[1.39, 5.8], [25.35, 4.3]],
            ],
        },
    };
    function presetPositions(name) {
        const p = defaultPositions();
        const preset = PRESETS[name];
        if (preset) {
            p.origin = [...preset.origin];
            preset.pairs.forEach((pair, i) => { p.pairs[i] = [[...pair[0]], [...pair[1]]]; });
        }
        return p;
    }

    // Use custom positions only if they have the expected shape.
    function resolvePositions(positions) {
        const ok = positions && Array.isArray(positions.origin) && Array.isArray(positions.pairs) &&
            positions.pairs.length === POSITIONS.length;
        return ok ? positions : defaultPositions();
    }

    // Build the screen geometry for a W x H viewport.
    // layout = { area: 'bottom' | 'top' | 'full', areaHeightPct, nodeDiameter }
    // positions = optional custom positions (see defaultPositions); null = original layout.
    // opts.mirror = true flips the layout left-right (for left-handed participants).
    // The full-screen layout is scaled UNIFORMLY (same factor on x and y) into the task area,
    // so relative distances, angles and positions are preserved. The scale is fitted to the
    // ORIGINAL layout's extent, so moving individual dots never rescales the others.
    function build(W, H, layout, positions, opts = {}) {
        const pos = resolvePositions(positions);
        const area = layout.area || 'bottom';
        const r = (layout.nodeDiameter || 80) / 2;

        // Node centres in the original, full-screen coordinate system.
        const origCentre = (p) => ({ x: (p[0] / 100) * W + ORIGINAL_RADIUS, y: (p[1] / 100) * H + ORIGINAL_RADIUS });
        const originCentre = { x: (pos.origin[0] / 100) * W, y: (pos.origin[1] / 100) * H };

        let s = 1, tx = 0, ty = 0, areaTop = 0, areaHeight = H;
        if (area !== 'full') {
            areaHeight = H * Math.min(100, Math.max(20, layout.areaHeightPct || 60)) / 100;
            areaTop = area === 'top' ? 0 : H - areaHeight;

            let minX = ORIGIN.x * W, maxX = minX, minY = ORIGIN.y * H, maxY = minY;
            for (const pair of POSITIONS) {
                for (const p of pair) {
                    const c = origCentre(p);
                    minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
                    minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
                }
            }
            const margin = r + 12;
            s = Math.min((W - 2 * margin) / (maxX - minX), (areaHeight - 2 * margin) / (maxY - minY), 1);
            tx = W / 2 - s * (minX + maxX) / 2;
            ty = areaTop + areaHeight / 2 - s * (minY + maxY) / 2;
        }

        // Keep every dot fully inside the task area (only matters for custom positions
        // that were placed on a different screen shape).
        const bounds = { x0: r, x1: W - r, y0: areaTop + r, y1: areaTop + areaHeight - r };
        const clamp = (c) => ({
            x: Math.min(bounds.x1, Math.max(bounds.x0, c.x)),
            y: Math.min(bounds.y1, Math.max(bounds.y0, c.y)),
        });
        const mirror = !!opts.mirror;
        const flip = (x) => (mirror ? W - x : x);
        const map = (c) => { const p = clamp({ x: tx + s * c.x, y: ty + s * c.y }); return { x: flip(p.x), y: p.y }; };

        // Inverse: an on-screen centre -> stored value (used by the admin position editor).
        const unmap = (x, y) => ({ x: (flip(x) - tx) / s, y: (y - ty) / s });
        const round = v => Math.round(v * 100) / 100;
        const toStoredOrigin = (x, y) => { const c = unmap(x, y); return [round(c.x / W * 100), round(c.y / H * 100)]; };
        const toStoredNode = (x, y) => {
            const c = unmap(x, y);
            return [round((c.x - ORIGINAL_RADIUS) / W * 100), round((c.y - ORIGINAL_RADIUS) / H * 100)];
        };

        return {
            W, H, r, scale: s, area, areaTop, areaHeight, bounds, mirror,
            origin: map(originCentre),
            // centre of the correct (real) / distractor (fake) node for trial i
            real: (i) => map(origCentre(pos.pairs[i][0])),
            fake: (i) => map(origCentre(pos.pairs[i][1])),
            toStoredOrigin, toStoredNode,
        };
    }

    global.TMTLayout = { POSITIONS, ORIGIN, ORIGINAL_RADIUS, MAX_TRIALS, sequenceLabel, trialLabels, defaultPositions, presetPositions, PRESETS, build };
})(typeof window !== 'undefined' ? window : globalThis);
