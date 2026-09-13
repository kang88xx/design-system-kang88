#!/bin/bash
# 더블클릭하면 디자인 시스템 허브 서버를 켜고 크롬으로 엽니다. 창을 닫으면 서버가 꺼집니다.
cd "/Volumes/T9/02_Source/All" || { echo "T9 드라이브가 연결되어 있지 않습니다."; read -n1 -p "아무 키나 누르면 닫힙니다."; exit 1; }
if curl -s -o /dev/null http://localhost:4170/All/; then
  echo "이미 실행 중입니다. 크롬으로 엽니다."
  open -a "Google Chrome" "http://localhost:4170/All/" 2>/dev/null || open "http://localhost:4170/All/"
  exit 0
fi
( sleep 1; open -a "Google Chrome" "http://localhost:4170/All/" 2>/dev/null || open "http://localhost:4170/All/" ) &
echo "Design Systems Hub: http://localhost:4170/All/"
echo "이 창을 닫으면 서버가 꺼집니다."
exec python3 serve.py --no-browser --quiet
