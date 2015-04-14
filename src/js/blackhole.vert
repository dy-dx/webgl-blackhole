varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;


void main() {
  vUv = uv;
  vNormal = normal;
  vPos = position;

  vec3 p = position;
  float plen = length(p);

  // gravity
  p.y = -500.0/plen;

  // swirl
  float r = plen;
  float rot = -1.0 / pow(r*0.05, 1.5);

  float px = p.x;
  px  = p.x*cos(rot) - p.z*sin(rot);
  p.z = p.x*sin(rot) + p.z*cos(rot);
  p.x = px;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

  gl_Position = projectionMatrix * mvPosition;
}
