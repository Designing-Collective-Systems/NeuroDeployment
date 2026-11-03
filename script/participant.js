// Participant app: welcome -> overview -> (intro + rounds) per task -> thanks.
(function () {
    'use strict';

    const L = window.TMTLayout;
    const ORDER = ['tmt_a', 'tmt_b', 'swipe']; // Crossroads-A always runs before B (standard clinical order)
    const TASK_INFO = {
        tmt_a: { title: 'Connect the numbers', blurb: () => 'Slide your finger from number to number, in order: 1, 2, 3 …' },
        tmt_b: { title: 'Numbers and letters', blurb: () => 'Slide your finger between numbers and letters, in order: 1, A, 2, B, 3 …' },
        swipe: { title: 'Fast swiping', blurb: c => `Slide your finger around the screen as fast as you can for ${c.durationSec} seconds.` },
    };
    const STORE_KEY = 'tmt_state_v1';
    const OUTBOX_KEY = 'tmt_outbox_v1';

    const $ = id => document.getElementById(id);
    let urlPid = new URLSearchParams(location.search).get('pid');

    let state = null;      // { sessionId, pid, config, plan, stage, taskIdx, blockIdx, finished }
    let stopDemo = null;
    let teardown = null;   // removes listeners of the running task
    let errorDialogClosed = () => { };

    // ------------------------------------------------------------------ utils
    function uuid() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        const b = crypto.getRandomValues(new Uint8Array(16));
        return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    function saveState() {
        try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
    }
    function loadState() {
        try { return JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch { return null; }
    }
    function clearState() {
        state = null;
        try { sessionStorage.removeItem(STORE_KEY); } catch { /* ignore */ }
    }
    const times = n => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);
    const currentTask = () => state.plan[state.taskIdx];
    const taskCfg = task => state.config.tasks[task];
    const blocksFor = task => (task === 'swipe' ? 1 : taskCfg(task).blocks);

    function show(id) {
        if (stopDemo && id !== 'screen-intro') { stopDemo(); stopDemo = null; }
        document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== id; });
        window.scrollTo(0, 0);
    }

    function renderStepper(el, activeIdx, doneCount) {
        if (!el) return; // progress strip is commented out in index.html
        el.innerHTML = '';
        state.plan.forEach((task, i) => {
            const li = document.createElement('li');
            const done = i < doneCount;
            li.className = done ? 'done' : i === activeIdx ? 'current' : '';
            li.textContent = `${done ? '✓ ' : ''}${i + 1}. ${TASK_INFO[task].title}`;
            if (i === activeIdx && !done) li.setAttribute('aria-current', 'step');
            el.appendChild(li);
        });
    }

    // Large touch-friendly buttons: react on click (works for touch, mouse and keyboard).
    function onPress(el, fn) {
        el.addEventListener('click', e => { e.preventDefault(); fn(); });
    }

    // ----------------------------------------------------------- data upload
    // Results are queued in localStorage and retried until the server confirms,
    // so a dropped connection never loses a round.
    let outbox = [];
    try { outbox = JSON.parse(localStorage.getItem(OUTBOX_KEY)) || []; } catch { outbox = []; }
    let flushing = false, retryTimer = null;

    function persistOutbox() {
        try { localStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox)); } catch { /* keep in memory */ }
        updateSyncStatus();
    }
    function enqueue(url, body) {
        outbox.push({ url, body });
        persistOutbox();
        flush();
    }
    async function flush() {
        if (flushing) return;
        flushing = true;
        clearTimeout(retryTimer);
        while (outbox.length) {
            const item = outbox[0];
            try {
                const r = await fetch(item.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item.body) });
                if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
                if (!r.ok) console.error('Upload rejected', r.status, await r.text());
                outbox.shift();
                persistOutbox();
            } catch (err) {
                console.warn('Upload failed, will retry', err);
                retryTimer = setTimeout(flush, 5000);
                break;
            }
        }
        flushing = false;
        updateSyncStatus();
    }
    function updateSyncStatus() {
        const el = $('thanks-sync');
        if (el) el.textContent = outbox.length ? 'Saving results… please keep this page open.' : 'All results have been saved.';
    }
    window.addEventListener('online', flush);

    // --------------------------------------------------------------- session
    async function ensureSession() {
        if (state && state.sessionId) return;
        const r = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pid: urlPid, screen: { w: window.innerWidth, h: window.innerHeight } }),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        const plan = ORDER.filter(t => data.config.tasks[t].enabled);
        state = { sessionId: data.sessionId, pid: data.pid, config: data.config, plan, stage: 'intro', taskIdx: 0, blockIdx: 0, finished: false };
        saveState();
    }

    // --------------------------------------------------------------- screens
    function showWelcome() { show('screen-welcome'); }

    function showOverview() {
        const list = $('overview-list');
        list.innerHTML = '';
        state.plan.forEach((task, i) => {
            const n = blocksFor(task);
            const li = document.createElement('li');
            li.className = 'task-card';
            const extra = task === 'swipe' ? '' : ` Each time has ${taskCfg(task).trialsPerBlock} moves.`;
            li.innerHTML = `<span class="num" aria-hidden="true">${i + 1}</span>
                <h2>Task ${i + 1}: ${TASK_INFO[task].title}</h2>
                <p>${TASK_INFO[task].blurb(taskCfg(task))}</p>
                <p class="times">You will do this ${times(n)}.</p>`;
            // <p class="times">You will do this ${times(n)}.${extra}</p>`;
            list.appendChild(li);
        });
        const n = state.plan.length;
        $('overview-count').textContent = n === 1 ? '1 task' : `${n} tasks`;
        $('overview-next').hidden = n === 0;
        if (n === 0) {
            list.innerHTML = '<li class="notice notice-error">No tasks are switched on. Please ask the researcher.</li>';
        }
        show('screen-overview');
    }

    let introPage = 0;
    function showIntro(page = 0) {
        const task = currentTask();
        const n = state.plan.length;
        introPage = page;
        renderStepper($('intro-stepper'), state.taskIdx, state.taskIdx);
        $('intro-kicker').textContent = `Task ${state.taskIdx + 1} of ${n}`;
        $('intro-title').textContent = TASK_INFO[task].title;

        const pagesEl = $('intro-pages');
        pagesEl.innerHTML = '';
        pagesEl.appendChild($(`instructions-${task}`).content.cloneNode(true));
        pagesEl.querySelectorAll('[data-duration]').forEach(el => { el.textContent = taskCfg('swipe').durationSec; });
        const pages = [...pagesEl.querySelectorAll('.instruction-page')];
        pages.forEach((p, i) => { p.hidden = i !== page; });
        $('intro-pagecount').textContent = pages.length > 1 ? `Page ${page + 1} of ${pages.length}` : '';

        const last = page === pages.length - 1;
        $('intro-next').textContent = last ? 'Start' : 'Next';
        $('intro-back').hidden = page === 0 && state.taskIdx > 0;
        $('intro-pagecount').dataset.pages = pages.length;

        const wasHidden = $('screen-intro').hidden;
        show('screen-intro');
        const demoOn = state.config.guidance.showDemo;
        $('intro-demo').hidden = !demoOn;
        if (demoOn && (wasHidden || !stopDemo)) {
            stopDemo = window.TMTDemo.start($('demo-canvas'), $('demo-caption'), {
                task,
                showDistractor: task !== 'tmt_a' || taskCfg('tmt_a').showDistractor,
                durationSec: taskCfg('swipe').durationSec,
            });
        }
    }

    function introNext() {
        const pages = Number($('intro-pagecount').dataset.pages);
        if (introPage < pages - 1) showIntro(introPage + 1);
        else runBlock();
    }
    function introBack() {
        if (introPage > 0) showIntro(introPage - 1);
        else if (state.taskIdx === 0) showOverview();
    }

    function runBlock() {
        if (teardown) teardown();
        if (currentTask() === 'swipe') runSwipe();
        else runTmt();
    }

    function blockFinished() {
        state.blockIdx += 1;
        saveState();
        const task = currentTask();
        const total = blocksFor(task);
        if (state.blockIdx < total) {
            $('dialog-round-title').textContent = `Round ${state.blockIdx} of ${total} complete`;
            $('dialog-round-ok').textContent = `Start round ${state.blockIdx + 1}`;
            $('dialog-round').hidden = false;
            $('dialog-round-ok').focus();
        } else {
            showTaskDone();
        }
    }

    function showTaskDone() {
        const n = state.plan.length;
        const i = state.taskIdx;
        renderStepper($('done-stepper'), i, i + 1);
        $('done-title').textContent = `Completed task ${i + 1}/${n}`;
        const next = state.plan[i + 1];
        $('done-text').textContent = next
            ? `You have successfully completed the task. Next is task ${i + 2}: ${TASK_INFO[next].title}.`
            : 'You have successfully completed the task.';
        $('done-next').textContent = next ? `Continue to task ${i + 2}` : 'Finish';
        show('screen-taskdone');
    }

    function nextTask() {
        if (state.taskIdx + 1 < state.plan.length) {
            state.taskIdx += 1;
            state.blockIdx = 0;
            saveState();
            showIntro(0);
        } else {
            state.finished = true;
            saveState();
            enqueue('/api/session/complete', { sessionId: state.sessionId });
            renderStepper($('thanks-stepper'), -1, state.plan.length);
            updateSyncStatus();
            show('screen-thanks');
        }
    }

    // -------------------------------------------------------- Crossroads A/B
    function runTmt() {
        const task = currentTask();
        const cfg = taskCfg(task);
        const blockno = state.blockIdx + 1;
        const trials = Math.min(cfg.trialsPerBlock, L.MAX_TRIALS);
        const showFake = task === 'tmt_b' || cfg.showDistractor;
        const showPrompts = state.config.guidance.showPrompts;

        const screen = $('screen-tmt');
        const bar = $('tmt-bar');
        const prompt = $('tmt-prompt');
        const nodes = { origin: $('node-origin'), real: $('node-real'), fake: $('node-fake') };
        const labels = { origin: $('node-origin-label'), real: $('node-real-label'), fake: $('node-fake-label') };
        const dot = $('finger-dot');

        show('screen-tmt');
        // $('tmt-progress').textContent = `Task ${state.taskIdx + 1} of ${state.plan.length} · Round ${blockno} of ${cfg.blocks}`;
        $('tmt-progress').textContent = `Round ${blockno} of ${cfg.blocks}`;

        let geo, r;
        function applyGeometry() {
            geo = L.build(window.innerWidth, window.innerHeight, state.config.layout);
            r = geo.r;
            // The prompt sits right next to the task area, the progress chip at the screen edge.
            bar.className = 'task-bar ' + (geo.area === 'bottom' ? 'at-top' : geo.area === 'top' ? 'at-bottom' : 'overlay');
            bar.style.top = geo.area === 'top' ? `${geo.areaTop + geo.areaHeight}px` : '0px';
            bar.style.height = geo.area === 'bottom' ? `${geo.areaTop}px` : geo.area === 'top' ? `${geo.H - geo.areaTop - geo.areaHeight}px` : '';
            for (const k of Object.keys(nodes)) {
                nodes[k].style.width = nodes[k].style.height = `${2 * r}px`;
                labels[k].style.fontSize = `${Math.round(24 * (2 * r) / 80)}px`;
            }
        }
        applyGeometry();

        let trialno = -1, error = false, started = 0, ended = 0, startTime = 0, active = null;
        const coords = [];
        let originC = geo.origin;
        let originLabel = L.sequenceLabel(task, 0);

        function setPrompt(text, isStart) {
            prompt.hidden = !showPrompts;
            prompt.textContent = text;
            prompt.classList.toggle('prompt-start', !!isStart);
        }
        function place(el, labelEl, c, text) {
            el.style.left = `${c.x}px`;
            el.style.top = `${c.y}px`;
            labelEl.textContent = text;
        }
        function placeChecks() {
            const [rl, fl] = L.trialLabels(task, trialno);
            place(nodes.real, labels.real, geo.real(trialno), rl);
            place(nodes.fake, labels.fake, geo.fake(trialno), fl);
        }
        function showPair(on) {
            nodes.real.classList.toggle('visible', on);
            nodes.fake.classList.toggle('visible', on && showFake);
        }
        function waitForOrigin(first) {
            place(nodes.origin, labels.origin, originC, originLabel);
            nodes.origin.classList.add('visible', 'pulse');
            setPrompt(first ? `Place your finger on dot ${originLabel} to begin` : `Place your finger on dot ${originLabel} to continue`, true);
        }
        const now = () => Math.round(performance.now() - startTime);
        // [x, y, t, realLabel, realX, realY, fakeLabel, fakeX, fakeY]; node x/y are TOP-LEFT (original format)
        function record(x, y) {
            const [rl, fl] = L.trialLabels(task, trialno);
            const rc = geo.real(trialno), fc = geo.fake(trialno);
            coords.push([x, y, now(), rl, rc.x - r, rc.y - r, fl, fc.x - r, fc.y - r]);
        }
        const hit = (c, x, y) => Math.hypot(x - c.x, y - c.y) <= r;
        const moveDot = (x, y) => { dot.style.left = `${x}px`; dot.style.top = `${y}px`; };

        function fail(kind) {
            showPair(false);
            trialno--;
            error = true;
            started = 0;
            dot.classList.remove('visible');
            const wrong = kind === 'wrong';
            $('dialog-error-title').textContent = wrong ? 'Incorrect Point' : 'Finger Lifted';
            $('dialog-error-text').textContent = wrong
                ? 'Incorrect Point, go back to the last point and try again'
                : 'Finger lifted, go back to the last point and try again';
            $('dialog-error').hidden = false;
            $('dialog-error-ok').focus();
            setPrompt('', false);
        }
        errorDialogClosed = () => waitForOrigin(false);

        const ac = new AbortController();
        const opt = { signal: ac.signal };

        screen.addEventListener('pointerdown', e => {
            if (ended || active !== null || !$('dialog-error').hidden) return;
            active = e.pointerId;
            try { screen.setPointerCapture(e.pointerId); } catch { /* ignore */ }
            const x = e.clientX, y = e.clientY;
            if (hit(originC, x, y)) {
                if (coords.length === 0) startTime = performance.now();
                trialno++;
                placeChecks();
                showPair(true);
                nodes.origin.classList.remove('pulse');
                moveDot(x, y);
                dot.classList.add('visible');
                error = false;
                record(x, y);
                started = 1;
                setPrompt('Keep your finger on the screen', false);
            }
        }, opt);

        screen.addEventListener('pointermove', e => {
            if (e.pointerId !== active) return;
            const x = e.clientX, y = e.clientY;
            moveDot(x, y);
            if (!started || error || ended) return;
            if (hit(geo.real(trialno), x, y)) {
                record(x, y);
                originC = geo.real(trialno);
                originLabel = L.trialLabels(task, trialno)[0];
                place(nodes.origin, labels.origin, originC, originLabel);
                trialno++;
                if (trialno >= trials) {
                    ended = 1;
                    showPair(false);
                    endBlock();
                } else {
                    placeChecks();
                }
            } else if (showFake && hit(geo.fake(trialno), x, y)) {
                record(-2, -2);
                fail('wrong');
            } else {
                record(x, y);
            }
        }, opt);

        const up = e => {
            if (e.pointerId !== active) return;
            active = null;
            dot.classList.remove('visible');
            if (!ended && started && !error) {
                record(-1, -1);
                fail('lift');
            }
        };
        screen.addEventListener('pointerup', up, opt);
        screen.addEventListener('pointercancel', up, opt);
        screen.addEventListener('contextmenu', e => e.preventDefault(), opt);
        window.addEventListener('resize', () => {
            if (coords.length === 0) { applyGeometry(); originC = geo.origin; waitForOrigin(true); }
        }, opt);

        teardown = () => { ac.abort(); teardown = null; };

        function endBlock() {
            teardown();
            dot.classList.remove('visible');
            nodes.origin.classList.remove('pulse');
            setPrompt('', false);
            const m = window.calculateMeasures(coords, r);
            enqueue('/api/submit/tmt', {
                sessionId: state.sessionId,
                submissionId: uuid(),
                task,
                blockno,
                screenW: window.innerWidth,
                screenH: window.innerHeight,
                nodeRadius: r,
                samples: {
                    coordx: coords.map(c => Math.round(c[0])),
                    coordy: coords.map(c => Math.round(c[1])),
                    coordt: coords.map(c => c[2]),
                    realpointid: coords.map(c => c[3]),
                    realpointx: coords.map(c => c[4]),
                    realpointy: coords.map(c => c[5]),
                    fakepointid: coords.map(c => c[6]),
                    fakepointx: coords.map(c => c[7]),
                    fakepointy: coords.map(c => c[8]),
                    speed: m.speed,
                    pausevalue: m.pause,
                    correctangle: m.correctangle,
                    wrongangle: m.wrongangle,
                    err: m.error,
                    errorcorrected: m.errorcorrected,
                },
            });
            blockFinished();
        }

        // reset visuals for a fresh round
        showPair(false);
        dot.classList.remove('visible');
        waitForOrigin(true);
    }

    // ---------------------------------------------------------------- Swiping
    function runSwipe() {
        const cfg = taskCfg('swipe');
        const screen = $('screen-swipe');
        const timeEl = $('time');
        const prompt = $('swipe-prompt');
        const liftNotice = $('swipe-lift');

        show('screen-swipe');
        // $('swipe-progress').textContent = `Task ${state.taskIdx + 1} of ${state.plan.length}`;
        timeEl.textContent = cfg.durationSec;
        prompt.hidden = false;
        prompt.textContent = 'Place your finger on the screen to start.';
        prompt.classList.add('prompt-start');
        liftNotice.hidden = true;

        const total = cfg.durationSec * 1000;
        const coords = [];
        let startTime = null, elapsed = 0, runningSince = null, active = null, done = false, interval = null;

        const t = () => Math.round(performance.now() - startTime);
        const remaining = () => total - elapsed - (runningSince === null ? 0 : performance.now() - runningSince);
        function tick() {
            const left = remaining();
            timeEl.textContent = Math.max(0, Math.ceil(left / 1000));
            if (left <= 0) finish();
        }
        function pause() {
            if (runningSince !== null) { elapsed += performance.now() - runningSince; runningSince = null; }
        }

        const ac = new AbortController();
        const opt = { signal: ac.signal };

        screen.addEventListener('pointerdown', e => {
            if (done || active !== null) return;
            active = e.pointerId;
            try { screen.setPointerCapture(e.pointerId); } catch { /* ignore */ }
            if (startTime === null) startTime = performance.now();
            coords.push([e.clientX, e.clientY, t()]);
            if (runningSince === null) runningSince = performance.now();
            if (!interval) interval = setInterval(tick, 100);
            liftNotice.hidden = true;
            prompt.hidden = false;
            prompt.classList.remove('prompt-start');
            prompt.textContent = 'Keep going as fast as you can!';
        }, opt);
        screen.addEventListener('pointermove', e => {
            if (done || e.pointerId !== active) return;
            coords.push([e.clientX, e.clientY, t()]);
        }, opt);
        const up = e => {
            if (done || e.pointerId !== active) return;
            active = null;
            coords.push([-1, -1, t()]);
            if (cfg.pauseOnLift) pause();
            prompt.hidden = true;
            liftNotice.hidden = false;
        };
        screen.addEventListener('pointerup', up, opt);
        screen.addEventListener('pointercancel', up, opt);
        screen.addEventListener('contextmenu', e => e.preventDefault(), opt);

        teardown = () => { ac.abort(); clearInterval(interval); teardown = null; };

        function finish() {
            if (done) return;
            done = true;
            teardown();
            enqueue('/api/submit/swipe', {
                sessionId: state.sessionId,
                submissionId: uuid(),
                screenW: window.innerWidth,
                screenH: window.innerHeight,
                samples: {
                    coordx: coords.map(c => Math.round(c[0])),
                    coordy: coords.map(c => Math.round(c[1])),
                    coordt: coords.map(c => c[2]),
                },
            });
            blockFinished();
        }
    }

    // ------------------------------------------------------------------ wiring
    async function start() {
        show('screen-loading');
        try {
            await ensureSession();
            showOverview();
        } catch (err) {
            console.error(err);
            show('screen-offline');
        }
    }

    onPress($('welcome-next'), () => (state && state.sessionId ? showOverview() : start()));
    onPress($('retry-connect'), start);
    onPress($('overview-back'), showWelcome);
    onPress($('overview-next'), () => {
        if (!state.plan.length) return;
        state.stage = 'tasks';
        state.taskIdx = 0;
        state.blockIdx = 0;
        saveState();
        showIntro(0);
    });
    onPress($('intro-next'), introNext);
    onPress($('intro-back'), introBack);
    onPress($('done-next'), nextTask);
    onPress($('thanks-restart'), () => {
        clearState();
        // A ?pid= link belongs to one participant; the next person gets a new ID.
        if (urlPid !== null) { urlPid = null; history.replaceState(null, '', '/'); }
        showWelcome();
    });
    onPress($('dialog-error-ok'), () => { $('dialog-error').hidden = true; errorDialogClosed(); });
    onPress($('dialog-round-ok'), () => { $('dialog-round').hidden = true; runBlock(); });

    // Prevent pinch-zoom / double-tap zoom on iOS during the study.
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());

    // ------------------------------------------------------------------- boot
    function boot() {
        flush();
        const saved = loadState();
        if (urlPid !== null && (!saved || String(saved.pid) !== urlPid)) {
            clearState();
        } else if (saved && saved.sessionId && !saved.finished) {
            state = saved;
        }
        if (!state || state.stage !== 'tasks') return showWelcome();
        // Resume after an accidental refresh: back to the current round of the current task.
        if (state.blockIdx === 0) return showIntro(0);
        if (state.blockIdx >= blocksFor(currentTask())) return showTaskDone();
        runBlock();
    }
    boot();
})();
