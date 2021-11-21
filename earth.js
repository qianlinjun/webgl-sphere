// 区别在于如果一个变量表示顶点相关的数据并且需要从javascript代码中获取顶点数据，
// 需要使用attribute关键字声明该变量，
// 比如上面代码attribute关键字声明的顶点位置变量apos、顶点颜色变量a_color、
// 顶点法向量变量a_normal。如果一个变量是非顶点相关的数据并且
// 需要javascript传递该变量相关的数据，需要使用uniform关键字声明该变量，
// 比如上面代码通过uniform关键字声明的光源位置变量u_lightPosition、光源颜色变量u_lightColor。
// uniform变量就像是C语言里面的常量（const ），它不能被shader程序修改。（shader只能用，不能改）
// attribute变量是只能在vertex shader中使用的变量。
// varying变量是vertex和fragment shader之间做数据传递用的

//顶点着色器 参考 https://chowdera.com/2021/04/20210426160739338o.html
var VSHADER_SOURCE = "" +
"attribute vec3 VertexPosition;\n" +
"attribute vec3 VertexNormal;\n" +
"uniform vec4 LightPosition;\n" +
"uniform vec3 Kd;\n" +
"uniform vec3 Ld;\n" +
"uniform mat4 ModelViewMatrix;\n" +
"uniform mat4 MVP;\n" +
"varying vec3 LightIntensity;\n" +

"void main() {\n" +
 // Convert normal and position to eye coords.
  "vec3 tnorm = normalize(VertexNormal);\n" +
  "vec4 eyeCoords = ModelViewMatrix * vec4(VertexPosition, 1.0);\n" +
  "vec3 s = normalize(vec3(LightPosition - eyeCoords));\n" +

  // Diffuse shading equation.
  "LightIntensity = Ld * Kd * max(dot(s, tnorm), 0.0);\n" +

  // Convert position to clip coords and pass along.
  "gl_Position = MVP * vec4(VertexPosition, 1.0);\n" +
  "}\n"

// 片段着色器
var FSHADER_SOURCE = "" +
"#ifdef GL_ES\n" +
" precision mediump float;\n" +
"#endif\n" +

"varying vec3 LightIntensity;\n" +

"void main() {\n" +
"gl_FragColor = vec4(LightIntensity, 1.0);\n" +
"}\n"



  //声明js需要的相关变量
var canvas = document.getElementById("canvas");
var gl = getWebGLContext(canvas);


function initVertexBuffer(){
let r = 8;
let Bands  = 3;//纬度带
// let longitudeBands = 10;//经度带
let positions_ = [];//存储x，y，z坐标
let indices_ = [];//三角形列表（索引值）
let textureCoordData = [];//存储纹理坐标u，v，纹理坐标与顶点坐标一一对应
let normal_ = []; //法向量

for(var latNum = 0; latNum <= Bands; latNum++){
    var lat = latNum * Math.PI / Bands - Math.PI / 2;//纬度范围从-π/2到π/2
    var sinLat = Math.sin(lat);
    var cosLat = Math.cos(lat);
 
    for(var longNum = 0; longNum <= Bands; longNum++){
        var lon = longNum * 2 * Math.PI / Bands - Math.PI;//经度范围从-π到π
        var sinLon = Math.sin(lon);
        var cosLon = Math.cos(lon);

        // 球面坐标 转为 三维坐标
        var x = cosLat * cosLon;
        var y = cosLat * sinLon;
        var z = sinLat;
        var u = (longNum / Bands);
        var v = (latNum / Bands);

        // WebGL使用的是正交右手坐标系
        positions_.push(x);
        positions_.push(y);//-z
        positions_.push(z);
        normal_.push(x,y,z);
        textureCoordData.push(u);
        textureCoordData.push(v);
    }
}

for(var latNum = 0; latNum < Bands; latNum++){
  for(var longNum = 0; longNum < Bands; longNum++){
      var first = latNum * (Bands + 1) + longNum;
      var second = first + Bands + 1;
      
      indices_.push(first);
      indices_.push(second);
      indices_.push(first + 1);
      indices_.push(second);
      indices_.push(second + 1);
      indices_.push(first + 1);
  }
}

  var position = new Float32Array(positions_);
  var normalData = new Float32Array(normal_);
  var indices = new Uint16Array(indices_);

  //创建缓冲区对象
  var vertexBuffer = gl.createBuffer();
  let vertexNormalBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();
  


  if (!vertexBuffer || !indexBuffer) {
    console.log("无法创建缓冲区对象");
    return -1;
}
 //绑定缓冲区对象并写入数据
 gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);
  //获取数组中一个元素所占的字节数
  var fsize = position.BYTES_PER_ELEMENT;
  //获取attribute -> a_Position变量的存储地址
  var a_Position = gl.getAttribLocation(gl.program, "VertexPosition");
  if (a_Position < 0) {
      console.log("无法获取顶点位置的存储变量");
      return -1;
  }
  
  //对位置的顶点数据进行分配，并开启
  var numComponents = 3;
  var strideToNextPieceOfData = fsize*3;
  var offsetIntoBuffer = 0;

  gl.vertexAttribPointer(a_Position, numComponents, gl.FLOAT, false, strideToNextPieceOfData, offsetIntoBuffer);
  gl.enableVertexAttribArray(a_Position);


  // Write the normals to their buffer object.
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normalData, gl.STATIC_DRAW);

  // Assign normal to attrib and enable it.
  let VertexNormal = gl.getAttribLocation(gl.program, 'VertexNormal');
  gl.vertexAttribPointer(VertexNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(VertexNormal);


   //将顶点索引数据写入缓冲区对象
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

   return indices.length;
}



