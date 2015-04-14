(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var Stats, THREE, blackhole, camera, onLoad, rectMesh, render, renderer, resize, scene, setupScene, start, stats, testbed, time;

window.DEBUG = true;

THREE = (typeof window !== "undefined" ? window.THREE : typeof global !== "undefined" ? global.THREE : null);

Stats = require('stats-js');

testbed = require('canvas-testbed');

blackhole = require('./blackhole');

stats = null;

renderer = null;

scene = null;

camera = null;

rectMesh = null;

time = 0;

if (window.DEBUG) {
  stats = new Stats();
  document.body.appendChild(stats.domElement);
}

setupScene = function() {
  var div, face, i, j, k, len, pointLight, rectGeom, rectHeight, rectLength, rectMat, ref, ref1, vert;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, 1, 1, 10000);
  camera.position.y = 80;
  camera.position.z = 60;
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add(camera);
  pointLight = new THREE.PointLight(0xFFFFFF, 0.9);
  pointLight.position.set(-80, 100, -40);
  scene.add(pointLight);
  rectLength = 100;
  rectHeight = 60;
  div = 96;
  rectGeom = new THREE.BoxGeometry(rectLength, 2, rectHeight, div, 1, div);
  ref = rectGeom.faces;
  for (i = j = ref.length - 1; j >= 0; i = j += -1) {
    face = ref[i];
    ref1 = [face.a, face.b, face.c];
    for (k = 0, len = ref1.length; k < len; k++) {
      vert = ref1[k];
      if (rectGeom.vertices[vert].y < 0) {
        rectGeom.faces.splice(i, 1);
        rectGeom.faceVertexUvs[0].splice(i, 1);
        break;
      }
    }
  }
  rectMat = new THREE.ShaderMaterial(blackhole);
  rectMesh = new THREE.Mesh(rectGeom, rectMat);
  rectMesh.position.y = 30;
  return scene.add(rectMesh);
};

render = function(context, width, height, ms) {
  window.DEBUG && stats.begin();
  time += 1;
  rectMesh.material.uniforms.time.value = time;
  renderer.render(scene, camera);
  return window.DEBUG && stats.end();
};

resize = function(width, height) {
  renderer.setSize(width, height);
  camera.aspect = width / height;
  return camera.updateProjectionMatrix();
};

start = function(opts, width, height) {
  renderer = new THREE.WebGLRenderer({
    canvas: opts.canvas,
    antialias: false
  });
  renderer.setClearColor(0x0, 1);
  setupScene();
  return resize(width, height);
};

onLoad = function() {
  return testbed(render, {
    onReady: start,
    onResize: resize,
    context: 'webgl',
    canvas: document.createElement('canvas'),
    once: false,
    retina: false,
    resizeDebounce: 100
  });
};

onLoad();



}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./blackhole":17,"canvas-testbed":2,"stats-js":13}],2:[function(require,module,exports){
var domready = require('domready');
require('raf.js');

var CanvasApp = require('canvas-app');

