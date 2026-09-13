import React, { useRef, useState } from 'react';
import { Button, SegmentedControl, Toggle, TextField, Dialog } from '../system/index.js';
import './project.css';

const install = 'npm install ./source-design-system-0.1.0.tgz';
const example = `import { useState } from 'react';
import { Button, TextField, Dialog } from '@local/source-design-system';
import '@local/source-design-system/styles.css';

export function ProjectSettings() {
  const [name, setName] = useState('My project');
  const [open, setOpen] = useState(false);
  return (
    <>
      <TextField label="Project name" value={name}
        onChange={event => setName(event.target.value)} />
      <Button onClick={() => setOpen(true)}>Review</Button>
      <Dialog open={open} onOpenChange={setOpen} title="Review changes">
        {name}
      </Dialog>
    </>
  );
}`;
const themeExample = `.my-product {
  --apple-blue: #185adb;
  --apple-blue-hover: #1349b5;
  --apple-radius-card: 12px;
  --apple-font-text: system-ui, sans-serif;
}
/* Dark theme: <section data-ds-theme="dark">...</section> */`;
const api = [
  ['Button', 'variant · size · disabled · loading', 'native onClick / ref', 'button · link · loading'],
  ['TextField', 'label · hint · error · name', 'native input props / ref', 'required · disabled · readOnly'],
  ['Toggle', 'label · checked / defaultChecked', 'onChange(boolean)', 'form name/value · disabled'],
  ['SegmentedControl', 'options · value / defaultValue', 'onChange(value)', 'arrows · Home/End · disabled option'],
  ['Dialog', 'open · title · description', 'onOpenChange(boolean)', 'Escape · focus return · modal'],
  ['Accordion', 'items: title / content', 'native details / summary', 'defaultOpen · stable id'],
  ['ProductTile', 'title · image · CTA labels', 'native article props / ref', 'compact · image alt · lazy loading'],
  ['Carousel', 'items · autoPlay · interval', 'label / translated controls', 'keyboard · reduced motion · focus pause'],
];
function Snippet({ title, children, onCopy }) {
  return <div className="project-code"><div><span>{title}</span><button type="button" onClick={() => onCopy(children)}>복사</button></div><pre><code>{children}</code></pre></div>;
}
export function ProjectReady({ onCopy }) {
  const [theme, setTheme] = useState('light');
  const [name, setName] = useState('My project');
  const [email, setEmail] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [density, setDensity] = useState('comfortable');
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState('');
  const confirmRef = useRef(null);
  const nameError = name.trim() ? '' : '프로젝트 이름을 입력해 주세요.';
  return <div className="project-guide">
    <header className="project-hero">
      <span className="eyebrow">BUILD WITH THE SYSTEM · REACT 19</span>
      <h1>프로젝트에 사용하기</h1>
      <p>토큰, 컴포넌트, 타입을 하나의 패키지로. 설치하고 제품의 스타일에 맞춰 조정하세요.</p>
      <div className="project-actions">
        <Button href="/source-design-system-0.1.0.tgz" download>컴포넌트 패키지 다운로드 <span aria-hidden="true">↧</span></Button>
        <a href="/source-local/src/system/index.d.ts" download>타입 선언 보기 ↗</a>
        <a href="/research-source-kit.tar.gz" download>수집 소스 전체 ↗</a>
      </div>
      <div className="project-facts"><span><b>8</b> React components</span><span><b>2</b> scoped themes</span><span><b>ESM</b> + TypeScript declarations</span><span><b>0</b> bundled media / external API calls</span></div>
    </header>
    <section className="project-section" aria-labelledby="project-setup"><div className="project-section-label"><span className="eyebrow">01 / INSTALL</span><h2 id="project-setup">설치와 첫 사용</h2><p>다운로드한 파일을 프로젝트에 넣고 설치합니다. 스타일은 앱 진입점에서 한 번 불러오세요.</p><a href="/source-local/docs/project-integration.md" target="_blank" rel="noreferrer">전체 사용 가이드 ↗</a></div><div className="project-snippets"><Snippet title="Terminal" onCopy={onCopy}>{install}</Snippet><Snippet title="React / JSX" onCopy={onCopy}>{example}</Snippet></div></section>
    <section className="project-section" aria-labelledby="project-preview"><div className="project-section-label"><span className="eyebrow">02 / INTERACT</span><h2 id="project-preview">실제 컴포넌트로 확인</h2><p>키보드와 터치로 상태를 확인하세요. 이름 검증, 입력, 선택, 모달 포커스가 연결된 로컬 폼입니다.</p><SegmentedControl label="Preview theme" options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]} value={theme} onChange={setTheme}/></div><div className="project-demo" data-ds-theme={theme}>
      <form onSubmit={event => {event.preventDefault();if (!nameError) setOpen(true);}}>
        <div><span className="project-demo-eyebrow">WORKSPACE SETTINGS</span><h3>프로젝트 설정</h3></div>
        <TextField label="프로젝트 이름" name="projectName" value={name} onChange={event=>setName(event.target.value)} hint="화면에 표시할 이름입니다." error={nameError} required />
        <TextField label="알림 이메일" name="email" type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="name@example.com" hint="선택 사항입니다." />
        <div><p className="project-demo-label">화면 밀도</p><SegmentedControl label="화면 밀도" value={density} onChange={setDensity} options={[{value:'comfortable',label:'기본'},{value:'compact',label:'촘촘하게'},{value:'custom',label:'준비 중',disabled:true}]}/></div>
        <Toggle label="변경 알림 받기" name="notifications" checked={notifications} onChange={setNotifications}/>
        <div className="project-demo-actions"><Button type="submit">변경 사항 확인</Button><span role="status">{saved}</span></div>
      </form>
      <Dialog open={open} onOpenChange={setOpen} title="설정 확인" description="확인하면 이 미리보기의 상태에 반영됩니다." closeLabel="설정 창 닫기" initialFocusRef={confirmRef} footer={<><Button variant="neutral" onClick={()=>setOpen(false)}>취소</Button><Button ref={confirmRef} onClick={()=>{setSaved(`${name} 설정을 반영했습니다.`);setOpen(false);}}>확인</Button></>}>
        <dl className="project-confirm"><div><dt>프로젝트</dt><dd>{name}</dd></div><div><dt>알림</dt><dd>{notifications?'사용':'끄기'}</dd></div><div><dt>이메일</dt><dd>{email || '미설정'}</dd></div></dl>
      </Dialog>
    </div></section>
    <section className="project-section" aria-labelledby="project-theme"><div className="project-section-label"><span className="eyebrow">03 / CUSTOMIZE</span><h2 id="project-theme">제품의 스타일로 조정</h2><p>테마를 컨테이너에 적용하고 CSS 변수를 덮어쓰세요. 기본 서체는 시스템 폰트이며 외부 자산 요청이 없습니다.</p></div><Snippet title="CSS / scoped overrides" onCopy={onCopy}>{themeExample}</Snippet></section>
    <section className="project-api" aria-labelledby="project-api"><span className="eyebrow">COMPONENT CONTRACT</span><h2 id="project-api">컴포넌트 API</h2><div className="project-table"><table><thead><tr><th>Component</th><th>Props</th><th>Events / integration</th><th>States</th></tr></thead><tbody>{api.map(row=><tr key={row[0]}>{row.map((cell,i)=><td key={i}>{i===0?<strong>{cell}</strong>:cell}</td>)}</tr>)}</tbody></table></div><p>React 19와 최신 브라우저의 네이티브 dialog를 기준으로 검증합니다. 패키지에는 직접 작성한 컴포넌트만 포함됩니다.</p></section>
  </div>;
}
