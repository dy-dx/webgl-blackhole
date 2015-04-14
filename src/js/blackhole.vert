varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;


void main() {
  vUv = uv;
  vNormal = normal;

  vec3 p = position;
  p.y = -500.0/length(p);


  vPos = p;
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

  gl_Position = projectionMatrix * mvPosition;
}
