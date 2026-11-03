// Admin panel: login, task settings, participant results and plots.
(function () {
    'use strict';

    const $ = id => document.getElementById(id);
    const C = window.Charts;
    const TASK_NAME = { tmt_a: 'Crossroads-A', tmt_b: 'Crossroads-B' };
    const color = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    // ------------------------------------------------------------------ api
    async function api(path, opts = {}) {
        const r = await fetch(path, {
            ...opts,
            headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
            body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        });
        if (r.status === 401 && !path.endsWith('/login')) {
            showLogin();
            throw new Error('Not logged in');
        }
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
        return data;
    }

    function showLogin() {
        $('view-app').hidden = true;
        $('view-login').hidden = false;
        $('login-password').focus();
    }

    $('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        $('login-error').textContent = '';
        try {
            await api('/api/admin/login', { method: 'POST', body: { password: $('login-password').value } });
            $('login-password').value = '';
            startApp();
        } catch (err) {
            $('login-error').textContent = err.message;
        }
    });

    $('logout').addEventListener('click', async () => {
        await api('/api/admin/logout', { method: 'POST', body: {} }).catch(() => { });
        showLogin();
    });

    // --------------------------------------------------------------- router
    function route() {
        const hash = location.hash.replace(/^#/, '') || 'participants';
        const [tab, arg] = hash.split('/');
        const sections = ['participants', 'participant', 'settings', 'session'];
        const active = sections.includes(tab) ? tab : 'participants';
        for (const s of sections) $(`tab-${s}`).hidden = s !== active;
        window.scrollTo(0, 0);
        document.querySelectorAll('.tabs a').forEach(a => {
            const on = a.dataset.tab === (active === 'participant' ? 'participants' : active);
            a.classList.toggle('active', on);
            if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        if (active === 'participants') loadParticipants();
        if (active === 'participant') loadParticipant(Number(arg));
        if (active === 'settings') loadSettings();
        if (active === 'session') updateSessionLink();
    }
    window.addEventListener('hashchange', route);

    async function startApp() {
        $('view-login').hidden = true;
        $('view-app').hidden = false;
        route();
    }

    // ----------------------------------------------------- participants list
    let participants = [];
    const when = v => (v ? new Date(v).toLocaleString() : '–');

    async function loadParticipants() {
        try {
            participants = (await api('/api/admin/participants')).participants;
            renderParticipants();
        } catch (err) {
            console.error(err);
        }
    }

    function renderParticipants() {
        const q = $('pid-filter').value.trim();
        const rows = participants.filter(p => !q || String(p.pid).includes(q));
        const body = $('participants-body');
        body.replaceChildren();
        for (const p of rows) {
            const tr = document.createElement('tr');
            tr.className = 'link';
            tr.addEventListener('click', e => { if (e.target.tagName !== 'A') location.hash = `participant/${p.pid}`; });
            const cells = [
                () => { const a = document.createElement('a'); a.href = `#participant/${p.pid}`; a.textContent = p.pid; return a; },
                p.sessions,
                () => { const s = document.createElement('span'); s.className = `pill ${p.completed ? 'ok' : 'no'}`; s.textContent = p.completed ? 'Yes' : p.sessions ? 'No' : '–'; return s; },
                p.tmt_a, p.tmt_b, p.swipe, p.wrong, when(p.last),
            ];
            cells.forEach((c, i) => {
                const td = document.createElement('td');
                if (i >= 3 && i <= 6) td.className = 'num';
                if (typeof c === 'function') td.appendChild(c()); else td.textContent = c;
                tr.appendChild(td);
            });
            body.appendChild(tr);
        }
        $('participants-empty').hidden = rows.length > 0;
    }
    $('pid-filter').addEventListener('input', renderParticipants);
    $('refresh-participants').addEventListener('click', loadParticipants);

    // ---------------------------------------------------- participant detail
    let detail = null;
    const LEGACY = '__legacy__';
    const sessionKey = v => v || LEGACY;
    const mean = a => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
    const sd = a => {
        if (a.length < 2) return null;
        const m = mean(a);
        return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
    };

    async function loadParticipant(pid) {
        if (!Number.isInteger(pid)) { location.hash = 'participants'; return; }
        $('p-title').textContent = `Participant ${pid}`;
        $('p-export-tmt').href = `/api/admin/export.csv?table=test_results&pid=${pid}`;
        $('p-export-swipe').href = `/api/admin/export.csv?table=max_speed&pid=${pid}`;
        $('p-delete-confirm').value = '';
        $('p-delete').disabled = true;
        try {
            detail = await api(`/api/admin/participants/${pid}`);
        } catch (err) {
            console.error(err);
            return;
        }
        // Session choices: newest first. Rows recorded before sessions existed are grouped as "legacy".
        const started = new Map(detail.sessions.map(s => [s.id, s.started_at]));
        const keys = new Set([...detail.sessions.map(s => s.id), ...detail.blocks.map(b => sessionKey(b.session_id)), ...detail.swipe.map(s => sessionKey(s.session_id))]);
        const hasData = k => detail.blocks.some(b => sessionKey(b.session_id) === k) || detail.swipe.some(s => sessionKey(s.session_id) === k);
        const ordered = [...keys].sort((a, b) => new Date(started.get(b) || 0) - new Date(started.get(a) || 0));
        const sel = $('p-session');
        sel.replaceChildren();
        for (const k of ordered) {
            const o = document.createElement('option');
            o.value = k;
            const s = detail.sessions.find(x => x.id === k);
            o.textContent = k === LEGACY ? 'Before sessions (legacy data)'
                : `${when(s && s.started_at)}${s && s.completed_at ? ' · finished' : ''}${hasData(k) ? '' : ' · no data'}`;
            sel.appendChild(o);
        }
        sel.value = ordered.find(hasData) || ordered[0] || '';
        sel.closest('label').hidden = ordered.length < 2;
        renderParticipant();
    }
    $('p-session').addEventListener('change', renderParticipant);

    function currentBlocks() {
        const k = $('p-session').value;
        return detail.blocks.filter(b => sessionKey(b.session_id) === k);
    }

    function swipeSeries(rows) {
        // speed in px/s, averaged over 100 ms bins; null = finger not on screen
        let dist = 0, active = 0, prev = null, segStart = null;
        const bins = new Map();
        const contact = [];
        for (const q of rows) {
            if (q.coordx < 0) {
                if (prev) contact.push([segStart, prev.coordt]);
                prev = null;
                continue;
            }
            if (!prev) segStart = q.coordt;
            if (prev) {
                const dt = q.coordt - prev.coordt;
                const d = Math.hypot(q.coordx - prev.coordx, q.coordy - prev.coordy);
                if (dt > 0) {
                    dist += d;
                    active += dt;
                    const b = Math.floor(q.coordt / 100);
                    bins.set(b, (bins.get(b) || 0) + d);
                }
            }
            prev = q;
        }
        if (prev) contact.push([segStart, prev.coordt]);
        const onScreen = new Set();
        for (const [a, b] of contact) for (let k = Math.floor(a / 100); k <= Math.floor(b / 100); k++) onScreen.add(k);
        const last = Math.max(0, ...onScreen);
        const points = [];
        for (let k = 0; k <= last; k++) points.push({ x: (k + 0.5) / 10, y: onScreen.has(k) ? (bins.get(k) || 0) * 10 : null });
        const ys = points.map(p => p.y).filter(v => v !== null);
        return {
            points,
            mean: active ? (dist / active) * 1000 : null,
            peak: ys.length ? Math.max(...ys) : null,
            lifts: Math.max(0, rows.filter(q => q.coordx === -1).length),
            activeSec: active / 1000,
        };
    }

    function tile(label, value, note) {
        const d = document.createElement('div');
        d.className = 'tile';
        const l = document.createElement('div'); l.className = 'label'; l.textContent = label;
        const v = document.createElement('div'); v.className = 'value'; v.textContent = value;
        d.append(l, v);
        if (note) { const n = document.createElement('div'); n.className = 'note'; n.textContent = note; d.appendChild(n); }
        return d;
    }

    function renderParticipant() {
        const blocks = currentBlocks();
        const A = blocks.filter(b => b.task === 'tmt_a');
        const B = blocks.filter(b => b.task === 'tmt_b');
        const secs = list => list.map(b => b.duration_ms / 1000);
        const mA = mean(secs(A)), mB = mean(secs(B));
        const swipeRows = detail.swipe.filter(s => sessionKey(s.session_id) === $('p-session').value);
        const sw = swipeSeries(swipeRows);
        const sum = (list, k) => list.reduce((s, b) => s + b[k], 0);
        const f = (v, unit = '', d = 1) => (v === null || !Number.isFinite(v) ? '–' : `${C.fmt(v, d)}${unit}`);

        const tiles = $('p-tiles');
        tiles.replaceChildren(
            tile('Crossroads-A mean time', f(mA, ' s'), A.length ? `${A.length} rounds · SD ${f(sd(secs(A)), ' s')}` : 'No rounds'),
            tile('Crossroads-B mean time', f(mB, ' s'), B.length ? `${B.length} rounds · SD ${f(sd(secs(B)), ' s')}` : 'No rounds'),
            tile('B − A', f(mA !== null && mB !== null ? mB - mA : null, ' s'), 'Mean B time minus mean A time'),
            tile('B ÷ A', f(mA && mB !== null ? mB / mA : null, '', 2), 'Ratio of mean times'),
            tile('Wrong-dot errors', `${sum(A, 'wrong')} / ${sum(B, 'wrong')}`, 'A / B, total'),
            tile('Finger lifts', `${sum(A, 'lifts')} / ${sum(B, 'lifts')}`, 'A / B, total'),
            tile('Swiping mean speed', f(sw.mean, ' px/s', 0), swipeRows.length ? `${f(sw.activeSec, ' s')} on screen · ${sw.lifts} lifts` : 'No swiping data'),
            tile('Swiping peak speed', f(sw.peak, ' px/s', 0), 'Fastest 100 ms window'),
        );

        const blue = color('--series-a'), orange = color('--series-b');
        C.lineChart($('chart-times'), {
            series: [
                { name: 'Crossroads-A', shortName: 'A', color: blue, points: A.map(b => ({ x: b.blockno, y: b.duration_ms / 1000 })) },
                { name: 'Crossroads-B', shortName: 'B', color: orange, points: B.map(b => ({ x: b.blockno, y: b.duration_ms / 1000 })) },
            ],
            integerX: true,
            xLabel: 'Round',
            yLabel: 'Seconds',
            endLabel: v => `${C.fmt(v)} s`,
            tipFormat: v => `${C.fmt(v, 2)} s`,
            tipTitle: v => `Round ${v}`,
            label: 'Round completion time for Crossroads-A and B',
            empty: 'No Crossroads rounds recorded',
        });

        const rounds = [...new Set(blocks.map(b => b.blockno))].sort((a, b) => a - b);
        const errBox = $('chart-errors');
        errBox.replaceChildren();
        const wrongBox = document.createElement('div');
        const liftBox = document.createElement('div');
        errBox.append(wrongBox, liftBox);
        const values = (list, k) => new Map(list.map(b => [b.blockno, b[k]]));
        if (rounds.length) {
            const items = [{ name: 'Crossroads-A', color: blue, kind: 'rect' }, { name: 'Crossroads-B', color: orange, kind: 'rect' }];
            const lg = document.createElement('div');
            lg.className = 'legend';
            for (const it of items) {
                const s = document.createElement('span');
                const k = document.createElement('i'); k.className = 'key-rect'; k.style.background = it.color;
                s.append(k, document.createTextNode(it.name));
                lg.appendChild(s);
            }
            errBox.prepend(lg);
        }
        C.groupedBars(wrongBox, {
            title: 'Wrong-dot touches', xs: rounds, xLabel: 'Round', height: 150,
            series: [{ name: 'Crossroads-A', color: blue, values: values(A, 'wrong') }, { name: 'Crossroads-B', color: orange, values: values(B, 'wrong') }],
        });
        C.groupedBars(liftBox, {
            title: 'Finger lifts', xs: rounds, xLabel: 'Round', height: 150,
            series: [{ name: 'Crossroads-A', color: blue, values: values(A, 'lifts') }, { name: 'Crossroads-B', color: orange, values: values(B, 'lifts') }],
        });

        C.lineChart($('chart-swipe'), {
            series: [{ name: 'Speed', color: color('--series-swipe'), points: sw.points }],
            markers: false,
            endLabels: false,
            xLabel: 'Seconds',
            yLabel: 'px/s',
            yFormat: v => (v >= 10000 ? `${v / 1000}K` : C.fmt(v, 0)),
            tipFormat: v => `${C.fmt(v, 0)} px/s`,
            tipTitle: v => `${C.fmt(v, 1)} s`,
            label: 'Swiping speed over time',
            empty: 'No swiping data for this session',
        });

        // rounds table
        const tb = $('p-blocks');
        tb.replaceChildren();
        for (const b of blocks) {
            const tr = document.createElement('tr');
            const vals = [TASK_NAME[b.task] || b.task, b.blockno, C.fmt(b.duration_ms / 1000, 2), b.wrong, b.lifts, b.off_course, b.samples, when(b.created_at), b.session_id ? b.session_id.slice(0, 8) : 'legacy'];
            vals.forEach((v, i) => {
                const td = document.createElement('td');
                if (i >= 1 && i <= 6) td.className = 'num';
                td.textContent = v;
                tr.appendChild(td);
            });
            tb.appendChild(tr);
        }

        // trajectory selectors
        const tsel = $('traj-task');
        const tasksPresent = ['tmt_a', 'tmt_b'].filter(t => blocks.some(b => b.task === t));
        for (const o of tsel.options) o.disabled = !tasksPresent.includes(o.value);
        if (!tasksPresent.includes(tsel.value) && tasksPresent.length) tsel.value = tasksPresent[0];
        fillTrajRounds();
    }

    function fillTrajRounds() {
        const task = $('traj-task').value;
        const sel = $('traj-block');
        const prev = sel.value;
        sel.replaceChildren();
        const list = currentBlocks().filter(b => b.task === task);
        for (const b of list) {
            const o = document.createElement('option');
            o.value = b.blockno;
            o.textContent = b.blockno;
            sel.appendChild(o);
        }
        if (list.some(b => String(b.blockno) === prev)) sel.value = prev;
        loadTrajectory();
    }

    async function loadTrajectory() {
        const box = $('chart-traj');
        const block = $('traj-block').value;
        if (!block) { C.trajectory(box, []); return; }
        const k = $('p-session').value;
        const q = new URLSearchParams({ task: $('traj-task').value, block });
        if (k !== LEGACY) q.set('session', k);
        try {
            const { rows } = await api(`/api/admin/participants/${detail.pid}/trajectory?${q}`);
            C.trajectory(box, rows);
        } catch (err) {
            console.error(err);
        }
    }
    $('traj-task').addEventListener('change', fillTrajRounds);
    $('traj-block').addEventListener('change', loadTrajectory);

    $('p-delete-confirm').addEventListener('input', e => {
        $('p-delete').disabled = !detail || e.target.value.trim() !== String(detail.pid);
    });
    $('p-delete').addEventListener('click', async () => {
        if (!detail || $('p-delete-confirm').value.trim() !== String(detail.pid)) return;
        $('p-delete').disabled = true;
        try {
            await api(`/api/admin/participants/${detail.pid}`, { method: 'DELETE', body: {} });
            location.hash = 'participants';
        } catch (err) {
            alert(err.message);
        }
    });

    // --------------------------------------------------------------- settings
    let defaults = null, maxTrials = 50;
    const form = $('settings-form');
    const get = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
    function set(obj, path, v) {
        const keys = path.split('.');
        let o = obj;
        for (const k of keys.slice(0, -1)) o = o[k] = o[k] || {};
        o[keys[keys.length - 1]] = v;
    }

    function fillForm(cfg) {
        for (const input of form.elements) {
            if (!input.name) continue;
            const v = get(cfg, input.name);
            if (input.type === 'checkbox') input.checked = !!v;
            else input.value = v;
        }
        onFormChange(false);
    }

    function readForm() {
        const cfg = {};
        for (const input of form.elements) {
            if (!input.name) continue;
            set(cfg, input.name, input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value);
        }
        return cfg;
    }

    function setStatus(id, text, kind) {
        const s = $(id);
        s.textContent = text;
        s.className = `save-status ${kind || ''}`;
    }

    function onFormChange(dirty = true) {
        const cfg = readForm();
        $('hint-a-blocks').hidden = !(cfg.tasks.tmt_a.enabled && cfg.tasks.tmt_a.blocks < 3);
        $('hint-moves').hidden = cfg.tasks.tmt_a.trialsPerBlock === cfg.tasks.tmt_b.trialsPerBlock;
        form.elements['layout.areaHeightPct'].disabled = cfg.layout.area === 'full';
        renderPreview(cfg);
        if (dirty) setStatus('settings-status', 'Unsaved changes');
    }

    function renderPreview(cfg) {
        const [W, H] = $('preview-device').value.split('x').map(Number);
        const trials = Math.min(maxTrials, cfg.tasks.tmt_b.trialsPerBlock || 10);
        const g = C.layoutPreview($('layout-preview'), W, H, cfg.layout, trials, 'tmt_b');
        // smallest edge-to-edge gap between dots that are on screen together
        let gap = Infinity, origin = g.origin;
        const d = (p, q) => Math.hypot(p.x - q.x, p.y - q.y) - 2 * g.r;
        for (let i = 0; i < trials; i++) {
            const a = g.real(i), b = g.fake(i);
            gap = Math.min(gap, d(origin, a), d(origin, b), d(a, b));
            origin = a;
        }
        const info = `Layout scaled to ${Math.round(g.scale * 100)}% of the original. Closest dots on screen together: ${Math.round(gap)} px apart (edge to edge).`;
        $('preview-info').textContent = gap < 10 ? `${info} Dots touch or overlap on this screen: use a taller task area or smaller dots.` : info;
    }

    async function loadSettings() {
        try {
            const data = await api('/api/admin/config');
            defaults = data.defaults;
            maxTrials = data.maxTrials;
            fillForm(data.config);
            setStatus('settings-status', '');
        } catch (err) {
            setStatus('settings-status', err.message, 'err');
        }
    }

    form.addEventListener('input', () => onFormChange(true));
    form.addEventListener('submit', e => e.preventDefault());
    $('preview-device').addEventListener('change', () => renderPreview(readForm()));
    $('settings-reset').addEventListener('click', () => { if (defaults) { fillForm(defaults); setStatus('settings-status', 'Defaults loaded, not saved yet'); } });
    $('settings-save').addEventListener('click', async () => {
        setStatus('settings-status', 'Saving…');
        try {
            const { config } = await api('/api/admin/config', { method: 'PUT', body: readForm() });
            fillForm(config);
            setStatus('settings-status', 'Saved', 'ok');
        } catch (err) {
            setStatus('settings-status', err.message, 'err');
        }
    });

    // ------------------------------------------------------- start a session
    function updateSessionLink() {
        const pid = $('session-pid').value.trim();
        const link = `${location.origin}/${pid ? `?pid=${encodeURIComponent(pid)}` : ''}`;
        $('session-link').value = link;
        $('session-open').href = link;
    }
    $('session-pid').addEventListener('input', updateSessionLink);
    $('session-copy').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText($('session-link').value);
            setStatus('session-status', 'Copied', 'ok');
        } catch {
            $('session-link').select();
            setStatus('session-status', 'Select the link and copy it');
        }
    });

    // ------------------------------------------------------------------ boot
    api('/api/admin/me').then(startApp).catch(() => { });
})();
