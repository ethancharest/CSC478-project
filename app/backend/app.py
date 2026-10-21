from flask import Flask, jsonify, request
import datetime
import os
import socket
import sys

import psycopg2
import psycopg2.extras

app = Flask(__name__)

START_TIME = datetime.datetime.utcnow()


def get_db():
    return psycopg2.connect(
        host=os.environ.get('DB_HOST', 'db'),
        dbname=os.environ.get('DB_NAME', 'csc468'),
        user=os.environ.get('DB_USER', 'csc468user'),
        password=os.environ.get('DB_PASSWORD', 'csc468pass'),
        connect_timeout=3,
    )


@app.route('/api/health')
def health():
    try:
        conn = get_db()
        conn.close()
        db_status = 'connected'
    except Exception:
        db_status = 'unavailable'

    uptime = int((datetime.datetime.utcnow() - START_TIME).total_seconds())

    return jsonify({
        'status': 'ok',
        'message': 'Backend is running, API is healthy.',
        'database': db_status,
        'uptime': uptime
    })


@app.route('/api/data')
def data():
    return jsonify({
        'project': 'CSC478 Project',
        'message': 'Sample response from the backend API. Hello!',
        'environment': os.environ.get('ENV', 'unknown'),
        'stack': ['Nginx', 'Flask', 'PostgreSQL', 'Kubernetes (RKE2)', 'Helm'],
        'container': {
            'hostname': socket.gethostname(),
            'python_version': sys.version.split(' ')[0],
            'timestamp': datetime.datetime.utcnow().isoformat() + 'Z'
        },
        # Filled in by the Kubernetes Downward API. Outside a cluster these
        # fall back to the container hostname / "local".
        'kubernetes': {
            'pod': os.environ.get('POD_NAME', socket.gethostname()),
            'node': os.environ.get('NODE_NAME', 'local'),
            'namespace': os.environ.get('POD_NAMESPACE', 'local'),
        }
    })


@app.route('/api/entries', methods=['GET', 'POST'])
def entries():
    if request.method == 'POST':
        body = request.get_json(silent=True) or {}
        content = str(body.get('content', '')).strip()
        if not content:
            return jsonify({'error': 'content is required'}), 400

    conn = get_db()
    try:
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if request.method == 'GET':
            cursor.execute('SELECT id, content, created_at FROM entries ORDER BY created_at DESC')
            rows = cursor.fetchall()
            return jsonify([{
                'id': row['id'],
                'content': row['content'],
                'created_at': row['created_at'].isoformat() + 'Z'
            } for row in rows])

        cursor.execute(
            'INSERT INTO entries (content) VALUES (%s) RETURNING id, created_at',
            (content,)
        )
        row = cursor.fetchone()
        conn.commit()
        return jsonify({
            'id': row['id'],
            'content': content,
            'created_at': row['created_at'].isoformat() + 'Z'
        }), 201
    finally:
        conn.close()


@app.route('/api/entries/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM entries WHERE id = %s', (entry_id,))
        conn.commit()
    finally:
        conn.close()
    return jsonify({'deleted': entry_id}), 200


if __name__ == '__main__':
    # Local debugging only. In the container, Gunicorn serves the app.
    app.run(host='0.0.0.0', port=5000)
