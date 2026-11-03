// Small dependency-free SVG charts for the admin panel.
(function (global) {
    'use strict';

    const NS = 'http://www.w3.org/2000/svg';
    const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const fmt = (v, d = 1) => (v === null || v === undefined || !Number.isFinite(v) ? '–' : v.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 }));

    function el(tag, attrs = {}, parent) {
        const e = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
        if (parent) parent.appendChild(e);
        return e;
    }

    function niceTicks(max, count = 5) {
        if (!(max > 0)) return [0, 1];
        const raw = max / count;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
        const ticks = [];
        for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(+v.toFixed(10));
        if (ticks[ticks.length - 1] < max) ticks.push(+(ticks[ticks.length - 1] + step).toFixed(10));
        return ticks;
    }

    // ---- shared tooltip -------------------------------------------------
    const tip = () => document.getElementById('tooltip');
    function showTip(evt, title, rows) {
        const t = tip();
        t.replaceChildren();
        const head = document.createElement('div');
        head.className = 'tt-title';
        head.textContent = title;
        t.appendChild(head);
        for (const r of rows) {
            const row = document.createElement('div');
            row.className = 'tt-row';
            const key = document.createElement('span');
            key.className = 'tt-key';
            key.style.background = r.color || 'transparent';
            const val = document.createElement('strong');
            val.textContent = r.value;
            const name = document.createElement('span');
            name.className = 'tt-name';
            name.textContent = r.name;
            row.append(key, val, name);
            t.appendChild(row);
        }
        t.hidden = false;
        const pad = 14;
        const w = t.offsetWidth, h = t.offsetHeight;
        let x = evt.clientX + pad, y = evt.clientY + pad;
        if (x + w > window.innerWidth - 8) x = evt.clientX - w - pad;
        if (y + h > window.innerHeight - 8) y = evt.clientY - h - pad;
        t.style.left = `${x}px`;
        t.style.top = `${y}px`;
    }
    const hideTip = () => { tip().hidden = true; };

    function legend(container, items) {
        const lg = document.createElement('div');
        lg.className = 'legend';
        for (const it of items) {
            const s = document.createElement('span');
            const k = document.createElement('i');
            k.className = `key-${it.kind || 'line'}`;
            if (it.kind === 'ring') k.style.borderColor = it.color;
            else k.style.background = it.color;
            s.append(k, document.createTextNode(it.name));
            lg.appendChild(s);
        }
        container.appendChild(lg);
    }

    // Re-render when the container width changes.
    function responsive(container, render) {
        let lastW = 0;
        const run = () => {
            const w = Math.round(container.clientWidth);
            if (w && w !== lastW) { lastW = w; render(w); }
        };
        if (container._ro) container._ro.disconnect();
        container._ro = new ResizeObserver(run);
        container._ro.observe(container);
        run();
    }

    function axes(svg, m, W, H, yTicks, y, yFmt, xTicks, x, xFmt, xLabel, yLabel) {
        const grid = css('--grid'), muted = css('--text-secondary');
        for (const v of yTicks) {
            el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: grid, 'stroke-width': 1 }, svg);
            const t = el('text', { x: m.l - 8, y: y(v), 'text-anchor': 'end', 'dominant-baseline': 'middle', fill: muted, 'font-size': 12 }, svg);
            t.textContent = yFmt(v);
        }
        for (const v of xTicks) {
            const t = el('text', { x: x(v), y: H - m.b + 18, 'text-anchor': 'middle', fill: muted, 'font-size': 12 }, svg);
            t.textContent = xFmt(v);
        }
        if (xLabel) {
            const t = el('text', { x: (m.l + W - m.r) / 2, y: H - 4, 'text-anchor': 'middle', fill: muted, 'font-size': 12 }, svg);
            t.textContent = xLabel;
        }
        if (yLabel) {
            const t = el('text', { x: 12, y: (m.t + H - m.b) / 2, 'text-anchor': 'middle', fill: muted, 'font-size': 12, transform: `rotate(-90 12 ${(m.t + H - m.b) / 2})` }, svg);
            t.textContent = yLabel;
        }
    }

    // ---- line chart -------------------------------------------------------
    // series: [{ name, color, points: [{ x, y }] }]  (y === null splits the line)
    function lineChart(container, opts) {
        container.replaceChildren();
        const series = opts.series.filter(s => s.points.some(p => p.y !== null));
        if (!series.length) {
            const e = document.createElement('div');
            e.className = 'empty';
            e.textContent = opts.empty || 'No data yet';
            container.appendChild(e);
            return;
        }
        if (series.length > 1) legend(container, series.map(s => ({ name: s.name, color: s.color })));
        const host = document.createElement('div');
        container.appendChild(host);

        responsive(host, W => {
            host.replaceChildren();
            const H = opts.height || 260;
            const labelRoom = series.length <= 4 && opts.endLabels !== false ? 90 : 16;
            const m = { l: 68, r: labelRoom, t: 12, b: 40 };
            const xs = series.flatMap(s => s.points.map(p => p.x));
            let x0 = Math.min(...xs), x1 = Math.max(...xs);
            if (opts.integerX) { x0 -= 0.5; x1 += 0.5; }
            if (x1 === x0) x1 = x0 + 1;
            const yMax = Math.max(...series.flatMap(s => s.points.map(p => p.y || 0)));
            const yTicks = niceTicks(yMax);
            const yTop = yTicks[yTicks.length - 1];
            const x = v => m.l + ((v - x0) / (x1 - x0)) * (W - m.l - m.r);
            const y = v => H - m.b - (v / yTop) * (H - m.t - m.b);

            const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': opts.label || '' }, host);
            let xTicks;
            if (opts.integerX) {
                const lo = Math.ceil(x0), hi = Math.floor(x1);
                const step = Math.max(1, Math.ceil((hi - lo + 1) / Math.max(2, Math.floor((W - m.l - m.r) / 40))));
                xTicks = [];
                for (let v = lo; v <= hi; v += step) xTicks.push(v);
            } else {
                xTicks = niceTicks(x1).filter(v => v >= x0 && v <= x1);
            }
            axes(svg, m, W, H, yTicks, y, opts.yFormat || (v => fmt(v)), xTicks, x, opts.xFormat || (v => fmt(v)), opts.xLabel, opts.yLabel);

            const surface = css('--surface-card');
            for (const s of series) {
                let d = '', pen = false;
                for (const p of s.points) {
                    if (p.y === null) { pen = false; continue; }
                    d += `${pen ? 'L' : 'M'}${x(p.x).toFixed(1)},${y(p.y).toFixed(1)}`;
                    pen = true;
                }
                el('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
                if (opts.markers !== false) {
                    for (const p of s.points) {
                        if (p.y === null) continue;
                        el('circle', { cx: x(p.x), cy: y(p.y), r: 4, fill: s.color, stroke: surface, 'stroke-width': 2 }, svg);
                    }
                }
            }

            // direct end labels (skipped when they would collide)
            if (labelRoom > 16) {
                const ends = series.map(s => {
                    const last = [...s.points].reverse().find(p => p.y !== null);
                    return { s, last, py: y(last.y) };
                }).sort((a, b) => a.py - b.py);
                const collide = ends.some((e, i) => i && e.py - ends[i - 1].py < 16);
                if (!collide) {
                    for (const e of ends) {
                        const t = el('text', { x: x(e.last.x) + 8, y: e.py, 'dominant-baseline': 'middle', 'font-size': 12, fill: css('--text-primary') }, svg);
                        t.textContent = `${(opts.endLabel || (v => fmt(v)))(e.last.y)} ${series.length > 1 ? e.s.shortName || e.s.name : ''}`.trim();
                    }
                }
            }

            // crosshair + tooltip
            const allX = [...new Set(xs)].sort((a, b) => a - b);
            const cross = el('line', { y1: m.t, y2: H - m.b, stroke: css('--text-muted'), 'stroke-width': 1, visibility: 'hidden' }, svg);
            const hit = el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: 'transparent' }, svg);
            hit.addEventListener('pointermove', evt => {
                const rect = svg.getBoundingClientRect();
                const px = (evt.clientX - rect.left) * (W / rect.width);
                const v = x0 + ((px - m.l) / (W - m.l - m.r)) * (x1 - x0);
                let best = allX[0];
                for (const c of allX) if (Math.abs(c - v) < Math.abs(best - v)) best = c;
                cross.setAttribute('x1', x(best));
                cross.setAttribute('x2', x(best));
                cross.setAttribute('visibility', 'visible');
                const rows = series.map(s => {
                    const p = s.points.find(q => q.x === best);
                    return { name: s.name, color: s.color, value: p && p.y !== null ? (opts.tipFormat || (v => fmt(v, 2)))(p.y) : '–' };
                });
                showTip(evt, (opts.tipTitle || (v => `${opts.xLabel || 'x'} ${fmt(v, 2)}`))(best), rows);
            });
            hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); hideTip(); });
        });
    }

    // ---- grouped bars ---------------------------------------------------------
    // xs: category values; series: [{ name, color, values: Map(x -> number) }]
    function groupedBars(container, opts) {
        container.replaceChildren();
        const series = opts.series.filter(s => s.values.size);
        if (opts.title) {
            const h = document.createElement('div');
            h.className = 'muted';
            h.textContent = opts.title;
            container.appendChild(h);
        }
        if (!series.length) {
            const e = document.createElement('div');
            e.className = 'empty';
            e.textContent = 'No data yet';
            container.appendChild(e);
            return;
        }
        const host = document.createElement('div');
        container.appendChild(host);
        responsive(host, W => {
            host.replaceChildren();
            const H = opts.height || 180;
            const m = { l: 40, r: 8, t: 10, b: 40 };
            const xs = opts.xs;
            const max = Math.max(1, ...series.flatMap(s => [...s.values.values()]));
            const yTicks = niceTicks(max, Math.min(4, max)).filter(v => Number.isInteger(v));
            const yTop = yTicks[yTicks.length - 1];
            const band = (W - m.l - m.r) / xs.length;
            const barW = Math.min(24, (band * 0.8 - 2 * (series.length - 1)) / series.length);
            const y = v => H - m.b - (v / yTop) * (H - m.t - m.b);
            const xc = i => m.l + band * (i + 0.5);
            const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': opts.title || '' }, host);
            const step = Math.max(1, Math.ceil(xs.length / Math.max(2, Math.floor((W - m.l - m.r) / 32))));
            axes(svg, m, W, H, yTicks, y, v => fmt(v, 0), [], () => 0, () => '', opts.xLabel);
            xs.forEach((v, i) => {
                if (i % step) return;
                const t = el('text', { x: xc(i), y: H - m.b + 18, 'text-anchor': 'middle', fill: css('--text-secondary'), 'font-size': 12 }, svg);
                t.textContent = v;
            });
            const groupW = series.length * barW + (series.length - 1) * 2;
            xs.forEach((v, i) => {
                series.forEach((s, j) => {
                    if (!s.values.has(v)) return;
                    const val = s.values.get(v);
                    const bx = xc(i) - groupW / 2 + j * (barW + 2);
                    const top = y(val), base = y(0);
                    const h = Math.max(0, base - top);
                    const rr = Math.min(4, h, barW / 2);
                    const path = h === 0
                        ? `M${bx},${base - 1}h${barW}v1h${-barW}z`
                        : `M${bx},${base}V${top + rr}Q${bx},${top} ${bx + rr},${top}H${bx + barW - rr}Q${bx + barW},${top} ${bx + barW},${top + rr}V${base}Z`;
                    el('path', { d: path, fill: s.color }, svg);
                    const hit = el('rect', { x: bx - 1, y: m.t, width: barW + 2, height: H - m.t - m.b, fill: 'transparent' }, svg);
                    hit.addEventListener('pointermove', evt => showTip(evt, `${opts.xLabel || ''} ${v}`.trim(), [{ name: s.name, color: s.color, value: fmt(val, 0) }]));
                    hit.addEventListener('pointerleave', hideTip);
                });
            });
        });
    }

    // ---- finger path ----------------------------------------------------------
    function trajectory(container, rows) {
        container.replaceChildren();
        if (!rows.length) {
            const e = document.createElement('div');
            e.className = 'empty';
            e.textContent = 'No samples for this round';
            container.appendChild(e);
            return;
        }
        const r = rows.find(q => q.node_radius)?.node_radius || 40;
        const valid = rows.filter(q => q.coordx >= 0);
        let W = rows[0].screen_w, H = rows[0].screen_h;
        if (!W || !H) {
            W = Math.max(...valid.map(q => q.coordx), ...rows.map(q => q.realpointx + 2 * r)) + 20;
            H = Math.max(...valid.map(q => q.coordy), ...rows.map(q => q.realpointy + 2 * r)) + 20;
        }
        const path = css('--series-a'), crit = css('--status-critical'), warn = css('--status-warning');
        legend(container, [
            { name: 'Finger path', color: path },
            { name: 'Target dot', color: '#000', kind: 'dot' },
            { name: 'Distractor shown', color: '#9a9994', kind: 'ring' },
            { name: 'Wrong dot (✕)', color: crit, kind: 'dot' },
            { name: 'Finger lifted', color: warn, kind: 'ring' },
        ]);
        const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Recorded finger path' }, container);
        el('rect', { x: 0, y: 0, width: W, height: H, rx: 16, class: 'traj-frame' }, svg);

        // targets and distractors in the order they were shown
        const targets = new Map(), fakes = new Map();
        for (const q of rows) {
            if (q.realpointid !== null && !targets.has(q.realpointid)) targets.set(q.realpointid, q);
            if (q.fakepointid !== null && !fakes.has(q.fakepointid)) fakes.set(q.fakepointid, q);
        }
        for (const [id, q] of fakes) {
            if (targets.has(id)) continue; // a later target with the same label is drawn as a target
            el('circle', { cx: q.fakepointx + r, cy: q.fakepointy + r, r: r * 0.9, fill: 'none', stroke: '#9a9994', 'stroke-width': 3 }, svg);
            const t = el('text', { x: q.fakepointx + r, y: q.fakepointy + r, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': r * 0.6, fill: '#7a7974' }, svg);
            t.textContent = id;
        }

        // path segments, split at lifts (-1) and wrong-dot events (-2)
        let d = '', pen = false, last = null;
        const events = [];
        for (const q of rows) {
            if (q.coordx < 0) {
                if (last) events.push({ kind: q.coordx === -2 ? 'wrong' : 'lift', x: last.coordx, y: last.coordy, t: q.coordt, target: q.realpointid });
                pen = false;
                continue;
            }
            d += `${pen ? 'L' : 'M'}${q.coordx},${q.coordy}`;
            pen = true;
            last = q;
        }
        el('path', { d, fill: 'none', stroke: path, 'stroke-width': Math.max(2, W / 400), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.85 }, svg);

        for (const [id, q] of targets) {
            el('circle', { cx: q.realpointx + r, cy: q.realpointy + r, r: r * 0.9, fill: '#000', opacity: 0.85 }, svg);
            const t = el('text', { x: q.realpointx + r, y: q.realpointy + r, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': r * 0.6, fill: '#fff' }, svg);
            t.textContent = id;
        }

        const first = valid[0];
        if (first) {
            el('circle', { cx: first.coordx, cy: first.coordy, r: r * 0.35, fill: '#fff', stroke: '#000', 'stroke-width': 3 }, svg);
        }
        const s = Math.max(8, r * 0.3);
        for (const e of events) {
            if (e.kind === 'wrong') {
                el('path', { d: `M${e.x - s},${e.y - s}L${e.x + s},${e.y + s}M${e.x + s},${e.y - s}L${e.x - s},${e.y + s}`, stroke: crit, 'stroke-width': s / 2.2, 'stroke-linecap': 'round' }, svg);
            } else {
                el('circle', { cx: e.x, cy: e.y, r: s, fill: 'none', stroke: warn, 'stroke-width': s / 2.5 }, svg);
            }
            const hit = el('circle', { cx: e.x, cy: e.y, r: Math.max(24, s * 1.6), fill: 'transparent' }, svg);
            hit.addEventListener('pointermove', evt => showTip(evt, e.kind === 'wrong' ? 'Wrong dot' : 'Finger lifted',
                [{ name: 'into the round', value: `${fmt(e.t / 1000, 2)} s` }, { name: 'heading to', value: e.target ?? '–' }]));
            hit.addEventListener('pointerleave', hideTip);
        }
    }

    global.Charts = { lineChart, groupedBars, trajectory, fmt };
})(window);
