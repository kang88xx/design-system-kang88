attribute vec3 aPosition; attribute vec3 aNormal;
      uniform vec3 uRotation; uniform vec3 uPosition; uniform float uAspect; uniform float uScale;
      varying vec3 vNormal; varying vec3 vPosition;
      vec3 rotate(vec3 p){vec3 c=cos(uRotation),s=sin(uRotation);
        p=vec3(p.x,p.y*c.x-p.z*s.x,p.y*s.x+p.z*c.x);
        p=vec3(p.x*c.y+p.z*s.y,p.y,-p.x*s.y+p.z*c.y);
        return vec3(p.x*c.z-p.y*s.z,p.x*s.z+p.y*c.z,p.z);}
      void main(){vec3 p=rotate(aPosition*uScale)+uPosition;vNormal=rotate(aNormal);vPosition=p;
        float z=8.8+p.z;gl_Position=vec4(p.x*2.65/uAspect,p.y*2.65,z*1.01005-.201005,z);}