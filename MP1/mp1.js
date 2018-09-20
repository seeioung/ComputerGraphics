/**
 * @file 
 * @author Siyang Liu <sliu134@illinois.edu>  
 */

/** @global The WebGL context */
var gl;

/** @global The HTML5 canvas we draw on */
var canvas;

/** @global A simple GLSL shader program */
var shaderProgram;

/** @global The WebGL buffer holding the triangle */
var vertexPositionBuffer;

/** @global The WebGL buffer holding the vertex colors */
var vertexColorBuffer;

/** @global The Modelview matrix */
var mvMatrix = mat4.create();

/** @global The Projection matrix */
var pMatrix = mat4.create();

/** @global The angle of rotation around the x axis */
var rotationAngle = 0;

/** @global Number of frames so far*/
var framecount = 0;

 
//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 */
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
}

/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}


/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * Setup the fragment and vertex shaders
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
}

/**
 * Populate vertex buffer with data
 */
function loadVertices() {
  //Generate the vertex positions    
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  
  var triangleVertices = [
          // top
          -0.7, 0.75, 0.0,
          -0.7, 0.5, 0.0,
          -0.55, 0.5, 0.0,

          -0.7, 0.75, 0.0,
          -0.55, 0.5, 0.0,
          -0.25, 0.5, 0.0,

          -0.7, 0.75, 0.0,
          -0.25, 0.5, 0.0,
          0.25, 0.5, 0.0,

          -0.7, 0.75, 0.0,
          0.25, 0.5, 0.0,
          0.55, 0.5, 0.0,

          -0.7, 0.75, 0.0,
          0.55, 0.5, 0.0,
          0.7, 0.5, 0.0,

          -0.7, 0.75, 0.0,
          0.7, 0.5, 0.0,
          0.7, 0.75, 0.0,
         
          // left
          -0.55, -0.35, 0.0,
          -0.55, 0.5, 0.0,
          -0.25, 0.5, 0.0,

          -0.55, -0.35, 0.0,
          -0.25, 0.5, 0.0,
          -0.25, 0.3, 0.0,

          -0.55, -0.35, 0.0,
          -0.25, 0.3, 0.0,
          -0.25, -0.1, 0.0,

          -0.55, -0.35, 0.0,
          -0.25, -0.1, 0.0,
          -0.25, -0.35, 0.0,

          // right
          0.55, -0.35, 0.0,
          0.55, 0.5, 0.0,
          0.25, 0.5, 0.0,

          0.55, -0.35, 0.0,
          0.25, 0.5, 0.0,
          0.25, 0.3, 0.0,

          0.55, -0.35, 0.0,
          0.25, 0.3, 0.0,
          0.25, -0.1, 0.0,

          0.55, -0.35, 0.0,
          0.25, -0.1, 0.0,
          0.25, -0.35, 0.0,

          // left I
          -0.25, 0.3, 0.0,
          -0.25, -0.1, 0.0,
          -0.15, 0.3, 0.0,

          -0.25, -0.1, 0.0,
          -0.15, 0.3, 0.0,
          -0.15, -0.1, 0.0,

          // right I
          0.25, 0.3, 0.0,
          0.25, -0.1, 0.0,
          0.15, 0.3, 0.0,

          0.25, -0.1, 0.0,
          0.15, 0.3, 0.0,
          0.15, -0.1, 0.0,

          // bottoms
          -0.55, -0.45, 0.0,
          -0.55, -0.55, 0.0,
          -0.45, -0.45, 0.0,

          -0.55, -0.55, 0.0,
          -0.45, -0.45, 0.0,
          -0.45, -0.55, 0.0,

          -0.55, -0.55, 0.0,
          -0.45, -0.55, 0.0,
          -0.45, -0.6, 0.0,

          -0.35, -0.45, 0.0,
          -0.35, -0.65, 0.0,
          -0.25, -0.45, 0.0,

          -0.35, -0.65, 0.0,
          -0.25, -0.45, 0.0,
          -0.25, -0.65, 0.0,

          -0.35, -0.65, 0.0,
          -0.25, -0.65, 0.0,
          -0.25, -0.7, 0.0,

          -0.15, -0.45, 0.0,
          -0.15, -0.75, 0.0,
          -0.05, -0.45, 0.0,

          -0.15, -0.75, 0.0,
          -0.05, -0.45, 0.0,
          -0.05, -0.75, 0.0,

          -0.15, -0.75, 0.0,
          -0.05, -0.7, 0.0,
          -0.05, -0.8, 0.0,

          0.55, -0.45, 0.0,
          0.55, -0.55, 0.0,
          0.45, -0.45, 0.0,

          0.55, -0.55, 0.0,
          0.45, -0.45, 0.0,
          0.45, -0.55, 0.0,

          0.55, -0.55, 0.0,
          0.45, -0.55, 0.0,
          0.45, -0.6, 0.0,

          0.35, -0.45, 0.0,
          0.35, -0.65, 0.0,
          0.25, -0.45, 0.0,

          0.35, -0.65, 0.0,
          0.25, -0.45, 0.0,
          0.25, -0.65, 0.0,

          0.35, -0.65, 0.0,
          0.25, -0.65, 0.0,
          0.25, -0.7, 0.0,

          0.15, -0.45, 0.0,
          0.15, -0.75, 0.0,
          0.05, -0.45, 0.0,

          0.15, -0.75, 0.0,
          0.05, -0.45, 0.0,
          0.05, -0.75, 0.0,

          0.15, -0.75, 0.0,
          0.05, -0.7, 0.0,
          0.05, -0.8, 0.0,
  ];

  // move the blue middle pieces of "I"
  var degree = (framecount+1.0) % 360
  var gap = 0;
  if (degree > 45 && degree <= 90 || degree > 225 && degree <= 270) {
    gap = (0.4 / 45) * (degree % 45)
  }
  for (var i = 14*9; i < 16*9; i++) {
     if (i % 3 == 0) { // x
        triangleVertices[i] += gap;
     }
  }
  for (var i = 16*9; i < 18*9; i++) {
     if (i % 3 == 0) { // x
        triangleVertices[i] -= gap;
     }
  }

  // orange parts
  var dist = Math.sin(degToRad((framecount+1.0) % 360)) * 0.07
  for (var i = 18*9; i < triangleVertices.length; i++) {
    if (i % 3 == 1) { // y
      if (Math.floor((i - 18*9 - 1 ) / 9 / 3) % 2 == 0) {
        triangleVertices[i] += dist;
      }  else {
        triangleVertices[i] -= dist;
      }
    }
  }
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 108;
}

/**
 * Populate color buffer with data
 */
function loadColors() {
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    
  // Set the heart of the circle to be black    
  var colors = [
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,
    0.0902, 0.16078, 0.29412, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,

    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    0.9019, 0.29411, 0.23921, 1.0,
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 108;  
}
/**
 * Populate buffers with data
   @param {number} number of vertices to use around the circle boundary
 */
function setupBuffers() {
    
  //Generate the vertex positions    
  loadVertices();

  //Generate the vertex colors
  loadColors();
}

/**
 * Draw call that applies matrix transformations to model and draws model in frame
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 

  mat4.identity(mvMatrix);
  mat4.identity(pMatrix);

  // uniform affine transformation: rotation around z axis
  mat4.rotateZ(mvMatrix, mvMatrix, degToRad(rotationAngle));

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * Animation to be called from tick. Updates globals and performs animation for each tick.
 */
function animate() { 
    framecount += 1;
    rotationAngle = Math.sin(degToRad((framecount+1.0) % 360)) * 90;
    loadVertices()
}

/**
 * Tick called for every animation frame.
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

/**
 * Startup function called from html code to start program.
 */
 function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders(); 
  setupBuffers();
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

