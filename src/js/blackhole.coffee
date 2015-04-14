`var glslify = require('glslify');`
# glslify = require('glslify')

THREE = require('three')
xtend = require('xtend')

source = glslify
  vertex: './blackhole.vert'
  fragment: './checkerboard.frag'
  sourceOnly: true

createShader = require('three-glslify')(THREE)

opts =
  lights: true
  wireframe: false
  morphTargets: false


shader = xtend(createShader(source), opts)

shader.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib['lights'], shader.uniforms])

module.exports = shader
