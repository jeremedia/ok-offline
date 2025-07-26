#!/usr/bin/env python3
"""
Simple HTTP server that serves index.html for all routes
to support client-side routing in the Burning Man PWA.
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL path
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # If it's a file request (has an extension), serve normally
        if '.' in os.path.basename(path):
            super().do_GET()
        else:
            # For all other routes, serve index.html
            self.path = '/index.html'
            super().do_GET()

PORT = 8000
Handler = SPAHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print("Serving index.html for all routes (SPA mode)")
    httpd.serve_forever()