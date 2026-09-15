<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { initOpalhaus } from '@opalhaus-design/system';
import '@opalhaus-design/system/styles.css';
const root = ref(null);
let ui;
onMounted(() => { ui = initOpalhaus(root.value); });
onBeforeUnmount(() => ui?.destroy());
</script>
<template>
  <main class="ods" ref="root"><section class="ods-container ods-section ods-stack">
    <span class="ods-eyebrow">Independent studio</span>
    <h1 class="ods-display" data-ods-reveal>Ideas into impact.</h1>
    <div><a class="ods-button" href="mailto:hello@example.com" aria-label="Let's talk"><span class="ods-button__window" aria-hidden="true"><span class="ods-button__label" data-label="Let's talk">Let's talk</span></span><span aria-hidden="true">↗</span></a></div>
    <details class="ods-faq"><summary>How do we start?</summary><div class="ods-faq__answer">Tell us about your project.</div></details>
  </section></main>
</template>
