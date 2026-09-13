#!/usr/bin/env python3
"""Start the offline ARK document library. Python standard library only."""
import argparse,functools,threading,webbrowser
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8765)
    parser.add_argument('--no-browser',action='store_true')
    args=parser.parse_args()
    root=Path(__file__).resolve().parent
    try:server=ThreadingHTTPServer(('127.0.0.1',args.port),functools.partial(SimpleHTTPRequestHandler,directory=str(root)))
    except OSError as err:
        parser.exit(1,f'포트 {args.port}를 열 수 없습니다: {err}\n다른 포트로 실행: python3 start.py --port 8766\n')
    url=f'http://localhost:{server.server_port}/'
    print(f'ARK Document Design System: {url}\n종료: Ctrl+C',flush=True)
    if not args.no_browser:threading.Timer(.4,lambda:webbrowser.open(url)).start()
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
