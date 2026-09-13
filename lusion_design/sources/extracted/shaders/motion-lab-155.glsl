precision mediump float; varying vec2 vUv; uniform sampler2D uImage;uniform sampler2D uDepth;
        uniform vec2 uPointer;uniform vec2 uCover;uniform float uShowDepth;
        void main(){vec2 uv=(vUv-.5)*uCover*.94+.5;vec2 ray=uPointer*.026;vec2 sampleUv=uv;
          for(int i=0;i<12;i++){float d=texture2D(uDepth,clamp(sampleUv,.001,.999)).r;sampleUv=uv+ray*(d-.5);}
          sampleUv=clamp(sampleUv,.001,.999);vec4 rgb=texture2D(uImage,sampleUv);float d=texture2D(uDepth,uv).r;
          gl_FragColor=mix(rgb,vec4(vec3(d),1.),uShowDepth);}