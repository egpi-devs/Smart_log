"""
Simple static file server for the Frontend folder.
Serves the landing page and all sub-apps (qc/ and production/).
"""
import http.server
import socketserver
import os

PORT = 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        print(f"  [Frontend] {self.address_string()} - {format % args}")

print(f"╔══════════════════════════════════════════╗")
print(f"║   Frontend Server running on port {PORT}   ║")
print(f"║   Open: http://10.0.100.175:{PORT}          ║")
print(f"╚══════════════════════════════════════════╝")

with socketserver.TCPServer(("0.0.0.0", PORT), NoCacheHTTPRequestHandler) as httpd:
    httpd.serve_forever()
