var gl;
var SPHERE_NUM = 12;

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {}
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

//load glsl scripts from dom
function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.lightingDirectionUniform = gl.getUniformLocation(shaderProgram, "uLightingDirection");
    shaderProgram.directionalColorUniform = gl.getUniformLocation(shaderProgram, "uDirectionalColor");
    shaderProgram.alphaUniform = gl.getUniformLocation(shaderProgram, "uAlpha");
}


function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
}


var dropTexture;

function initTexture() {
    dropTexture = gl.createTexture();
    dropTexture.image = new Image();
    dropTexture.image.onload = function() {
        handleLoadedTexture(dropTexture)
    }

    dropTexture.image.src = "/assets/love_half_r.png";
}

var g_mMatrix = [];
var g_invMatrix = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

//init model/view matrix for mapping multiple drops
var move = [0.05, 0.0, 0.0];
for (var i = 0; i < SPHERE_NUM; i++) {
    randx = Math.random() * 20.0 - 10.0;
    randy = Math.random() * 10;
    randz = Math.random() * 4.0 - 20.0;
    move = [randx, randy, randz];
    g_mMatrix[i] = mat4.identity(mat4.create());
    g_invMatrix[i] = mat4.identity(mat4.create());
    mat4.translate(g_mMatrix[i], move, g_mMatrix[i]);
    mat4.inverse(g_mMatrix[i], g_invMatrix[i]);
}

function setMatrixUniforms(i) {
    if (g_mMatrix.length == 0) {
        throw "Invalid mvMatrix!";
    } else {
        gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, g_mMatrix[i]);
    }

    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(g_mMatrix[i], normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var dropRotationMatrix = mat4.create();
mat4.identity(dropRotationMatrix);

var dropVertexPositionBuffer;
var dropVertexNormalBuffer;
var dropVertexTextureCoordBuffer;
var dropVertexIndexBuffer;

function initBuffers() {
    var latitudeBands = 30;
    var longitudeBands = 30;
    var radius = 1;

    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = -cosTheta; //倒影效果
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);
            textureCoordData.push(u);
            textureCoordData.push(v);
            //make a random ellipse
            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);
        }
    }

    var indexData = [];
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    dropVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dropVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
    dropVertexNormalBuffer.itemSize = 3;
    dropVertexNormalBuffer.numItems = normalData.length / 3;

    dropVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dropVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
    dropVertexTextureCoordBuffer.itemSize = 2;
    dropVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    dropVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, dropVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    dropVertexPositionBuffer.itemSize = 3;
    dropVertexPositionBuffer.numItems = vertexPositionData.length / 3;

    dropVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dropVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
    dropVertexIndexBuffer.itemSize = 1;
    dropVertexIndexBuffer.numItems = indexData.length;
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    var move = [0.0, 0.0, 0.0];
    for (var i = 0; i < SPHERE_NUM; i++) {
        //move= [0.0,-0.01,0.0];
        //mat4.translate(g_mMatrix[i],move,g_mMatrix[i]);
        g_mMatrix[i][13] -= 0.005 + i * Math.random() * 0.005;
        if (g_mMatrix[i][13] < -6.5) {
            g_mMatrix[i][12] = Math.random() * 20.0 - 10.0;
            g_mMatrix[i][13] = 6.5;
            g_mMatrix[i][14] = Math.random() * 4.0 - 20.0;
        };

        mvMatrix = g_mMatrix[i];
        mat4.multiply(mvMatrix, dropRotationMatrix);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, dropTexture);
        gl.uniform1i(shaderProgram.samplerUniform, 0);

        var blending = false;
        if (blending) {
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
            gl.enable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);
            gl.uniform1f(shaderProgram.alphaUniform, 0.5);
        } else {
            gl.disable(gl.BLEND);
            gl.enable(gl.DEPTH_TEST);
        }


        gl.bindBuffer(gl.ARRAY_BUFFER, dropVertexPositionBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, dropVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, dropVertexTextureCoordBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, dropVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, dropVertexNormalBuffer);
        gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, dropVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, dropVertexIndexBuffer);

        setMatrixUniforms(i);
        gl.drawElements(gl.TRIANGLES, dropVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    }
}

function tick() {
    requestAnimationFrame(tick);
    drawScene();
}

function main() {
    var canvas = document.getElementById("container");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();

    gl.clearColor(0.0, 0.0, 0.0, 0.3); //clear background
    gl.enable(gl.DEPTH_TEST);

    tick();
}

window.addEventListener('load', main);