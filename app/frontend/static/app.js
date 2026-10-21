let uptimeSeconds = 0;
let uptimeInterval = null;

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

async function checkHealth() {
    const healthStatus = document.getElementById('health-status');
    const badge = document.getElementById('system-status');
    const dbStatus = document.getElementById('db-status');
    const uptimeEl = document.getElementById('uptime');

    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        healthStatus.textContent = data.message;
        healthStatus.classList.add('ok');
        badge.innerHTML = '<span class="pulse"></span> Online';
        badge.classList.add('online');
        dbStatus.textContent = 'Database: ' + data.database;
        dbStatus.classList.add(data.database === 'connected' ? 'connected' : 'unavailable');
        uptimeSeconds = data.uptime;
        uptimeEl.textContent = 'Uptime: ' + formatUptime(uptimeSeconds);
        if (uptimeInterval) clearInterval(uptimeInterval);
        uptimeInterval = setInterval(() => {
            uptimeSeconds++;
            uptimeEl.textContent = 'Uptime: ' + formatUptime(uptimeSeconds);
        }, 1000);
    } catch (error) {
        healthStatus.textContent = 'Backend unreachable';
        healthStatus.classList.add('error');
        badge.innerHTML = '<span class="pulse"></span> Offline';
        if (uptimeInterval) clearInterval(uptimeInterval);
    }
}

async function fetchData() {
    const pod = document.getElementById('k8s-pod');
    const node = document.getElementById('k8s-node');
    const namespace = document.getElementById('k8s-namespace');
    const python = document.getElementById('container-python');
    const environment = document.getElementById('environment');
    const responseTime = document.getElementById('response-time');
    try {
        const start = performance.now();
        const response = await fetch('/api/data');
        const data = await response.json();
        const elapsed = Math.round(performance.now() - start);
        const k8s = data.kubernetes || {};
        pod.textContent = k8s.pod || data.container.hostname;
        node.textContent = k8s.node || '-';
        namespace.textContent = k8s.namespace || '-';
        python.textContent = data.container.python_version;
        environment.textContent = data.environment;
        responseTime.textContent = elapsed + 'ms';
    } catch (error) {
        pod.textContent = 'unavailable';
    }
}

function renderEntry(entry) {
    const li = document.createElement('li');
    li.dataset.id = entry.id;

    const body = document.createElement('div');
    body.className = 'entry-body';

    const timestamp = document.createElement('span');
    timestamp.className = 'entry-timestamp';
    timestamp.textContent = new Date(entry.created_at).toLocaleString();

    const content = document.createElement('span');
    content.className = 'entry-content';
    content.textContent = entry.content;

    const button = document.createElement('button');
    button.className = 'delete-btn';
    button.textContent = 'x';
    button.addEventListener('click', () => deleteEntry(entry.id));

    body.append(timestamp, content);
    li.append(body, button);
    return li;
}

async function fetchEntries() {
    const list = document.getElementById('entries-list');
    try {
        const response = await fetch('/api/entries');
        const entries = await response.json();
        if (entries.length === 0) {
            list.innerHTML = '<li style="color: var(--text-muted); font-size: 13px; padding: 14px 0;">No entries yet. Add one below.</li>';
            return;
        }
        // Build each entry with DOM APIs so user text is shown as text, never as HTML.
        list.replaceChildren(...entries.map(renderEntry));
    } catch (error) {
        list.innerHTML = '<li>Failed to load entries.</li>';
    }
}

async function addEntry() {
    const contentInput = document.getElementById('entry-content');
    const btn = document.getElementById('add-btn');
    const content = contentInput.value.trim();
    if (!content) return;
    btn.disabled = true;
    btn.textContent = 'Adding...';
    try {
        const response = await fetch('/api/entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });
        if (response.ok) {
            contentInput.value = '';
            await fetchEntries();
        }
    } catch (error) {
        console.error('Failed to add entry:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add';
    }
}

async function deleteEntry(id) {
    try {
        const response = await fetch('/api/entries/' + id, { method: 'DELETE' });
        if (response.ok) await fetchEntries();
    } catch (error) {
        console.error('Failed to delete entry:', error);
    }
}

document.getElementById('add-btn').addEventListener('click', addEntry);

checkHealth();
fetchData();
fetchEntries();

// Re-ask the backend every 3 seconds. With several backend replicas the
// Pod and Node fields change as requests are load-balanced across them.
setInterval(fetchData, 3000);
