let canvas = document.getElementById('webgl');
let gl = getWebGLContext(canvas);

let VSHADER_SOURCE = null;
let FSHADER_SOURCE = null;

function getShader(gl, source, type) {
    var str = document.getElementById(source).text;
    return str;
}

VSHADER_SOURCE = getShader(gl, 'vert-shader', gl.VERTEX_SHADER);
FSHADER_SOURCE = getShader(gl, 'frag-shader', gl.FRAGMENT_SHADER);

if (VSHADER_SOURCE && FSHADER_SOURCE) {
    start();
}

function initVertexBuffers(gl) {
    let latitudeBands = 80;
    let longitudeBands = 80;
    let radius = 2;

    let vertexPositionData = [];
    let normalData = [];
    let textureCoordData = [];
    let indexData = [];

    // Calculate sphere vertex positions, normals, and texture coordinates.
    for (let latNumber = 0; latNumber <= latitudeBands; ++latNumber) {
        let theta = latNumber * Math.PI / latitudeBands;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        for (let longNumber = 0; longNumber <= longitudeBands; ++longNumber) {
            let phi = longNumber * 2 * Math.PI / longitudeBands;
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            let x = cosPhi * sinTheta;
            let y = cosTheta;
            let z = sinPhi * sinTheta;

            let u = 1 - (longNumber / longitudeBands);
            let v = 1 - (latNumber / latitudeBands);

            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);

            textureCoordData.push(u);
            textureCoordData.push(v);
        }
    }

    // Calculate sphere indices.
    for (let latNumber = 0; latNumber < latitudeBands; ++latNumber) {
        for (let longNumber = 0; longNumber < longitudeBands; ++longNumber) {
            let first = (latNumber * (longitudeBands + 1)) + longNumber;
            let second = first + longitudeBands + 1;

            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    vertexPositionData = new Float32Array(vertexPositionData);
    normalData = new Float32Array(normalData);
    textureCoordData = new Float32Array(textureCoordData);
    indexData = new Uint16Array(indexData);

    // Create buffer objects.
    let vertexPositionBuffer = gl.createBuffer();
    let vertexNormalBuffer = gl.createBuffer();
    let indexBuffer = gl.createBuffer();

    // Write the vertex positions to their buffer object.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexPositionData, gl.STATIC_DRAW);

    // Assign position coords to attrib and enable it.
    let VertexPosition = gl.getAttribLocation(gl.program, 'VertexPosition');
    gl.vertexAttribPointer(VertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(VertexPosition);

    // Write the normals to their buffer object.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW);
    var fsize = vertexPositionData.BYTES_PER_ELEMENT;
    // Assign normal to attrib and enable it.
    let VertexNormal = gl.getAttribLocation(gl.program, 'VertexNormal');
    gl.vertexAttribPointer(VertexNormal, 3, gl.FLOAT, false, fsize*3, 0);
    gl.enableVertexAttribArray(VertexNormal);

    // Pass index buffer data to element array buffer.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);

    return indexData.length
}

function start() {
    // Init vertex and fragment shaders.
    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);

    // Init vertex buffers (position, color, and index data).
    let n = initVertexBuffers(gl);

    // Set up clear color and enable depth testing.
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // // Create projection matrix.
    // let projection = mat4.create();
    // mat4.perspective(projection, Math.PI / 6, 1.0, 0.1, 100.0);

    // // Create model-view matrix.
    // let modelView = mat4.create();
    // mat4.lookAt(modelView, [0.0, 0.0, 10.0], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);

    // // Multiply the projection matrix by the model-view matrix to create the mvpMatrix.
    // let mvpMatrix = mat4.create();
    // mat4.multiply(mvpMatrix, projection, modelView);



    var viewMatrix = new Matrix4();
    viewMatrix.setLookAt(20, 0.0, 10.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
  
    var modelMatrix = new Matrix4();
    modelMatrix.setRotate(-30, 0, -15, 1);
    //设置模型矩阵的相关信息
    // var modelMatrix = new Matrix4();
    // modelMatrix.setRotate(0, 0, 5, 1);
    // modelMatrix.setTranslate(1, 0, 0);
    //console.log(modelMatrix);
  
    //设置透视投影矩阵
    var projMatrix = new Matrix4();
    projMatrix.setPerspective(20, canvas.width/canvas.height, 1, 1000.0);
  
    //计算出模型视图矩阵 viewMatrix.multiply(modelMatrix)相当于在着色器里面u_ViewMatrix * u_ModelMatrix
    var modeViewProjectMatrix = projMatrix.multiply(viewMatrix.multiply(modelMatrix));




    // Pass the modelView matrix into the shader.
    let ModelViewMatrix = gl.getUniformLocation(gl.program, 'ModelViewMatrix');
    gl.uniformMatrix4fv(ModelViewMatrix, false, viewMatrix.elements);

    // Pass the mvp matrix into the shader.
    let MVP = gl.getUniformLocation(gl.program, 'MVP');
    gl.uniformMatrix4fv(MVP, false, modeViewProjectMatrix.elements);

    // Pass the light position into the shader.
    let LightPosition = gl.getUniformLocation(gl.program, 'LightPosition');
    gl.uniform4fv(LightPosition, [10.0, 10.0, 10.0, 1.0]);

    // 材质漫反射颜色参数 传到着色器
    let Kd = gl.getUniformLocation(gl.program, 'Kd');
    gl.uniform3fv(Kd, [0.0, 0.5, 0.3]);

    // 光照漫反射参数
    let Ld = gl.getUniformLocation(gl.program, 'Ld');
    gl.uniform3fv(Ld, [1.0, 1.0, 1.0]);

    // Clear & draw.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);
    // gl.drawArrays(gl.LINE_STRIP,0, n/6);
}