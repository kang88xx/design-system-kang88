import { useEffect, useRef } from 'react';
import { initOpalhaus } from '@opalhaus-design/system';
import '@opalhaus-design/system/styles.css';

export default function Studio() {
  const root = useRef(null);
  useEffect(() => {
    const ui = initOpalhaus(root.current);
    return () => ui.destroy();
  }, []);
  return <main className="ods" ref={root}>
    <section className="ods-container ods-section ods-stack">
      <span className="ods-eyebrow">Independent studio</span>
      <h1 className="ods-display" data-ods-reveal>Ideas into impact.</h1>
      <div><a className="ods-button" href="mailto:hello@example.com" aria-label="Let's talk">
        <span className="ods-button__window" aria-hidden="true"><span className="ods-button__label" data-label="Let's talk">Let's talk</span></span>
        <span aria-hidden="true">↗</span>
      </a></div>
      <details className="ods-faq"><summary>How do we start?</summary><div className="ods-faq__answer">Tell us about your project.</div></details>
    </section>
  </main>;
}
