window.DEBUG = true

THREE = require 'three'
Stats = require 'stats-js'
testbed = require 'canvas-testbed'
blackhole = require './blackhole'

stats = null
renderer = null
scene = null
camera = null

if window.DEBUG
  stats = new Stats()
  document.body.appendChild stats.domElement


setupScene = ->
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera 70, 1, 1, 10000
  camera.position.y = 100
  camera.position.z = 50
  camera.lookAt( new THREE.Vector3(0, 0, 0) )
  scene.add camera

  pointLight = new THREE.PointLight 0xFFFFFF, 0.9
  pointLight.position.set -80, 80, -40
  scene.add pointLight

  #   Make a subdivided rectangle by creating a box and deleting the faces that
  # we don't want. This is so dumb....but it works for now.
  rectLength = 100
  rectHeight = 60
  # number of subdivisions
  div = Math.sqrt(100)
  rectGeom = new THREE.BoxGeometry(rectLength, 2, rectHeight, div, 1, div)
  # Delete the faces that we don't want.
  for face, i in rectGeom.faces by -1
    for vert in [face.a, face.b, face.c]
      if rectGeom.vertices[vert].y < 0
        rectGeom.faces.splice(i, 1)
        rectGeom.faceVertexUvs[0].splice(i, 1)
        break
  # rectMat = new THREE.MeshLambertMaterial(color: 0xFFFF00, wireframe: false)
  rectMat = new THREE.ShaderMaterial blackhole
  rectMesh = new THREE.Mesh(rectGeom, rectMat)
  rectMesh.position.y = 30
  scene.add rectMesh



render = (context, width, height, ms) ->
  window.DEBUG && stats.begin()
  renderer.render scene, camera
  window.DEBUG && stats.end()

resize = (width, height) ->
  renderer.setSize width, height
  camera.aspect = width/height
  camera.updateProjectionMatrix()

start = (opts, width, height) ->
  renderer = new THREE.WebGLRenderer(canvas: opts.canvas, antialias: false)
  renderer.setClearColor(0x0, 1)
  setupScene()
  resize width, height

onLoad = ->
  testbed render,
    onReady: start
    onResize: resize
    context: 'webgl'
    canvas: document.createElement('canvas')
    once: true
    retina: false
    resizeDebounce: 100

onLoad()