module.exports = function( render, start, options ) {
	domready(function() {
		//options were provided as the first argument, no render handler
		if (typeof render === "object" && render) {
			options = render;
			render = null;
			start = null;
		}
		//options were provided as the second argument
		else if (typeof start === "object" && start) {
			options = start;
			start = null;
		}
		//otherwise options were provided as the third argument...

		
		options = options||{};
		if (typeof options.onReady !== 'function')
			options.onReady = start;

		var runner = CanvasApp(render, options);

		runner.canvas.setAttribute("id", "canvas");
		document.body.appendChild(runner.canvas);
		document.body.style.margin = "0";
		document.body.style.overflow = "hidden";
		
		runner.start();
	});
};
},{"canvas-app":3,"domready":9,"raf.js":10}],3:[function(require,module,exports){
var isGL = require('is-webgl-context');
var getGL = require('webgl-context');
var debounce = require('debounce');
var addEvent = require('add-event-listener');

function isCanvasContext(obj) {
    var ctx2d = typeof CanvasRenderingContext2D !== 'undefined' && obj instanceof CanvasRenderingContext2D;
    return obj && (ctx2d || isGL(obj));
}

function CanvasApp(render, options) {
    if (!(this instanceof CanvasApp))
        return new CanvasApp(render, options);

    //allow options to be passed as first argument
    if (typeof render === 'object' && render) {
        options = render;
        render = null;
    }

    render = typeof render === 'function' ? render : options.onRender;

    options = options||{};
    options.retina = typeof options.retina === "boolean" ? options.retina : true;
    
    var hasWidth = typeof options.width === "number", 
        hasHeight = typeof options.height === "number";

    //if either width or height is specified, don't auto-resize to the window...
    if (hasWidth || hasHeight) 
        options.ignoreResize = true;

    options.width = hasWidth ? options.width : window.innerWidth;
    options.height = hasHeight ? options.height : window.innerHeight;

    var DPR = options.retina ? (window.devicePixelRatio||1) : 1; 

    //setup the canvas
    var canvas,
        context,
        attribs = options.contextAttributes||{};

    this.isWebGL = false;

    //if user provided a context object
    if (isCanvasContext(options.context)) {
        context = options.context;
        canvas = context.canvas;
    }

    //otherwise allow for a string to set one up
    if (!canvas)
        canvas = options.canvas || document.createElement("canvas");

    canvas.width = options.width * DPR;
    canvas.height = options.height * DPR;

    if (!context) {
        if (options.context === "webgl" || options.context === "experimental-webgl") {
            context = getGL({ canvas: canvas, attributes: attribs });
            if (!context) {
                throw "WebGL Context Not Supported -- try enabling it or using a different browser";
            }
        } else {
            context = canvas.getContext(options.context||"2d", attribs);
        }
    }

    this.isWebGL = isGL(context);

    if (options.retina) {
        canvas.style.width = options.width + 'px';
        canvas.style.height = options.height + 'px';
    }

    this.running = false;
    this.width = options.width;
    this.height = options.height;
    this.canvas = canvas;
    this.context = context;
    this.onResize = options.onResize;
    this._DPR = DPR;
    this._retina = options.retina;
    this._once = options.once;
    this._ignoreResize = options.ignoreResize;
    this._lastFrame = null;
    this._then = Date.now();
    this.maxDeltaTime = typeof options.maxDeltaTime === 'number' ? options.maxDeltaTime : 1000/24;

    //FPS counter
    this.fps = 60;
    this._frames = 0;
    this._prevTime = this._then;

    if (!this._ignoreResize) {
        options.resizeDebounce = typeof options.resizeDebounce === 'number'
                    ? options.resizeDebounce : 50;
        addEvent(window, "resize", debounce(function() {
            this.resize(window.innerWidth, window.innerHeight);
        }.bind(this), options.resizeDebounce, false));

        addEvent(window, "orientationchange", function() {
            this.resize(window.innerWidth, window.innerHeight);
        }.bind(this));
    }

    if (typeof render === "function") {
        this.onRender = render.bind(this);   
    } else {
        //dummy render function
        this.onRender = function (context, width, height, dt) { };
    }

    this.renderOnce = function() {
        var now = Date.now();
        var dt = Math.min(this.maxDeltaTime, (now-this._then));

        this._frames++;
        if (now > this._prevTime + 1000) {
            this.fps = Math.round((this._frames * 1000) / (now - this._prevTime));

            this._prevTime = now;
            this._frames = 0;
        }

        if (!this.isWebGL) {
            this.context.save();
            this.context.scale(this._DPR, this._DPR);
        } else {
            this.context.viewport(0, 0, this.width * this._DPR, this.height * this._DPR);
        }
        
        this.onRender(this.context, this.width, this.height, dt);

        if (!this.isWebGL)
            this.context.restore();

        this._then = now;
    };

    this._renderHandler = function() {
        if (!this.running) 
            return;
        
        if (!this._once) {
            this._lastFrame = requestAnimationFrame(this._renderHandler);
        }

        this.renderOnce();
    }.bind(this);

    if (typeof options.onReady === "function") {
        options.onReady.call(this, context, this.width, this.height);
    }
}

Object.defineProperty(CanvasApp.prototype, 'retinaEnabled', {

    set: function(v) {
        this._retina = v;
        this._DPR = this._retina ? (window.devicePixelRatio||1) : 1;
        this.resize(this.width, this.height);
    },

    get: function() {
        return this._retina;
    }
});

Object.defineProperty(CanvasApp.prototype, 'deviceWidth', {

    get: function() {
        return this.width * this._DPR;
    }
});

Object.defineProperty(CanvasApp.prototype, 'deviceHeight', {

    get: function() {
        return this.height * this._DPR;
    }
});

CanvasApp.prototype.resetFPS = function() {
    this._frames = 0;
    this._prevTime = Date.now();
    this._then = this._prevTime;
    this.fps = 60;
};

CanvasApp.prototype.start = function() {
    if (this.running)
        return;
    
    if (this._lastFrame) 
        cancelAnimationFrame(this._lastFrame);

    //reset FPS counter
    this.resetFPS();

    this.running = true;
    this._lastFrame = requestAnimationFrame(this._renderHandler);
};

CanvasApp.prototype.stop = function() {
    if (this._lastFrame) {
        cancelAnimationFrame(this._lastFrame);
        this._lastFrame = null;
    }
    this.running = false;
};

CanvasApp.prototype.resize = function(width, height) {
    var canvas = this.canvas;

    this.width = width;
    this.height = height;
    canvas.width = this.width * this._DPR;
    canvas.height = this.height * this._DPR;

    if (this._retina) {
        canvas.style.width = this.width + 'px';
        canvas.style.height = this.height + 'px';
    }

    if (this._once)
        requestAnimationFrame(this._renderHandler);
    if (typeof this.onResize === "function")
        this.onResize(this.width, this.height);
};

module.exports = CanvasApp;
},{"add-event-listener":4,"debounce":5,"is-webgl-context":7,"webgl-context":8}],4:[function(require,module,exports){
addEventListener.removeEventListener = removeEventListener
addEventListener.addEventListener = addEventListener

module.exports = addEventListener

var Events = null

function addEventListener(el, eventName, listener, useCapture) {
  Events = Events || (
    document.addEventListener ?
    {add: stdAttach, rm: stdDetach} :
    {add: oldIEAttach, rm: oldIEDetach}
  )
  
  return Events.add(el, eventName, listener, useCapture)
}

function removeEventListener(el, eventName, listener, useCapture) {
  Events = Events || (
    document.addEventListener ?
    {add: stdAttach, rm: stdDetach} :
    {add: oldIEAttach, rm: oldIEDetach}
  )
  
  return Events.rm(el, eventName, listener, useCapture)
}

function stdAttach(el, eventName, listener, useCapture) {
  el.addEventListener(eventName, listener, useCapture)
}

function stdDetach(el, eventName, listener, useCapture) {
  el.removeEventListener(eventName, listener, useCapture)
}

function oldIEAttach(el, eventName, listener, useCapture) {
  if(useCapture) {
    throw new Error('cannot useCapture in oldIE')
  }

  el.attachEvent('on' + eventName, listener)
}

function oldIEDetach(el, eventName, listener, useCapture) {
  el.detachEvent('on' + eventName, listener)
}

},{}],5:[function(require,module,exports){

/**
 * Module dependencies.
 */

var now = require('date-now');

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */

module.exports = function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = now() - timestamp;

    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return function debounced() {
    context = this;
    args = arguments;
    timestamp = now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
};

},{"date-now":6}],6:[function(require,module,exports){
module.exports = Date.now || now

function now() {
    return new Date().getTime()
}

},{}],7:[function(require,module,exports){
module.exports = function(ctx) {
	if (!ctx) return false
	var gl = ctx
	//compatibility with Chrome WebGL Inspector Addon
	if (typeof ctx.rawgl !== 'undefined')
		gl = ctx.rawgl
	if (typeof WebGLRenderingContext !== 'undefined' && gl instanceof WebGLRenderingContext)
		return true
	return false
}
},{}],8:[function(require,module,exports){
module.exports = function(opts) {
    opts = opts||{};
    var canvas = opts.canvas || document.createElement("canvas");
    if (typeof opts.width === "number")
        canvas.width = opts.width;
    if (typeof opts.height === "number")
        canvas.height = opts.height;
    
    var attribs = (opts.attributes || opts.attribs || {});
    try {
        gl = (canvas.getContext('webgl', attribs) || canvas.getContext('experimental-webgl', attribs));
    } catch (e) {
        gl = null;
    }
    return gl;
};
},{}],9:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)


  if (!loaded)
  doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener)
    loaded = 1
    while (listener = fns.shift()) listener()
  })

  return function (fn) {
    loaded ? fn() : fns.push(fn)
  }

});

},{}],10:[function(require,module,exports){
/*
 * raf.js
 * https://github.com/ngryman/raf.js
 *
 * original requestAnimationFrame polyfill by Erik Möller
 * inspired from paul_irish gist and post
 *
 * Copyright (c) 2013 ngryman
 * Licensed under the MIT license.
 */

(function(window) {
	var lastTime = 0,
		vendors = ['webkit', 'moz'],
		requestAnimationFrame = window.requestAnimationFrame,
		cancelAnimationFrame = window.cancelAnimationFrame,
		i = vendors.length;

	// try to un-prefix existing raf
	while (--i >= 0 && !requestAnimationFrame) {
		requestAnimationFrame = window[vendors[i] + 'RequestAnimationFrame'];
		cancelAnimationFrame = window[vendors[i] + 'CancelAnimationFrame'];
	}

	// polyfill with setTimeout fallback
	// heavily inspired from @darius gist mod: https://gist.github.com/paulirish/1579671#comment-837945
	if (!requestAnimationFrame || !cancelAnimationFrame) {
		requestAnimationFrame = function(callback) {
			var now = +new Date(), nextTime = Math.max(lastTime + 16, now);
			return setTimeout(function() {
				callback(lastTime = nextTime);
			}, nextTime - now);
		};

		cancelAnimationFrame = clearTimeout;
	}

	// export to window
	window.requestAnimationFrame = requestAnimationFrame;
	window.cancelAnimationFrame = cancelAnimationFrame;
}(window));

},{}],11:[function(require,module,exports){
module.exports = noop

function noop() {
  throw new Error(
      'You should bundle your code ' +
      'using `glslify` as a transform.'
  )
}

},{}],12:[function(require,module,exports){
module.exports = programify

function programify(vertex, fragment, uniforms, attributes) {
  return {
    vertex: vertex, 
    fragment: fragment,
    uniforms: uniforms, 
    attributes: attributes
  };
}

},{}],13:[function(require,module,exports){
// stats.js - http://github.com/mrdoob/stats.js
var Stats=function(){var l=Date.now(),m=l,g=0,n=Infinity,o=0,h=0,p=Infinity,q=0,r=0,s=0,f=document.createElement("div");f.id="stats";f.addEventListener("mousedown",function(b){b.preventDefault();t(++s%2)},!1);f.style.cssText="width:80px;opacity:0.9;cursor:pointer";var a=document.createElement("div");a.id="fps";a.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#002";f.appendChild(a);var i=document.createElement("div");i.id="fpsText";i.style.cssText="color:#0ff;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";
i.innerHTML="FPS";a.appendChild(i);var c=document.createElement("div");c.id="fpsGraph";c.style.cssText="position:relative;width:74px;height:30px;background-color:#0ff";for(a.appendChild(c);74>c.children.length;){var j=document.createElement("span");j.style.cssText="width:1px;height:30px;float:left;background-color:#113";c.appendChild(j)}var d=document.createElement("div");d.id="ms";d.style.cssText="padding:0 0 3px 3px;text-align:left;background-color:#020;display:none";f.appendChild(d);var k=document.createElement("div");
k.id="msText";k.style.cssText="color:#0f0;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px";k.innerHTML="MS";d.appendChild(k);var e=document.createElement("div");e.id="msGraph";e.style.cssText="position:relative;width:74px;height:30px;background-color:#0f0";for(d.appendChild(e);74>e.children.length;)j=document.createElement("span"),j.style.cssText="width:1px;height:30px;float:left;background-color:#131",e.appendChild(j);var t=function(b){s=b;switch(s){case 0:a.style.display=
"block";d.style.display="none";break;case 1:a.style.display="none",d.style.display="block"}};return{REVISION:12,domElement:f,setMode:t,begin:function(){l=Date.now()},end:function(){var b=Date.now();g=b-l;n=Math.min(n,g);o=Math.max(o,g);k.textContent=g+" MS ("+n+"-"+o+")";var a=Math.min(30,30-30*(g/200));e.appendChild(e.firstChild).style.height=a+"px";r++;b>m+1E3&&(h=Math.round(1E3*r/(b-m)),p=Math.min(p,h),q=Math.max(q,h),i.textContent=h+" FPS ("+p+"-"+q+")",a=Math.min(30,30-30*(h/100)),c.appendChild(c.firstChild).style.height=
a+"px",m=b,r=0);return b},update:function(){l=this.end()}}};"object"===typeof module&&(module.exports=Stats);

},{}],14:[function(require,module,exports){
var createTypes = require('./types')


module.exports = function(THREE) {

    var types = createTypes(THREE) 

    return function create(glShader, opts) {
        opts = opts||{}

        if (typeof opts.colors === 'string')
            opts.colors = [opts.colors]
        
        var tUniforms = types( glShader.uniforms, opts.colors )
        var tAttribs = types( glShader.attributes, opts.colors )
            
        //clear the attribute arrays
        for (var k in tAttribs) {
            tAttribs[k].value = []
        }

        return {
            vertexShader: glShader.vertex,
            fragmentShader: glShader.fragment,
            uniforms: tUniforms,
            attributes: tAttribs
        }
    }
}
},{"./types":15}],15:[function(require,module,exports){
var typeMap = {
    'int': 'i',
    'float': 'f',
    'ivec2': 'i2',
    'ivec3': 'i3',
    'ivec4': 'i4',
    'vec2': 'v2',
    'vec3': 'v3',
    'vec4': 'v4',
    'mat4': 'm4',
    'mat3': 'm3',
    'sampler2D': 't',
    'samplerCube': 't'
}

function create(THREE) {
    function newInstance(type, isArray) {
        switch (type) {
            case 'float': 
            case 'int':
                return 0
            case 'vec2':
            case 'ivec2':
                return new THREE.Vector2()
            case 'vec3':
            case 'ivec3':
                return new THREE.Vector3()
            case 'vec4':
            case 'ivec4':
                return new THREE.Vector4()
            case 'mat4':
                return new THREE.Matrix4()
            case 'mat3':
                return new THREE.Matrix3()
            case 'samplerCube':
            case 'sampler2D':
                return new THREE.Texture()
            default:
                return undefined
        }
    }

    function defaultValue(type, isArray, arrayLen) {
        if (isArray) {
            //ThreeJS flattens ivec3 type
            //(we don't support 'fv' type)
            if (type === 'ivec3')
                arrayLen *= 3
            var ar = new Array(arrayLen)
            for (var i=0; i<ar.length; i++)
                ar[i] = newInstance(type, isArray)
            return ar
        }  
        return newInstance(type)
    }

    function getType(type, isArray) {
        if (!isArray)
            return typeMap[type]

        if (type === 'int')
            return 'iv1'
        else if (type === 'float')
            return 'fv1'
        else
            return typeMap[type]+'v'
    }

    return function setupUniforms(glUniforms, colorNames) {
        if (!Array.isArray(colorNames))
            colorNames = Array.prototype.slice.call(arguments, 1)

        var result = {}
        var arrays = {}

        //map uniform types
        glUniforms.forEach(function(uniform) {
            var name = uniform.name
            var isArray = /(.+)\[[0-9]+\]/.exec(name)

            //special case: colors...
            if (colorNames && colorNames.indexOf(name) !== -1) {
                if (isArray)
                    throw new Error("array of color uniforms not supported")
                if (uniform.type !== 'vec3')
                    throw new Error("ThreeJS expects vec3 for Color uniforms") 
                result[name] = {
                    type: 'c',
                    value: new THREE.Color()
                }
                return
            }

            if (isArray) {
                name = isArray[1]
                if (name in arrays) 
                    arrays[name].count++ 
                else
                    arrays[name] = { count: 1, type: uniform.type }
            }
            result[name] = { 
                type: getType(uniform.type, isArray), 
                value: isArray ? null : defaultValue(uniform.type) 
            }
        })

        //now clean up any array values
        for (var k in result) {
            var u = result[k]
            if (k in arrays) { //is an array
                var a = arrays[k]
                u.value = defaultValue(a.type, true, a.count)
            }
        }
        return result
    }
}

module.exports = create
},{}],16:[function(require,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],17:[function(require,module,exports){
(function (global){
var glslify = require("glslify");
var THREE, createShader, opts, shader, source, xtend;
THREE = (typeof window !== "undefined" ? window.THREE : typeof global !== "undefined" ? global.THREE : null);
xtend = require("xtend");
source = require("glslify/simple-adapter.js")("\n#define GLSLIFY 1\n\nuniform float time;\nvarying vec2 vUv;\nvarying vec3 vPos;\nvarying vec3 vNormal;\nvoid main() {\n  vUv = uv;\n  vNormal = normal;\n  vPos = position;\n  vec3 p = position;\n  float plen = length(p);\n  p.y = 440.0 * (0.5 * sin(time / 50.0) - 0.5) / plen;\n  float r = plen;\n  float rot = (0.5 * sin(time / 50.0) - 0.5) / pow(r * 0.05, 1.5);\n  float px = p.x;\n  px = p.x * cos(rot) - p.z * sin(rot);\n  p.z = p.x * sin(rot) + p.z * cos(rot);\n  p.x = px;\n  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);\n  gl_Position = projectionMatrix * mvPosition;\n}", "\n#define GLSLIFY 1\n\nuniform sampler2D tDiffuse;\nuniform sampler2D tColorLUT;\nvarying vec2 vUv;\nvarying vec3 vPos;\nvarying vec3 vNormal;\n#ifdef MAX_POINT_LIGHTS\n\nuniform vec3 pointLightColor[MAX_POINT_LIGHTS];\nuniform vec3 pointLightPosition[MAX_POINT_LIGHTS];\nuniform float pointLightDistance[MAX_POINT_LIGHTS];\n#endif\n\nvoid main() {\n  vec4 lights = vec4(1.0);\n  #ifdef MAX_POINT_LIGHTS\n  lights = vec4(0.0, 0.0, 0.0, 1.0);\n  for(int l = 0; l < MAX_POINT_LIGHTS; l++) {\n    vec3 lightDirection = normalize(vPos - pointLightPosition[l]);\n    lights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0) * pointLightColor[l];\n  }\n  vec4 ambient = vec4(0.2, 0.2, 0.2, 1.0);\n  lights += ambient;\n  lights = min(lights, 1.0);\n  #endif\n  vec2 uv = vUv;\n  vec3 normal = vNormal;\n  vec2 p = sign(sin(uv.xy * 50.0));\n  float c = p.x * p.y;\n  gl_FragColor = vec4(c, c, c, 1.0) * lights;\n}", [{"name":"time","type":"float"},{"name":"tDiffuse","type":"sampler2D"},{"name":"tColorLUT","type":"sampler2D"}], []);
createShader = require("three-glslify")(THREE);

opts = {
    lights: true,
    wireframe: false,
    morphTargets: false
};

shader = xtend(createShader(source), opts);
shader.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib["lights"], shader.uniforms]);
module.exports = shader;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"glslify":11,"glslify/simple-adapter.js":12,"three-glslify":14,"xtend":16}]},{},[1]);
