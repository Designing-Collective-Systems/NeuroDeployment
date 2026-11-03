// Admin: drag-and-drop / coordinate editor for the Crossroads dot positions.
//
// Positions are stored relative to the screen (see script/layout.js), so the same
// layout adapts to any device. The editor shows them as on-screen pixel coordinates
// for the selected preview device, after the task-area setting is applied.
(function (global) {
    'use strict';

    const NS = 'http://www.w3.org/2000/svg';
    const L = global.TMTLayout;

    function el(tag, attrs = {}, parent) {
        const e = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
        if (parent) parent.appendChild(e);
        return e;
    }
    const clone = p => JSON.parse(JSON.stringify(p));

    // opts: { host, tableBody, info, device, labels, move, hand, getSettings, onChange }
    function create(opts) {
        let positions = L.defaultPositions();
        let geo = null, trials = 10, selected = null, dragging = null, tableKey = '';

        const svg = el('svg', { role: 'img', 'aria-label': 'Dot positions editor' });
        opts.host.replaceChildren(svg);
        const content = el('g', {}, svg);

        // ---- helpers ------------------------------------------------------------
        const task = () => opts.labels.value;
        const label = k => L.sequenceLabel(task(), k);
        const keyOf = (kind, i) => (kind === 'origin' ? 'origin' : `${kind}:${i}`);
        const centre = (kind, i) => (kind === 'origin' ? geo.origin : kind === 'real' ? geo.real(i) : geo.fake(i));
        const labelOf = (kind, i) => (kind === 'origin' ? label(0) : kind === 'real' ? label(i + 1) : label(i + 2));

        function setCentre(kind, i, x, y) {
            const b = geo.bounds;
            x = Math.min(b.x1, Math.max(b.x0, x));
            y = Math.min(b.y1, Math.max(b.y0, y));
            if (kind === 'origin') positions.origin = geo.toStoredOrigin(x, y);
            else positions.pairs[i][kind === 'real' ? 0 : 1] = geo.toStoredNode(x, y);
        }

        function computeGeometry() {
            const s = opts.getSettings();
            const [W, H] = opts.device.value.split('x').map(Number);
            geo = L.build(W, H, s.layout, positions, { mirror: opts.hand.value === 'left' });
            const counts = ['tmt_a', 'tmt_b'].filter(t => s.tasks[t].enabled).map(t => s.tasks[t].trialsPerBlock);
            trials = Math.min(L.MAX_TRIALS, Math.max(1, ...(counts.length ? counts : [s.tasks.tmt_b.trialsPerBlock])));
        }

        // ---- drawing --------------------------------------------------------------
        function drawNode(kind, i, { faint = false, current = false } = {}) {
            const c = centre(kind, i);
            const fake = kind === 'fake';
            const k = keyOf(kind, i);
            const g = el('g', { class: `pos-node${faint ? ' faint' : ''}`, 'data-kind': kind, 'data-i': i }, content);
            if (k === selected || (dragging && k === dragging.key)) {
                el('circle', { cx: c.x, cy: c.y, r: geo.r + 9, fill: 'none', stroke: '#1d4ed8', 'stroke-width': 5 }, g);
            }
            el('circle', {
                cx: c.x, cy: c.y, r: fake ? geo.r - 2 : geo.r,
                fill: fake ? '#fff' : '#000', stroke: fake ? '#8d8c86' : current ? '#1d4ed8' : 'none', 'stroke-width': fake ? 4 : 5,
            }, g);
            const t = el('text', { x: c.x, y: c.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': geo.r * 0.6, fill: fake ? '#5d5c57' : '#fff' }, g);
            t.textContent = labelOf(kind, i);
            const title = el('title', {}, g);
            title.textContent = kind === 'origin' ? 'Start dot' : `${fake ? 'Distractor' : 'Target'} for move ${i + 1}`;
        }

        function draw() {
            content.replaceChildren();
            const { W, H } = geo;
            svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
            el('rect', { x: 0, y: 0, width: W, height: H, rx: 24, fill: '#fff', stroke: '#c9c8c3', 'stroke-width': 4 }, content);
            if (geo.area !== 'full') {
                el('rect', { x: 6, y: geo.areaTop, width: W - 12, height: geo.areaHeight, rx: 18, fill: '#f3f6fd' }, content);
                const below = geo.area === 'top';
                const ty = below ? geo.areaTop + geo.areaHeight + 50 : geo.areaTop - 50;
                const t = el('text', { x: W / 2, y: ty, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': Math.max(16, W / 26), 'font-weight': 700, fill: '#1d4ed8' }, content);
                t.textContent = 'Place your finger on dot 1 to begin';
            }

            const move = opts.move.value;
            if (move === 'all') {
                const pts = [geo.origin];
                for (let i = 0; i < trials; i++) pts.push(geo.real(i));
                el('polyline', { points: pts.map(p => `${p.x},${p.y}`).join(' '), fill: 'none', stroke: '#2a78d6', 'stroke-width': 3, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round' }, content);
                for (let i = 0; i < trials; i++) drawNode('fake', i);
                for (let i = trials - 1; i >= 0; i--) drawNode('real', i);
                drawNode('origin', 0);
            } else {
                // One move, as the participant sees it: current dot, target, distractor.
                const m = Number(move);
                for (let i = 0; i < trials; i++) if (i !== m && i !== m - 1) drawNode('real', i, { faint: true });
                if (m !== 0) drawNode('origin', 0, { faint: true });
                const cur = m === 0 ? geo.origin : geo.real(m - 1);
                const tgt = geo.real(m);
                el('line', { x1: cur.x, y1: cur.y, x2: tgt.x, y2: tgt.y, stroke: '#2a78d6', 'stroke-width': 3, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round' }, content);
                drawNode('fake', m);
                drawNode('real', m);
                if (m === 0) drawNode('origin', 0, { current: true }); else drawNode('real', m - 1, { current: true });
            }
        }

        // ---- coordinate table -----------------------------------------------------------
        function cellInput(kind, i, axis) {
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '1';
            input.dataset.kind = kind;
            input.dataset.i = i;
            input.dataset.axis = axis;
            input.setAttribute('aria-label', `${kind === 'origin' ? 'Start dot' : `${kind === 'fake' ? 'Distractor' : 'Target'} move ${i + 1}`} ${axis}`);
            return input;
        }

        function buildTable() {
            const key = `${trials}|${task()}`;
            if (key === tableKey) return;
            tableKey = key;
            const body = opts.tableBody;
            body.replaceChildren();
            const row = (name, cells, kind, i) => {
                const tr = document.createElement('tr');
                tr.dataset.key = kind === 'origin' ? 'origin' : `real:${i}`;
                const th = document.createElement('th');
                th.scope = 'row';
                th.textContent = name;
                tr.appendChild(th);
                for (const c of cells) {
                    const td = document.createElement('td');
                    if (c instanceof Node) td.appendChild(c); else td.textContent = c;
                    if (c && c.dataset && c.dataset.kind === 'fake') td.dataset.fake = '1';
                    tr.appendChild(td);
                }
                body.appendChild(tr);
            };
            row('Start', [label(0), cellInput('origin', 0, 'x'), cellInput('origin', 0, 'y'), '', '', ''], 'origin', 0);
            for (let i = 0; i < trials; i++) {
                row(`Move ${i + 1}`, [label(i + 1), cellInput('real', i, 'x'), cellInput('real', i, 'y'),
                    label(i + 2), cellInput('fake', i, 'x'), cellInput('fake', i, 'y')], 'real', i);
            }
        }

        function fillTable() {
            for (const input of opts.tableBody.querySelectorAll('input')) {
                if (input === document.activeElement) continue;
                const c = centre(input.dataset.kind, Number(input.dataset.i));
                input.value = Math.round(input.dataset.axis === 'x' ? c.x : c.y);
            }
        }

        function info() {
            let gap = Infinity, prev = geo.origin;
            const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) - 2 * geo.r;
            for (let i = 0; i < trials; i++) {
                const a = geo.real(i), b = geo.fake(i);
                gap = Math.min(gap, d(prev, a), d(prev, b), d(a, b));
                prev = a;
            }
            const text = `Layout scaled to ${Math.round(geo.scale * 100)}% of the original. Closest dots on screen together: ${Math.round(gap)} px apart (edge to edge).`;
            opts.info.textContent = gap < 10 ? `${text} Some dots touch or overlap: move them apart, use a taller task area or smaller dots.` : text;
            opts.info.classList.toggle('warn', gap < 10);
        }

        function fillMoveSelect() {
            const sel = opts.move;
            const prev = sel.value;
            if (sel.options.length === trials + 1) return;
            sel.replaceChildren();
            const all = document.createElement('option');
            all.value = 'all';
            all.textContent = 'All moves';
            sel.appendChild(all);
            for (let i = 0; i < trials; i++) {
                const o = document.createElement('option');
                o.value = i;
                o.textContent = `Move ${i + 1} only`;
                sel.appendChild(o);
            }
            sel.value = [...sel.options].some(o => o.value === prev) ? prev : 'all';
        }

        function render() {
            computeGeometry();
            fillMoveSelect();
            buildTable();
            draw();
            fillTable();
            info();
        }

        // ---- interaction ----------------------------------------------------------------
        function svgPoint(evt) {
            const pt = svg.createSVGPoint();
            pt.x = evt.clientX;
            pt.y = evt.clientY;
            return pt.matrixTransform(svg.getScreenCTM().inverse());
        }

        svg.addEventListener('pointerdown', evt => {
            const g = evt.target.closest('.pos-node:not(.faint)');
            if (!g) return;
            evt.preventDefault();
            const kind = g.dataset.kind, i = Number(g.dataset.i);
            const p = svgPoint(evt), c = centre(kind, i);
            dragging = { kind, i, key: keyOf(kind, i), dx: c.x - p.x, dy: c.y - p.y, id: evt.pointerId };
            selected = dragging.key;
            svg.setPointerCapture(evt.pointerId);
            svg.classList.add('dragging');
            draw();
            highlightRow();
        });
        svg.addEventListener('pointermove', evt => {
            if (!dragging || evt.pointerId !== dragging.id) return;
            const p = svgPoint(evt);
            setCentre(dragging.kind, dragging.i, p.x + dragging.dx, p.y + dragging.dy);
            draw();
            fillTable();
            info();
            opts.onChange();
        });
        const endDrag = evt => {
            if (!dragging || evt.pointerId !== dragging.id) return;
            dragging = null;
            svg.classList.remove('dragging');
            draw();
        };
        svg.addEventListener('pointerup', endDrag);
        svg.addEventListener('pointercancel', endDrag);

        opts.tableBody.addEventListener('input', evt => {
            const input = evt.target;
            if (input.tagName !== 'INPUT' || input.value === '') return;
            const kind = input.dataset.kind, i = Number(input.dataset.i);
            const c = centre(kind, i);
            const v = Number(input.value);
            if (!Number.isFinite(v)) return;
            setCentre(kind, i, input.dataset.axis === 'x' ? v : c.x, input.dataset.axis === 'y' ? v : c.y);
            selected = keyOf(kind, i);
            draw();
            info();
            opts.onChange();
        });
        // show the clamped value once editing of a cell finishes
        opts.tableBody.addEventListener('focusout', () => setTimeout(fillTable));
        opts.tableBody.addEventListener('focusin', evt => {
            const input = evt.target;
            if (input.tagName !== 'INPUT') return;
            selected = keyOf(input.dataset.kind, Number(input.dataset.i));
            draw();
            highlightRow();
        });

        function highlightRow() {
            for (const tr of opts.tableBody.rows) {
                const kindKey = selected && selected.startsWith('fake:') ? selected.replace('fake:', 'real:') : selected;
                tr.classList.toggle('selected', tr.dataset.key === kindKey);
            }
        }

        opts.device.addEventListener('change', render);
        opts.labels.addEventListener('change', render);
        opts.move.addEventListener('change', render);
        opts.hand.addEventListener('change', render);

        return {
            render,
            setPositions(p) { positions = p ? clone(p) : L.defaultPositions(); selected = null; },
            getPositions() { return clone(positions); },
            resetPositions() { positions = L.defaultPositions(); selected = null; render(); opts.onChange(); },
            // the caller sets the preset's task area first; this then re-renders with it
            loadPreset(name) { positions = L.presetPositions(name); selected = null; render(); opts.onChange(); },
        };
    }

    global.PositionEditor = { create };
})(window);
