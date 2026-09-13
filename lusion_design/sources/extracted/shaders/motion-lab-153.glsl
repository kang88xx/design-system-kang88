precision mediump float; varying vec3 vNormal; varying vec3 vPosition; uniform vec3 uColor;
      void main(){vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-.5,1.,-1.5));
        vec3 view=normalize(vec3(0.,0.,-8.8)-vPosition);float diff=max(dot(n,light),0.);
        float spec=pow(max(dot(n,normalize(light+view)),0.),44.);
        float rim=pow(1.-max(dot(n,view),0.),3.);
        vec3 color=uColor*(.22+.78*diff)+vec3(.80,.85,1.)*spec*.8+vec3(.1,.13,.2)*rim;
        gl_FragColor=vec4(pow(color,vec3(.85)),1.);}