import {useRef,useState} from 'react';
import {Button,Toggle,SegmentedControl,Accordion,ProductTile,Carousel,TextField,Dialog,tokens} from '@local/source-design-system';
import '@local/source-design-system/styles.css';
export function Consumer(){
 const [selected,setSelected]=useState('a');const [open,setOpen]=useState(false);const input=useRef<HTMLInputElement>(null);const button=useRef<HTMLButtonElement>(null);
 return <><Button ref={button} type="submit" loading={false} onClick={event=>event.currentTarget.focus()}>Save</Button><Button href="/next" disabled>Next</Button>
 <Toggle name="enabled" value="yes" defaultChecked onChange={checked=>console.log(checked.valueOf())}/>
 <SegmentedControl value={selected} onChange={setSelected} options={[{value:'a',label:'A'},{value:'b',label:'B',disabled:true}]}/>
 <Accordion items={[{id:'one',title:'Details',content:'Content',defaultOpen:true}]}/>
 <ProductTile title="Product" href="/product" ctaLabel="Details" headingLevel={3}/>
 <Carousel items={[{title:'Slide'}]} autoPlay={false} labels={{next:'Next item',slideTo:(index,item)=>`${index}: ${item.title}`}}/>
 <TextField ref={input} label="Name" name="name" hint="Required" required onChange={event=>console.log(event.target.value)}/>
 <Dialog open={open} onOpenChange={setOpen} title="Review" initialFocusRef={input}>Content</Dialog><p>{tokens.apple.color.blue}</p></>;
}
// @ts-expect-error Unsupported button variant must be rejected.
const wrongVariant=<Button variant="rainbow"/>;
// @ts-expect-error The field requires a visible label.
const unlabeled=<TextField/>;
// @ts-expect-error Dialog visibility callback receives boolean.
const wrongDialog=<Dialog open title="Title" onOpenChange={(value:string)=>console.log(value)}/>;
void [wrongVariant,unlabeled,wrongDialog];
