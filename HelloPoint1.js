
// 顶点着色器程序
var VSHADER_SOURCE = 
  'void main() {\n' +
  '  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);\n' + // Set the vertex coordinates of the point 齐次坐标（x,y,z,w）等价于三维坐标（x/w,y/w,z/w）。所以如果第四个分量是1，那么就是普通的三维坐标；如果第四分量为0，就表示无穷远的点。
  '  gl_PointSize = 50.0;\n' +                    // Set the point size
  '}\n';
 
// 片元着色器程序
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);\n' + // Set the point color
  '}\n';
 
function main() {
  // 获取 <canvas> 元素
  var canvas = document.getElementById('webgl');
 
  // 获取WebGL渲染上下文
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
 
  // 初始化着色器
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
 
  // 指定清空<canvas>的颜色
  gl.clearColor(0, 255, 0, 1.0);
 
  // 清空<canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
 
  // 绘制一个点
  gl.drawArrays(gl.POINTS, 0, 1);
}