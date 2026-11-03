'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const pg = require('pg');
require('./script/layout.js'); // shared with the browser; defines globalThis.TMTLayout
const TMTLayout = globalThis.TMTLayout;

const port = process.env.PORT || 8080;

const pool = new pg.Pool({
	connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/cognition',
	ssl: process.env.DATABASE_URL && !process.env.DATABASE_NO_SSL ? { rejectUnauthorized: false } : false,
});
pool.on('error', err => console.error('PostgreSQL pool error:', err.message));

// ---------------------------------------------------------------------------
// Admin authentication
// ---------------------------------------------------------------------------
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
if (!process.env.ADMIN_PASSWORD) {
	console.warn(`ADMIN_PASSWORD is not set. Using a temporary admin password for this run: ${ADMIN_PASSWORD}`);
}
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_COOKIE = 'tmt_admin';
const ADMIN_SESSION_HOURS = 12;

function sign(value) {
	return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

function makeAdminToken() {
	const payload = Buffer.from(JSON.stringify({ exp: Date.now() + ADMIN_SESSION_HOURS * 3600e3 })).toString('base64url');
	return `${payload}.${sign(payload)}`;
}

function safeEqual(a, b) {
	const ha = crypto.createHash('sha256').update(String(a)).digest();
	const hb = crypto.createHash('sha256').update(String(b)).digest();
	return crypto.timingSafeEqual(ha, hb);
}

function parseCookies(req) {
	const out = {};
	for (const part of (req.headers.cookie || '').split(';')) {
		const i = part.indexOf('=');
		if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
	}
	return out;
}

function isAdmin(req) {
	const token = parseCookies(req)[ADMIN_COOKIE];
	if (!token) return false;
	const [payload, sig] = token.split('.');
	if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
	try {
		return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
	} catch {
		return false;
	}
}

function isHttps(req) {
	return req.socket.encrypted || req.headers['x-forwarded-proto'] === 'https';
}

const loginAttempts = new Map(); // ip -> [timestamps]
function tooManyAttempts(ip) {
	const now = Date.now();
	const recent = (loginAttempts.get(ip) || []).filter(t => now - t < 15 * 60e3);
	loginAttempts.set(ip, recent);
	return recent.length >= 10;
}

// ---------------------------------------------------------------------------
// Task configuration (editable from the admin panel)
// ---------------------------------------------------------------------------
const MAX_TRIALS = 50; // limited by the number of fixed positions in script/layout.js

const DEFAULT_CONFIG = {
	tasks: {
		tmt_a: { enabled: true, blocks: 3, trialsPerBlock: 10, showDistractor: true },
		tmt_b: { enabled: true, blocks: 8, trialsPerBlock: 10 },
		swipe: { enabled: true, durationSec: 10, pauseOnLift: true },
	},
	layout: { area: 'bottom', areaHeightPct: 60, nodeDiameter: 80 },
	guidance: { showDemo: true, showPrompts: true },
	// Dot positions; null = the original fixed layout (see script/layout.js).
	positions: null,
};

const clampInt = (v, min, max, fallback) => {
	const n = Math.round(Number(v));
	return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);

// Custom dot positions, stored as % of screen width/height (see script/layout.js).
function sanitizePositions(p) {
	if (!p || typeof p !== 'object' || !Array.isArray(p.pairs) || p.pairs.length !== TMTLayout.POSITIONS.length) return null;
	const n = v => {
		const x = Number(v);
		return Number.isFinite(x) ? Math.min(150, Math.max(-50, Math.round(x * 100) / 100)) : null;
	};
	const pt = a => (Array.isArray(a) && a.length === 2 && n(a[0]) !== null && n(a[1]) !== null ? [n(a[0]), n(a[1])] : null);
	const origin = pt(p.origin);
	const pairs = p.pairs.map(pair => (Array.isArray(pair) ? [pt(pair[0]), pt(pair[1])] : [null, null]));
	if (!origin || pairs.some(pair => !pair[0] || !pair[1])) return null;
	// Identical to the original layout -> store null so future default changes still apply.
	if (JSON.stringify({ origin, pairs }) === JSON.stringify(TMTLayout.defaultPositions())) return null;
	return { origin, pairs };
}

function sanitizeConfig(input) {
	const d = DEFAULT_CONFIG;
	const i = input && typeof input === 'object' ? input : {};
	const t = i.tasks || {};
	const a = t.tmt_a || {}, b = t.tmt_b || {}, s = t.swipe || {};
	const l = i.layout || {}, g = i.guidance || {};
	return {
		tasks: {
			tmt_a: {
				enabled: bool(a.enabled, d.tasks.tmt_a.enabled),
				blocks: clampInt(a.blocks, 1, 20, d.tasks.tmt_a.blocks),
				trialsPerBlock: clampInt(a.trialsPerBlock, 2, MAX_TRIALS, d.tasks.tmt_a.trialsPerBlock),
				showDistractor: bool(a.showDistractor, d.tasks.tmt_a.showDistractor),
			},
			tmt_b: {
				enabled: bool(b.enabled, d.tasks.tmt_b.enabled),
				blocks: clampInt(b.blocks, 1, 20, d.tasks.tmt_b.blocks),
				trialsPerBlock: clampInt(b.trialsPerBlock, 2, MAX_TRIALS, d.tasks.tmt_b.trialsPerBlock),
			},
			swipe: {
				enabled: bool(s.enabled, d.tasks.swipe.enabled),
				durationSec: clampInt(s.durationSec, 3, 120, d.tasks.swipe.durationSec),
				pauseOnLift: bool(s.pauseOnLift, d.tasks.swipe.pauseOnLift),
			},
		},
		layout: {
			area: ['bottom', 'top', 'full'].includes(l.area) ? l.area : d.layout.area,
			areaHeightPct: clampInt(l.areaHeightPct, 30, 100, d.layout.areaHeightPct),
			nodeDiameter: clampInt(l.nodeDiameter, 40, 160, d.layout.nodeDiameter),
		},
		guidance: {
			showDemo: bool(g.showDemo, d.guidance.showDemo),
			showPrompts: bool(g.showPrompts, d.guidance.showPrompts),
		},
		positions: sanitizePositions(i.positions),
	};
}

async function getConfig(db = pool) {
	const r = await db.query("SELECT value FROM app_settings WHERE key = 'config'");
	return sanitizeConfig(r.rows[0] ? r.rows[0].value : DEFAULT_CONFIG);
}

async function saveConfig(cfg) {
	await pool.query(
		`INSERT INTO app_settings (key, value, updated_at) VALUES ('config', $1, now())
		 ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
		[JSON.stringify(cfg)]
	);
}

// ---------------------------------------------------------------------------
// Database schema (idempotent; keeps the original columns of both tables)
// ---------------------------------------------------------------------------
async function initDb() {
	await pool.query(`
		CREATE TABLE IF NOT EXISTS test_results (
			id serial PRIMARY KEY, pid integer, blockno integer,
			coordx integer, coordy integer, coordt integer,
			realpointid text, realpointx double precision, realpointy double precision,
			fakepointid text, fakepointx double precision, fakepointy double precision,
			speed double precision, pausevalue integer, correctangle double precision,
			wrongangle double precision, err integer, errorcorrected integer
		);
		ALTER TABLE test_results ADD COLUMN IF NOT EXISTS task text DEFAULT 'tmt_b';
		ALTER TABLE test_results ADD COLUMN IF NOT EXISTS session_id text;
		ALTER TABLE test_results ADD COLUMN IF NOT EXISTS screen_w integer;
		ALTER TABLE test_results ADD COLUMN IF NOT EXISTS screen_h integer;
		ALTER TABLE test_results ADD COLUMN IF NOT EXISTS node_radius double precision;
		ALTER TABLE test_results ADD COLUMN IF NOT EXISTS created_at timestamptz;
		CREATE INDEX IF NOT EXISTS test_results_pid_idx ON test_results (pid);

		CREATE TABLE IF NOT EXISTS max_speed (
			id serial PRIMARY KEY, pid integer, coordx integer, coordy integer, coordt integer
		);
		ALTER TABLE max_speed ADD COLUMN IF NOT EXISTS session_id text;
		ALTER TABLE max_speed ADD COLUMN IF NOT EXISTS screen_w integer;
		ALTER TABLE max_speed ADD COLUMN IF NOT EXISTS screen_h integer;
		ALTER TABLE max_speed ADD COLUMN IF NOT EXISTS created_at timestamptz;
		CREATE INDEX IF NOT EXISTS max_speed_pid_idx ON max_speed (pid);

		CREATE TABLE IF NOT EXISTS sessions (
			id text PRIMARY KEY, pid integer NOT NULL,
			started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
			config jsonb, user_agent text, screen_w integer, screen_h integer
		);
		CREATE TABLE IF NOT EXISTS submissions (
			id text PRIMARY KEY, session_id text, kind text, created_at timestamptz NOT NULL DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS app_settings (
			key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
		);
	`);
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
const MAX_BODY = 20 * 1024 * 1024;

function readJson(req) {
	return new Promise((resolve, reject) => {
		let size = 0;
		const chunks = [];
		req.on('data', chunk => {
			size += chunk.length;
			if (size > MAX_BODY) {
				reject(Object.assign(new Error('Payload too large'), { status: 413 }));
				req.destroy();
			} else {
				chunks.push(chunk);
			}
		});
		req.on('end', () => {
			try {
				resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {});
			} catch {
				reject(Object.assign(new Error('Invalid JSON'), { status: 400 }));
			}
		});
		req.on('error', reject);
	});
}

function sendJson(res, status, obj, headers = {}) {
	res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
	res.end(JSON.stringify(obj));
}

function badRequest(message) {
	return Object.assign(new Error(message), { status: 400 });
}

const STATIC = {
	'/': ['html/index.html', 'text/html; charset=utf-8'],
	'/admin': ['html/admin.html', 'text/html; charset=utf-8'],
	'/style.css': ['styles/style.css', 'text/css; charset=utf-8'],
	'/admin.css': ['styles/admin.css', 'text/css; charset=utf-8'],
	'/layout.js': ['script/layout.js', 'application/javascript; charset=utf-8'],
	'/measures.js': ['script/measures.js', 'application/javascript; charset=utf-8'],
	'/demo.js': ['script/demo.js', 'application/javascript; charset=utf-8'],
	'/participant.js': ['script/participant.js', 'application/javascript; charset=utf-8'],
	'/charts.js': ['script/charts.js', 'application/javascript; charset=utf-8'],
	'/positions.js': ['script/positions.js', 'application/javascript; charset=utf-8'],
	'/admin.js': ['script/admin.js', 'application/javascript; charset=utf-8'],
};

// Old page URLs now live inside the single participant app.
const LEGACY_REDIRECTS = new Set([
	'/instructions', '/instructions2', '/instructions3', '/instructions4',
	'/test', '/test2', '/oldtest', '/maxspeedinstruction', '/maxspeed', '/thanks',
]);

function serveStatic(res, pathname) {
	const [file, type] = STATIC[pathname];
	fs.readFile(path.join(__dirname, file), (err, data) => {
		if (err) {
			console.error(err.message);
			res.writeHead(500, { 'Content-Type': 'text/plain' });
			res.end('500 Internal Server Error');
			return;
		}
		res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
		res.end(data);
	});
}

// ---------------------------------------------------------------------------
// Participant API
// ---------------------------------------------------------------------------
const TASKS = new Set(['tmt_a', 'tmt_b']);
const isId = v => typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v);

async function createSession(body, req) {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query('SELECT pg_advisory_xact_lock(724519)'); // serialise pid assignment
		let pid = body.pid === undefined || body.pid === null || body.pid === '' ? null : Number(body.pid);
		if (pid !== null && (!Number.isInteger(pid) || pid < 0 || pid > 2147483647)) throw badRequest('Invalid participant ID');
		if (pid === null) {
			const r = await client.query(`SELECT GREATEST(
				(SELECT max(pid) FROM test_results), (SELECT max(pid) FROM max_speed), (SELECT max(pid) FROM sessions)) AS m`);
			pid = (r.rows[0].m === null ? 0 : Number(r.rows[0].m)) + 1;
		}
		const config = await getConfig(client);
		const id = crypto.randomUUID();
		const screen = body.screen || {};
		await client.query(
			'INSERT INTO sessions (id, pid, config, user_agent, screen_w, screen_h) VALUES ($1, $2, $3, $4, $5, $6)',
			[id, pid, JSON.stringify(config), String(req.headers['user-agent'] || '').slice(0, 400),
				clampInt(screen.w, 0, 100000, null), clampInt(screen.h, 0, 100000, null)]
		);
		await client.query('COMMIT');
		return { sessionId: id, pid, config };
	} catch (err) {
		await client.query('ROLLBACK').catch(() => { });
		throw err;
	} finally {
		client.release();
	}
}

async function sessionPid(client, sessionId) {
	if (!isId(sessionId)) throw badRequest('Invalid session');
	const r = await client.query('SELECT pid FROM sessions WHERE id = $1', [sessionId]);
	if (!r.rows[0]) throw badRequest('Unknown session');
	return r.rows[0].pid;
}

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const int = v => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null);
const str = v => (v === null || v === undefined ? null : String(v).slice(0, 16));

// Runs `insert` once per submission id, so a retried upload is never stored twice.
async function onceForSubmission(body, kind, insert) {
	if (!isId(body.submissionId)) throw badRequest('Invalid submission id');
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		const pid = await sessionPid(client, body.sessionId);
		const fresh = await client.query(
			'INSERT INTO submissions (id, session_id, kind) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING RETURNING id',
			[body.submissionId, body.sessionId, kind]
		);
		if (fresh.rowCount) await insert(client, pid);
		await client.query('COMMIT');
	} catch (err) {
		await client.query('ROLLBACK').catch(() => { });
		throw err;
	} finally {
		client.release();
	}
}

async function submitTmt(body) {
	if (!TASKS.has(body.task)) throw badRequest('Invalid task');
	const blockno = clampInt(body.blockno, 1, 1000, null);
	const s = body.samples || {};
	const cols = ['coordx', 'coordy', 'coordt', 'realpointid', 'realpointx', 'realpointy', 'fakepointid', 'fakepointx',
		'fakepointy', 'speed', 'pausevalue', 'correctangle', 'wrongangle', 'err', 'errorcorrected'];
	const n = Array.isArray(s.coordx) ? s.coordx.length : -1;
	if (!blockno || n < 1 || n > 200000 || cols.some(c => !Array.isArray(s[c]) || s[c].length !== n)) {
		throw badRequest('Invalid samples');
	}
	const conv = {
		coordx: int, coordy: int, coordt: int, realpointid: str, realpointx: num, realpointy: num, fakepointid: str,
		fakepointx: num, fakepointy: num, speed: num, pausevalue: int, correctangle: num, wrongangle: num, err: int, errorcorrected: int,
	};
	const arrays = cols.map(c => s[c].map(conv[c]));

	await onceForSubmission(body, `${body.task}:${blockno}`, (client, pid) => client.query(
		`INSERT INTO test_results (pid, blockno, coordx, coordy, coordt, realpointid, realpointx, realpointy, fakepointid,
			fakepointx, fakepointy, speed, pausevalue, correctangle, wrongangle, err, errorcorrected,
			task, session_id, screen_w, screen_h, node_radius, created_at)
		 SELECT $1, $2, x.a, x.b, x.c, x.d, x.e, x.f, x.g, x.h, x.i, x.j, x.k, x.l, x.m, x.n, x.o,
			$18, $19, $20, $21, $22, now()
		 FROM unnest($3::int[], $4::int[], $5::int[], $6::text[], $7::float8[], $8::float8[], $9::text[], $10::float8[],
			$11::float8[], $12::float8[], $13::int[], $14::float8[], $15::float8[], $16::int[], $17::int[])
			WITH ORDINALITY AS x(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, ord)
		 ORDER BY x.ord`,
		[pid, blockno, ...arrays, body.task, body.sessionId, clampInt(body.screenW, 0, 100000, null),
			clampInt(body.screenH, 0, 100000, null), num(body.nodeRadius)]
	));
}

async function submitSwipe(body) {
	const s = body.samples || {};
	const n = Array.isArray(s.coordx) ? s.coordx.length : -1;
	if (n < 1 || n > 200000 || !['coordy', 'coordt'].every(c => Array.isArray(s[c]) && s[c].length === n)) {
		throw badRequest('Invalid samples');
	}
	await onceForSubmission(body, 'swipe', (client, pid) => client.query(
		`INSERT INTO max_speed (pid, coordx, coordy, coordt, session_id, screen_w, screen_h, created_at)
		 SELECT $1, x.a, x.b, x.c, $5, $6, $7, now()
		 FROM unnest($2::int[], $3::int[], $4::int[]) WITH ORDINALITY AS x(a, b, c, ord) ORDER BY x.ord`,
		[pid, s.coordx.map(int), s.coordy.map(int), s.coordt.map(int), body.sessionId,
			clampInt(body.screenW, 0, 100000, null), clampInt(body.screenH, 0, 100000, null)]
	));
}

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------
async function listParticipants() {
	const [t, m, s] = await Promise.all([
		pool.query(`SELECT pid, task, count(DISTINCT (coalesce(session_id, ''), blockno))::int AS blocks,
			sum(CASE WHEN coordx = -2 THEN 1 ELSE 0 END)::int AS wrong, max(created_at) AS last
			FROM test_results WHERE pid IS NOT NULL GROUP BY pid, task`),
		pool.query(`SELECT pid, count(DISTINCT coalesce(session_id, ''))::int AS runs, max(created_at) AS last
			FROM max_speed WHERE pid IS NOT NULL GROUP BY pid`),
		pool.query(`SELECT pid, count(*)::int AS sessions, max(started_at) AS last,
			bool_or(completed_at IS NOT NULL) AS completed FROM sessions GROUP BY pid`),
	]);
	const by = new Map();
	const get = pid => {
		if (!by.has(pid)) by.set(pid, { pid, sessions: 0, completed: false, tmt_a: 0, tmt_b: 0, swipe: 0, wrong: 0, last: null });
		return by.get(pid);
	};
	const later = (a, b) => (!a ? b : !b ? a : new Date(a) > new Date(b) ? a : b);
	for (const r of t.rows) {
		const p = get(r.pid);
		p[r.task === 'tmt_a' ? 'tmt_a' : 'tmt_b'] += r.blocks;
		p.wrong += r.wrong;
		p.last = later(p.last, r.last);
	}
	for (const r of m.rows) { const p = get(r.pid); p.swipe = r.runs; p.last = later(p.last, r.last); }
	for (const r of s.rows) { const p = get(r.pid); p.sessions = r.sessions; p.completed = r.completed; p.last = later(p.last, r.last); }
	return [...by.values()].sort((a, b) => b.pid - a.pid);
}

async function participantDetail(pid) {
	const [blocks, sessions, swipe] = await Promise.all([
		pool.query(`SELECT session_id, coalesce(task, 'tmt_b') AS task, blockno, count(*)::int AS samples,
			(max(coordt) - min(coordt))::int AS duration_ms,
			sum(CASE WHEN coordx = -2 THEN 1 ELSE 0 END)::int AS wrong,
			sum(CASE WHEN coordx = -1 THEN 1 ELSE 0 END)::int AS lifts,
			sum(CASE WHEN err = 1 THEN 1 ELSE 0 END)::int AS off_course,
			min(created_at) AS created_at, min(id) AS first_id
			FROM test_results WHERE pid = $1 GROUP BY session_id, task, blockno ORDER BY min(id)`, [pid]),
		pool.query('SELECT id, started_at, completed_at, user_agent, screen_w, screen_h, config FROM sessions WHERE pid = $1 ORDER BY started_at', [pid]),
		pool.query('SELECT session_id, coordx, coordy, coordt, screen_w, screen_h, created_at FROM max_speed WHERE pid = $1 ORDER BY id', [pid]),
	]);
	return { pid, blocks: blocks.rows, sessions: sessions.rows, swipe: swipe.rows };
}

async function trajectory(pid, query) {
	const params = [pid, query.get('task') || 'tmt_b', clampInt(query.get('block'), 0, 100000, 0)];
	let sessionFilter = 'AND session_id IS NULL';
	if (query.get('session')) {
		params.push(query.get('session'));
		sessionFilter = 'AND session_id = $4';
	}
	const r = await pool.query(
		`SELECT coordx, coordy, coordt, realpointid, realpointx, realpointy, fakepointid, fakepointx, fakepointy, err,
			screen_w, screen_h, node_radius FROM test_results
		 WHERE pid = $1 AND coalesce(task, 'tmt_b') = $2 AND blockno = $3 ${sessionFilter} ORDER BY id`,
		params
	);
	return r.rows;
}

function csvCell(v) {
	if (v === null || v === undefined) return '';
	const s = v instanceof Date ? v.toISOString() : typeof v === 'object' ? JSON.stringify(v) : String(v);
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function exportCsv(res, query) {
	const table = query.get('table') === 'max_speed' ? 'max_speed' : query.get('table') === 'sessions' ? 'sessions' : 'test_results';
	const pid = query.get('pid');
	const params = [];
	let where = '';
	if (pid !== null && pid !== '') {
		params.push(clampInt(pid, -1, 2147483647, -999));
		where = 'WHERE pid = $1';
	}
	const order = table === 'sessions' ? 'started_at' : 'id';
	const r = await pool.query(`SELECT * FROM ${table} ${where} ORDER BY ${order}`, params);
	const cols = r.fields.map(f => f.name);
	const name = `${table}${where ? `_pid${params[0]}` : ''}.csv`;
	res.writeHead(200, {
		'Content-Type': 'text/csv; charset=utf-8',
		'Content-Disposition': `attachment; filename="${name}"`,
		'Cache-Control': 'no-store',
	});
	res.write(cols.join(',') + '\n');
	for (const row of r.rows) res.write(cols.map(c => csvCell(row[c])).join(',') + '\n');
	res.end();
}

async function deleteParticipant(pid) {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');
		await client.query('DELETE FROM submissions WHERE session_id IN (SELECT id FROM sessions WHERE pid = $1)', [pid]);
		const a = await client.query('DELETE FROM test_results WHERE pid = $1', [pid]);
		const b = await client.query('DELETE FROM max_speed WHERE pid = $1', [pid]);
		const c = await client.query('DELETE FROM sessions WHERE pid = $1', [pid]);
		await client.query('COMMIT');
		return { test_results: a.rowCount, max_speed: b.rowCount, sessions: c.rowCount };
	} catch (err) {
		await client.query('ROLLBACK').catch(() => { });
		throw err;
	} finally {
		client.release();
	}
}

async function handleAdminApi(req, res, pathname, query) {
	if (pathname === '/api/admin/login' && req.method === 'POST') {
		const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
		if (tooManyAttempts(ip)) return sendJson(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
		const body = await readJson(req);
		if (!safeEqual(body.password || '', ADMIN_PASSWORD)) {
			loginAttempts.get(ip).push(Date.now());
			return sendJson(res, 401, { error: 'Incorrect password' });
		}
		const cookie = `${ADMIN_COOKIE}=${makeAdminToken()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_SESSION_HOURS * 3600}${isHttps(req) ? '; Secure' : ''}`;
		return sendJson(res, 200, { ok: true }, { 'Set-Cookie': cookie });
	}
	if (pathname === '/api/admin/logout' && req.method === 'POST') {
		return sendJson(res, 200, { ok: true }, { 'Set-Cookie': `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` });
	}
	if (!isAdmin(req)) return sendJson(res, 401, { error: 'Not logged in' });
	// State-changing admin calls must be JSON (blocks simple cross-site form posts).
	if (req.method !== 'GET' && !(req.headers['content-type'] || '').startsWith('application/json')) {
		return sendJson(res, 415, { error: 'Expected application/json' });
	}

	if (pathname === '/api/admin/me') return sendJson(res, 200, { ok: true });
	if (pathname === '/api/admin/config' && req.method === 'GET') {
		return sendJson(res, 200, { config: await getConfig(), defaults: DEFAULT_CONFIG, maxTrials: MAX_TRIALS });
	}
	if (pathname === '/api/admin/config' && req.method === 'PUT') {
		const cfg = sanitizeConfig(await readJson(req));
		await saveConfig(cfg);
		return sendJson(res, 200, { config: cfg });
	}
	if (pathname === '/api/admin/participants' && req.method === 'GET') {
		return sendJson(res, 200, { participants: await listParticipants() });
	}
	if (pathname === '/api/admin/export.csv' && req.method === 'GET') return exportCsv(res, query);

	const m = pathname.match(/^\/api\/admin\/participants\/(-?\d+)(\/trajectory)?$/);
	if (m) {
		const pid = Number(m[1]);
		if (m[2] && req.method === 'GET') return sendJson(res, 200, { rows: await trajectory(pid, query) });
		if (!m[2] && req.method === 'GET') return sendJson(res, 200, await participantDetail(pid));
		if (!m[2] && req.method === 'DELETE') return sendJson(res, 200, { deleted: await deleteParticipant(pid) });
	}
	return sendJson(res, 404, { error: 'Not found' });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
	const { pathname, searchParams } = new URL(req.url, 'http://localhost');
	try {
		if (req.method === 'GET' && STATIC[pathname]) return serveStatic(res, pathname);
		if (req.method === 'GET' && LEGACY_REDIRECTS.has(pathname)) {
			res.writeHead(302, { Location: '/' });
			return res.end();
		}
		if (pathname.startsWith('/api/admin/')) return await handleAdminApi(req, res, pathname, searchParams);

		if (pathname === '/api/config' && req.method === 'GET') return sendJson(res, 200, { config: await getConfig() });
		if (pathname === '/api/session' && req.method === 'POST') return sendJson(res, 200, await createSession(await readJson(req), req));
		if (pathname === '/api/session/complete' && req.method === 'POST') {
			const body = await readJson(req);
			if (!isId(body.sessionId)) throw badRequest('Invalid session');
			await pool.query('UPDATE sessions SET completed_at = coalesce(completed_at, now()) WHERE id = $1', [body.sessionId]);
			return sendJson(res, 200, { ok: true });
		}
		if (pathname === '/api/submit/tmt' && req.method === 'POST') {
			await submitTmt(await readJson(req));
			return sendJson(res, 200, { ok: true });
		}
		if (pathname === '/api/submit/swipe' && req.method === 'POST') {
			await submitSwipe(await readJson(req));
			return sendJson(res, 200, { ok: true });
		}

		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end('404 page not found');
	} catch (err) {
		const status = err.status || 500;
		if (status >= 500) console.error(err.stack || err);
		if (!res.headersSent) sendJson(res, status, { error: status >= 500 ? 'Internal Server Error' : err.message });
		else res.end();
	}
});

initDb()
	.then(() => console.log('Connected to PostgreSQL; schema ready'))
	.catch(err => console.error('Database initialisation failed:', err.message))
	.finally(() => server.listen(port, () => console.log(`Listening on port ${port}`)));
