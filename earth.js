//顶点着色器
// var VSHADER_SOURCE = "" +
// "attribute vec4 aPosition;\n" +
// "attribute vec4 aNormal;\n" +
// "attribute vec2 aTexcoord;\n" +
// "uniform mat4 modelMatrix;\n" +
// "uniform mat4 vpMatrix;\n" +
// "varying vec3 fragPos;\n" +
// "varying vec3 fragNor;\n" +
// "varying vec2 texcoord;\n" +
// "void main(){" +
// "    gl_Position = vpMatrix * modelMatrix * aPosition;\n" +
// "   fragPos= vec3(modelMatrix * aPosition);\n" +
// "fragNor = vec3(modelMatrix * aNormal);\n" +
// "texcoord = aTexcoord;\n" +
// "}\n";

// // 片段着色器
// var FSHADER_SOURCE = "" +
// "precision mediump float;\n" +
// "uniform vec3 viewPos;\n" +
// "uniform vec3 lightPos;\n" +
// "uniform vec3 lightColor;\n" +
// "uniform vec3 ambientColor;\n" +
// "uniform sampler2D diffMap;\n" +
// "varying vec3 fragPos;\n" +
// "varying vec3 fragNor;\n" +
// "varying vec2 texcoord;\n" +
// "void main(){" +
// "    vec3 normal = normalize(fragNor);\n" +
// "    vec3 color = texture2D(diffMap, texcoord).rgb;\n" +
	
//   // 光线方向
//   "    vec3 lightDir = normalize(lightPos - fragPos);\n" +
//   // 光线方向和法向量夹角
//   "    float cosTheta = max(dot(lightDir, normal), 0.0);\n" +
//   // 漫反射
//   "    vec3 diffuse = lightColor * color * cosTheta;\n" +

//   // 环境光
//   // ...
//   // 高光
//   // ...

//   "   gl_FragColor = vec4(ambient + diffuse + specular, 1.0);\n" +
//   "}\n"



//顶点着色器
var VSHADER_SOURCE = "" +
"attribute vec4 a_Position;\n" +
// "attribute vec4 a_Color;\n" +
"uniform mat4 u_ModelViewMatrix;\n" +
"varying vec4 v_Color;\n" +
"void main(){" +
"   gl_Position = u_ModelViewMatrix * a_Position;\n" +
"   v_Color = vec4(0.2, 0.2, 0.2, 1.0);\n" +
"}\n";

//片元着色器
var FSHADER_SOURCE = "" +
"#ifdef GL_ES\n" +
"precision mediump float;\n" +
"#endif\n" +
// "varying vec4 v_Color;\n v_Color;" +
"void main(){" +
"   gl_FragColor = vec4(0, 0, 0, 0.1);\n" +
"}\n";


  //声明js需要的相关变量
var canvas = document.getElementById("canvas");
var gl = getWebGLContext(canvas);

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

    // const radius = 8;//半径
    // const SPHERE_DIV = 25;//经纬度格数
    // var xRadian = Math.PI/SPHERE_DIV
    // const position_ = [];//顶点
    // const normal = [];//法线
    // const texcoord = [];//uv坐标
    // const indices_ = [];//顶点索引
    // let x, y, z;

    // for (let i = 0; i < SPHERE_DIV; i++) {
    //   const rad = Math.PI / SPHERE_DIV * i - Math.PI / 2;//从-90度开始计算
    //   const r = radius * Math.cos(rad);
    //   y = radius * Math.sin(rad);
    //   for (let j = 0; j < SPHERE_DIV; j++) {
    //     x = r * Math.sin(xRadian * j);
    //     z = r * Math.cos(xRadian * j);
    //     position_.push(x, y, z);
    //     texcoord.push(j / SPHERE_DIV, i / SPHERE_DIV);
    //     normal.push(x, y, z); //顶点作为法线，法线从圆心360度放射
    //     var p1 = i * (SPHERE_DIV + 1) + j
    //     var p2 = p1 + (SPHERE_DIV+1);

    //     indices_.push(p1, p2, p1+1, p1+1, p2, p2+1);//平面的索引
    //   }
    // }



//     var SPHERE_DIV = 3;
//     var position_ = [];
//     var indices_ = [];

//     const radius = 8;//半径
// for (j = 0; j <= SPHERE_DIV; j++){//SPHERE_DIV为经纬线数
 
//   aj = j * Math.PI/SPHERE_DIV;
//   sj = Math.sin(aj);
//   cj = Math.cos(aj);
//   for(i = 0; i <= SPHERE_DIV; i++){
//       ai = i * 2 * Math.PI/SPHERE_DIV;
//       si = Math.sin(ai);
//       ci = Math.cos(ai);

//       position_.push(si * sj);//point为顶点坐标
//       position_.push(cj);
//       position_.push(ci * sj);
//   }
// }

// for(j = 0; j < SPHERE_DIV; j++){
//   for(i = 0; i < SPHERE_DIV; i++){
//       p1 = j * (SPHERE_DIV+1) + i;
//       p2 = p1 + (SPHERE_DIV+1);

//       indices_.push(p1);//indices为顶点的索引
//       indices_.push(p2);
//       indices_.push(p1 + 1);

