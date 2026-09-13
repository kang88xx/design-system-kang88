import React, {useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Button,TextField,Toggle,SegmentedControl,Accordion,ProductTile,Carousel,Dialog} from '@local/source-design-system';
import '@local/source-design-system/styles.css';
function Consumer(){
 const [choice,setChoice]=useState('first');
 const [email,setEmail]=useState('user@example.test');
 const [data,setData]=useState('');
 const [open,setOpen]=useState(false);
 const [items,setItems]=useState([{title:'First slide'},{title:'Second slide'},{title:'Third slide'}]);
 const [theme,setTheme]=useState('light');
 const fieldRef=useRef(null),nativeRef=useRef(null);
 return <><h1 id="host-heading">Host application</h1><ul id="host-list"><li>Unstyled host list</li></ul><button onClick={()=>setTheme(theme==='light'?'dark':'light')}>Switch theme</button>
 <main data-ds-theme={theme} style={{padding:16,background:'var(--apple-surface)',color:'var(--apple-black)',display:'grid',gap:24}}>
 <form onSubmit={e=>{e.preventDefault();setData(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))));}} style={{display:'grid',gap:16}}>
 <TextField ref={nativeRef} label="Email" name="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} hint="Work email" error={email.includes('@')?'':'Enter an email'} aria-describedby="policy"/>
 <p id="policy">Local example.</p><TextField label="Disabled field" name="ignored" defaultValue="ignored" disabled/>
 <Toggle name="notify" value="yes" defaultChecked aria-label="Notifications"/>
 <Button type="submit">Submit form</Button><Button type="button" loading onClick={()=>setData('BAD')}>Loading action</Button><Button href="/forbidden" disabled>Disabled link</Button>
 </form><output id="form-result" style={{overflowWrap:"anywhere",minWidth:0}}>{data}</output><Button onClick={()=>nativeRef.current.focus()}>Focus field</Button>
 <SegmentedControl label="Density" options={[{value:'first',label:'First'},{value:'disabled',label:'Disabled',disabled:true},{value:'last',label:'Last'}]} value={choice} onChange={setChoice}/><output id="choice">{choice}</output><button onClick={()=>setChoice('missing')}>Invalidate choice</button>
 <Accordion items={[{id:'delivery',title:'Delivery',content:'Delivery details',defaultOpen:true}]}/>
 <ProductTile title="Reusable card" subtitle="Own content" href="#own-product" ctaLabel="View details" headingLevel={3} compact/>
 <Carousel label="Examples" items={items} autoPlay={false}/><button onClick={()=>setItems([{title:'First slide'}])}>Keep first slide</button>
 <Button onClick={()=>setOpen(true)}>Open dialog</Button>
 <Dialog open={open} onOpenChange={setOpen} title="Edit project" description="Local settings" initialFocusRef={fieldRef} footer={<Button onClick={()=>setOpen(false)}>Save dialog</Button>}><TextField ref={fieldRef} label="Dialog name" defaultValue="Project"/></Dialog>
 </main></>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Consumer/></React.StrictMode>);
