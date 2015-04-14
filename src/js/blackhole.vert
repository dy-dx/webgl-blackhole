uniform float time;

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
  p.y = 440.0 * (0.5*sin(time/50.0) - 0.5) / plen;

  // swirl
  float r = plen;
  float rot = (0.5*sin(time/50.0) - 0.5) / pow(r*0.05, 1.5);

  float px = p.x;
  px  = p.x*cos(rot) - p.z*sin(rot);
  p.z = p.x*sin(rot) + p.z*cos(rot);
  p.x = px;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

  gl_Position = projectionMatrix * mvPosition;
}
