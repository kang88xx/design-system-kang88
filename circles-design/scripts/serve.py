"""Local static catalog server with byte ranges (for large reference captures)."""
import argparse,functools,http.server,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        self.remaining=None
        request=self.headers.get('Range')
        target=pathlib.Path(self.translate_path(self.path))
        if not request or not target.is_file():
            return super().send_head()
        size=target.stat().st_size
        match=re.fullmatch(r'bytes=(\d*)-(\d*)',request)
        if not match or not any(match.groups()):
            self.send_error(416,'Unsupported range');return None
        left,right=match.groups()
        start=int(left) if left else max(0,size-int(right))
        end=min(int(right),size-1) if left and right else size-1
        if start>=size or start>end:
            self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return None
        source=target.open('rb');source.seek(start)
        self.remaining=end-start+1
        self.send_response(206)
        self.send_header('Content-Type',self.guess_type(str(target)))
        self.send_header('Accept-Ranges','bytes')
        self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length',str(self.remaining))
        self.end_headers()
        return source
    def copyfile(self,source,outputfile):
        if self.remaining is None:
            return super().copyfile(source,outputfile)
        while self.remaining:
            chunk=source.read(min(self.remaining,65536))
            if not chunk:break
            outputfile.write(chunk);self.remaining-=len(chunk)
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=40566);args=parser.parse_args()
    server=http.server.ThreadingHTTPServer(('127.0.0.1',args.port),functools.partial(Handler,directory=str(ROOT)))
    print(f'three circles design system: http://127.0.0.1:{server.server_port}',flush=True)
    server.serve_forever()
