uniform sampler2D tDiffuse;
uniform sampler2D tColorLUT;
// uniform float time;
varying vec2 vUv;
varying vec3 vPos;
varying vec3 vNormal;

#ifdef MAX_POINT_LIGHTS
  uniform vec3 pointLightColor[MAX_POINT_LIGHTS];
  uniform vec3 pointLightPosition[MAX_POINT_LIGHTS];
  uniform float pointLightDistance[MAX_POINT_LIGHTS];
#endif

void main() {
  vec4 lights = vec4(1.0);
#ifdef MAX_POINT_LIGHTS
  lights = vec4(0.0, 0.0, 0.0, 1.0);
  for (int l = 0; l < MAX_POINT_LIGHTS; l++) {
    vec3 lightDirection = normalize(vPos - pointLightPosition[l]);
    lights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0)
                       * pointLightColor[l];
  }

  vec4 ambient = vec4(0.2, 0.2, 0.2, 1.0);
  lights += ambient;
  lights = min(lights, 1.0);
#endif


  vec2 uv = vUv;
  vec3 normal = vNormal;

  vec2 p = sign(sin(uv.xy * 50.0));
  float c = p.x * p.y;
  gl_FragColor = vec4(c, c, c, 1.0) * lights;
}