function draw(gl, indices_length, u_ModelViewMatrix, pos_len) {
//   //设置视角矩阵的相关信息（视点, 观察点, 上方向）
//   var viewMatrix = new Matrix4();
//   viewMatrix.setLookAt(12,3,7,-0.5,0,0,0,1,0);

//   // var viewMatrix = Matrix4.inverse(cammeraMatrix); 
//   // viewMatrix.inverse(cammeraMatrix);

//   //设置模型矩阵的相关信息
//   var modelMatrix = new Matrix4();
//   modelMatrix.setRotate(-30, 0, -15, 1);
  
//   // modelMatrix.setTranslate(1, 0, 0);
//   //console.log(modelMatrix);

//   //设置透视投影矩阵
//   var projMatrix = new Matrix4();
//   projMatrix.setPerspective(10, canvas.width/canvas.height, 1, 3000);

//   //计算出模型视图矩阵 viewMatrix.multiply(modelMatrix)相当于在着色器里面u_ViewMatrix * u_ModelMatrix
//   var modeViewMatrix = projMatrix.multiply(viewMatrix.multiply(modelMatrix));

//   //将试图矩阵传给u_ViewMatrix变量
//   gl.uniformMatrix4fv(u_ModelViewMatrix, false, modeViewMatrix.elements);
// console.log("u_ModelViewMatrix", u_ModelViewMatrix)

//   //开启隐藏面清除
//   gl.enable(gl.DEPTH_TEST);

//   //清空颜色和深度缓冲区
//   // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
//   // 指定清空<canvas>的颜色
//   gl.clearColor(0, 0, 0, 1.0);

//   gl.clear(gl.COLOR_BUFFER_BIT);
//   gl.viewport(0,0,canvas.width,canvas.height);

//   //绘制图形
  
//   // gl.drawArrays(gl.LINE_STRIP,0, pos_len/3);
//   console.log("indices length", indices_length)
//   // Uint16Array 对应 UNSIGNED_SHORT
//   gl.drawElements(gl.TRIANGLES, indices_length ,gl.UNSIGNED_SHORT, 0);





var viewMatrix = new Matrix4();
viewMatrix.setLookAt(12,3,7,-0.5,0,0,0,1,0);

var modelMatrix = new Matrix4();
modelMatrix.setRotate(0, 0, -15, 1);
//设置模型矩阵的相关信息
// var modelMatrix = new Matrix4();
// modelMatrix.setRotate(0, 0, 5, 1);
// modelMatrix.setTranslate(1, 0, 0);
//console.log(modelMatrix);

//设置透视投影矩阵
var projMatrix = new Matrix4();
projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 1000.0);

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
gl.uniform3fv(Kd, [1.0, 0.5, 0.3]);

// 光照漫反射参数
let Ld = gl.getUniformLocation(gl.program, 'Ld');
gl.uniform3fv(Ld, [1.0, 1.0, 1.0]);

// Clear & draw.
gl.clearColor(0.3, 0.3, 0.3, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.drawElements(gl.TRIANGLES, indices_length, gl.UNSIGNED_SHORT, 0);
// gl.drawArrays(gl.LINE_STRIP,0, n/6);

}



function main() {
    if (!gl) {
      console.log("你的浏览器不支持WebGL");
      return;
    }

      //初始化着色器
      if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("无法初始化着色器");
        return;
    }

    indices_length = initVertexBuffer();
    console.log(indices_length);


    //设置视角矩阵的相关信息
    var u_ModelViewMatrix = gl.getUniformLocation(gl.program, "u_ModelViewMatrix");
    if (u_ModelViewMatrix < 0) {
        console.log("无法获取矩阵变量的存储位置");
        return;
    }

    //进入场景初始化
    draw(gl, indices_length, u_ModelViewMatrix);
}


