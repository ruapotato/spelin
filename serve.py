#!/usr/bin/env python3
"""
Simple HTTP server for spelin website with API endpoints.
Serves static files from web/ and provides /api/convert endpoint.
"""

import http.server
import json
import os
import sys
from urllib.parse import parse_qs, urlparse

# Add scripts to path for converter import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'scripts'))
from english_to_spelin import convert_text, word_to_spelin

PORT = 9000
WEB_DIR = os.path.join(os.path.dirname(__file__), 'web')


class SpelinHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)

        # API endpoint for conversion
        if parsed.path == '/api/convert':
            self.handle_convert_get(parsed)
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == '/api/convert':
            self.handle_convert_post()
        else:
            self.send_error(404, "Not Found")

    def handle_convert_get(self, parsed):
        """Handle GET /api/convert?text=..."""
        query = parse_qs(parsed.query)
        text = query.get('text', [''])[0]

        if not text:
            self.send_json({'error': 'No text provided'}, 400)
            return

        try:
            result = convert_text(text)
            self.send_json({'result': result})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def handle_convert_post(self):
        """Handle POST /api/convert with JSON body."""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')

        try:
            data = json.loads(body)
            text = data.get('text', '')

            if not text:
                self.send_json({'error': 'No text provided'}, 400)
                return

            result = convert_text(text)
            self.send_json({'result': result})
        except json.JSONDecodeError:
            self.send_json({'error': 'Invalid JSON'}, 400)
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def send_json(self, data, status=200):
        """Send JSON response."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


def main():
    print(f"Starting spelin server on http://localhost:{PORT}")
    print(f"Serving files from: {WEB_DIR}")
    print(f"API endpoint: http://localhost:{PORT}/api/convert")
    print("\nPress Ctrl+C to stop\n")

    with http.server.HTTPServer(('', PORT), SpelinHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")


if __name__ == '__main__':
    main()