//       indices_.push(p1 + 1);
//       indices_.push(p2);
//       indices_.push(p2 + 1);
//   }
// }


let r = 8;
let latitudeBands  = 50;//纬度带
let longitudeBands = 50;//经度带
let positions_ = [];//存储x，y，z坐标
let indices_ = [];//三角形列表（索引值）
let textureCoordData = [];//存储纹理坐标u，v，纹理坐标与顶点坐标一一对应
 
for(var latNum = 0; latNum <= latitudeBands; latNum++){
    var lat = latNum * Math.PI / latitudeBands - Math.PI / 2;//纬度范围从-π/2到π/2
    var sinLat = Math.sin(lat);
    var cosLat = Math.cos(lat);
 
    for(var longNum = 0; longNum <= longitudeBands; longNum++){
        var lon = longNum * 2 * Math.PI / longitudeBands - Math.PI;//经度范围从-π到π
        var sinLon = Math.sin(lon);
        var cosLon = Math.cos(lon);
 
        var x = cosLat * cosLon;
        var y = cosLat * sinLon;
        var z = sinLat;
        var u = (longNum / longitudeBands);
        var v = (latNum / latitudeBands);
 
        positions_.push(x);
        positions_.push(-z);
        positions_.push(y);
        textureCoordData.push(u);
        textureCoordData.push(v);
    }
}


for(var latNum = 0; latNum < latitudeBands; latNum++){
  for(var longNum = 0; longNum < longitudeBands; longNum++){
      var first = latNum * (longitudeBands + 1) + longNum;
      var second = first + longitudeBands + 1;
      
      indices_.push(first);
      indices_.push(second);
      indices_.push(first + 1);
      indices_.push(second);
      indices_.push(second + 1);
      indices_.push(first + 1);
  }
}



    var position = new Float32Array(positions_);
    var indices = new Uint16Array(indices_);

    //创建缓冲区对象
    var vertexBuffer = gl.createBuffer();
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
    var a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
        console.log("无法获取顶点位置的存储变量");
        return -1;
    }
    
    //对位置的顶点数据进行分配，并开启
    var numComponents = 3;
    var strideToNextPieceOfData = 0;//fsize*3;
    var offsetIntoBuffer = 0;

    gl.vertexAttribPointer(a_Position, numComponents, gl.FLOAT, false, strideToNextPieceOfData, offsetIntoBuffer);
    gl.enableVertexAttribArray(a_Position);

     //将顶点索引数据写入缓冲区对象
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);


     //设置视角矩阵的相关信息
    var u_ModelViewMatrix = gl.getUniformLocation(gl.program, "u_ModelViewMatrix");
    if (u_ModelViewMatrix < 0) {
        console.log("无法获取矩阵变量的存储位置");
        return;
    }

    //设置底色
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //进入场景初始化
    draw(gl, indices.length, u_ModelViewMatrix, positions_.length);
}



function draw(gl, indices_length, u_ModelViewMatrix, pos_len) {
  //设置视角矩阵的相关信息（视点，视线，上方向）
  var viewMatrix = new Matrix4();
  viewMatrix.setLookAt(12,3,7,-0.5,0,0,0,1,0);

  //设置模型矩阵的相关信息
  var modelMatrix = new Matrix4();
  // modelMatrix.setRotate(0, 0, 5, 1);
  // modelMatrix.setTranslate(1, 0, 0);
  //console.log(modelMatrix);

  //设置透视投影矩阵
  var projMatrix = new Matrix4();
  //当前lookAt()函数初始视点的高度
var eyeHight = 2000.0;
//包围盒范围
var minX = 399589.072;
var maxX = 400469.072;
var minY = 3995118.062;
var maxY = 3997558.062;
var minZ = 732;
var maxZ = 1268;
//根据视点高度算出setPerspective()函数的合理角度
var fovy = (maxY - minY) / 2.0 / eyeHight;
// console.log("fovy", fovy);
  projMatrix.setPerspective(20, canvas.width/canvas.height, 1, 3000);

  //计算出模型视图矩阵 viewMatrix.multiply(modelMatrix)相当于在着色器里面u_ViewMatrix * u_ModelMatrix
  var modeViewMatrix = projMatrix.multiply(viewMatrix.multiply(modelMatrix));

  //将试图矩阵传给u_ViewMatrix变量
  gl.uniformMatrix4fv(u_ModelViewMatrix, false, modeViewMatrix.elements);
console.log("u_ModelViewMatrix", u_ModelViewMatrix)

  //开启隐藏面清除
  gl.enable(gl.DEPTH_TEST);

  //清空颜色和深度缓冲区
  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // 指定清空<canvas>的颜色
  gl.clearColor(0, 0, 0, 1.0);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0,0,canvas.width,canvas.height);

  //绘制图形
  
  // gl.drawArrays(gl.LINE_STRIP,0, pos_len/3);
  console.log("indices length", indices_length)
  // Uint16Array 对应 UNSIGNED_SHORT
  gl.drawElements(gl.TRIANGLES, indices_length ,gl.UNSIGNED_SHORT, 0);

}