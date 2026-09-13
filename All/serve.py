#!/usr/bin/env python3
"""Design Systems Hub 로컬 서버. 표준 라이브러리만 사용합니다.

- 루트: 02_Source (형제 폴더의 디자인 시스템을 그대로 서빙)
- 허브: http://localhost:4170/All/
- Apple 앱(Vite 빌드)이 요청하는 절대 경로(/assets, /research 등)는
  루트에 없으면 apple_design/app/dist/client 로 폴백합니다.
"""
import argparse, functools, mimetypes, os, threading, webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HUB = Path(__file__).resolve().parent          # .../02_Source/All
ROOT = HUB.parent                              # .../02_Source
APPLE_CLIENT = ROOT / "apple_design" / "app" / "dist" / "client"

mimetypes.add_type("text/markdown; charset=utf-8", ".md")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("application/json", ".json")


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        local = super().translate_path(path)
        if os.path.exists(local):
            return local
        # Apple Vite 빌드는 base "/" 기준 절대 경로를 사용한다.
        rel = os.path.relpath(local, str(ROOT))
        candidate = APPLE_CLIENT / rel
        if candidate.exists():
            return str(candidate)
        return local

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "--quiet" not in os.sys.argv:
            super().log_message(fmt, *args)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--port", type=int, default=4170)
    p.add_argument("--no-browser", action="store_true")
    p.add_argument("--quiet", action="store_true")
    a = p.parse_args()
    try:
        server = ThreadingHTTPServer(("127.0.0.1", a.port), functools.partial(Handler, directory=str(ROOT)))
    except OSError as err:
        p.exit(1, f"포트 {a.port}를 열 수 없습니다: {err}\n다른 포트: python3 serve.py --port 4171\n")
    url = f"http://localhost:{server.server_port}/All/"
    print(f"Design Systems Hub: {url}\n종료: Ctrl+C", flush=True)
    if not a.no_browser:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
