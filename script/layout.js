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

    // Use custom positions only if they have the expected shape.
    function resolvePositions(positions) {
        const ok = positions && Array.isArray(positions.origin) && Array.isArray(positions.pairs) &&
            positions.pairs.length === POSITIONS.length;
        return ok ? positions : defaultPositions();
    }

    // Build the screen geometry for a W x H viewport.
    // layout = { area: 'bottom' | 'top' | 'full', areaHeightPct, nodeDiameter }
    // positions = optional custom positions (see defaultPositions); null = original layout.
    // The full-screen layout is scaled UNIFORMLY (same factor on x and y) into the task area,
    // so relative distances, angles and positions are preserved. The scale is fitted to the
    // ORIGINAL layout's extent, so moving individual dots never rescales the others.
    function build(W, H, layout, positions) {
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
        const map = (c) => clamp({ x: tx + s * c.x, y: ty + s * c.y });

        // Inverse: an on-screen centre -> stored value (used by the admin position editor).
        const unmap = (x, y) => ({ x: (x - tx) / s, y: (y - ty) / s });
        const round = v => Math.round(v * 100) / 100;
        const toStoredOrigin = (x, y) => { const c = unmap(x, y); return [round(c.x / W * 100), round(c.y / H * 100)]; };
        const toStoredNode = (x, y) => {
            const c = unmap(x, y);
            return [round((c.x - ORIGINAL_RADIUS) / W * 100), round((c.y - ORIGINAL_RADIUS) / H * 100)];
        };

        return {
            W, H, r, scale: s, area, areaTop, areaHeight, bounds,
            origin: map(originCentre),
            // centre of the correct (real) / distractor (fake) node for trial i
            real: (i) => map(origCentre(pos.pairs[i][0])),
            fake: (i) => map(origCentre(pos.pairs[i][1])),
            toStoredOrigin, toStoredNode,
        };
    }

    global.TMTLayout = { POSITIONS, ORIGIN, ORIGINAL_RADIUS, MAX_TRIALS, sequenceLabel, trialLabels, defaultPositions, build };
})(typeof window !== 'undefined' ? window : globalThis);
