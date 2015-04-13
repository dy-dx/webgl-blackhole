window.DEBUG = true

THREE = require 'three'
Stats = require 'stats-js'
testbed = require 'canvas-testbed'

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

  ambientLight = new THREE.AmbientLight 0x404040
  scene.add ambientLight

  pointLight = new THREE.PointLight 0xFFFFFF
  pointLight.position.set -10, 80, 0
  scene.add pointLight

  rectLength = 100
  rectHeight = 60
  rectShape = new THREE.Shape()
  rectShape.moveTo 0, 0
  rectShape.lineTo 0, rectHeight
  rectShape.lineTo rectLength, rectHeight
  rectShape.lineTo rectLength, 0
  rectShape.lineTo 0, 0

  rectGeom = new THREE.ShapeGeometry(rectShape)
  rectMat = new THREE.MeshLambertMaterial(color: 0xFFFF00, wireframe: true)
  rectMesh = new THREE.Mesh(rectGeom, rectMat)
  rectMesh.rotation.x = -Math.PI/2
  rectMesh.position.x = -rectLength/2
  rectMesh.position.z = rectHeight/2
  scene.add rectMesh



render = (context, width, height, ms) ->
  window.DEBUG && stats.begin()
  renderer.render scene, camera
  window.DEBUG && stats.end()

resize = (width, height) ->
  console.log width, height
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
