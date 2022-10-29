# Use to create local host
import http.server
import socketserver

PORT = 3000


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="web", **kwargs)


Handler.extensions_map.update({
    ".js": "application/javascript",
})

httpd = socketserver.TCPServer(("", PORT), Handler)
print("[INFO]: Server is now up")
httpd.serve_forever()
