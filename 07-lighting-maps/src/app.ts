import { mat4, vec3 } from 'gl-matrix';
import { Shader, Camera, OrbitCamera, texLoader } from './gl-helpers/index';
import { cubeVerts } from './data/index';
import RenderLooper from 'render-looper';
import { lampVertexSrc, lampFragSrc, cubeVertexSrc, cubeFragSrc } from './shaders/index';
import { getRadian } from './utils/index';

const canvas: HTMLCanvasElement = document.querySelector('#cvs');
const gl: WebGL2RenderingContext = canvas.getContext('webgl2');
const { width, height } = canvas.getBoundingClientRect();

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.viewport(0, 0, width, height);
gl.enable(gl.DEPTH_TEST);

const lampShader = new Shader(gl, lampVertexSrc, lampFragSrc, 'lampShader');
const cubeShader = new Shader(gl, cubeVertexSrc, cubeFragSrc, 'cubeShader');

const vbo = gl.createBuffer();
const lampVao = gl.createVertexArray();
const cubeVao = gl.createVertexArray();

// 将顶点数据上传至显卡
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVerts), gl.STATIC_DRAW);

gl.bindVertexArray(lampVao);
const aPos = lampShader.getAttribLocation('aPos');
gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
gl.enableVertexAttribArray(aPos);
gl.bindVertexArray(null);

gl.bindVertexArray(cubeVao);
const cube_aPos = cubeShader.getAttribLocation('aPos');
const cube_aNormal = cubeShader.getAttribLocation('aNormal');
const cube_aTexCord = cubeShader.getAttribLocation('aTexCord');
gl.vertexAttribPointer(cube_aPos, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 0);
gl.vertexAttribPointer(cube_aNormal, 3, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
gl.vertexAttribPointer(cube_aTexCord, 2, gl.FLOAT, false, 8 * Float32Array.BYTES_PER_ELEMENT, 6 * Float32Array.BYTES_PER_ELEMENT);
gl.enableVertexAttribArray(cube_aPos);
gl.enableVertexAttribArray(cube_aNormal);
gl.enableVertexAttribArray(cube_aTexCord);
gl.bindVertexArray(null);


// 设置材质
const diffuseTexture = gl.createTexture();
const specularTexture = gl.createTexture();
texLoader('../images/container.png').then(img => {
    gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, (<HTMLImageElement>img).width, (<HTMLImageElement>img).height, 0, gl.RGBA, gl.UNSIGNED_BYTE, <HTMLImageElement>img)
    gl.generateMipmap(gl.TEXTURE_2D);
});

texLoader('../images/container_specular.png').then(img => {
    gl.bindTexture(gl.TEXTURE_2D, specularTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, (<HTMLImageElement>img).width, (<HTMLImageElement>img).height, 0, gl.RGBA, gl.UNSIGNED_BYTE, <HTMLImageElement>img)
    gl.generateMipmap(gl.TEXTURE_2D);
});

const perspeciveMx: mat4 = mat4.create();
const cameraPos = vec3.create();
const worldUp = vec3.create();
vec3.set(cameraPos, 0, 0, 3);
vec3.set(worldUp, 0, 1, 0);
const camera: Camera = new Camera(gl, cameraPos);
const orbitCamera: OrbitCamera = new OrbitCamera(gl, 10);
const lampPos = vec3.create();
vec3.add(lampPos, lampPos, [1.2, 1.3, 2.0]);

let deg = 0;
let rotSpeed =80;

cubeShader.use();
cubeShader.uniform1i('material.diffuse', 0);
cubeShader.uniform1i('material.specular', 1);
cubeShader.uniform1f('material.shininess', 128.0);

cubeShader.uniform3fv('light.ambient', new Float32Array([0.2, 0.2, 0.2]));
cubeShader.uniform3fv('light.diffuse', new Float32Array([0.8, 0.8, 0.8]));
cubeShader.uniform3fv('light.specular', new Float32Array([1.0, 1.0, 1.0]));

new RenderLooper(msdt => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const viewMx: mat4 = orbitCamera.getViewMatrix();
    mat4.perspective(perspeciveMx, getRadian(orbitCamera.fov), width / height, 0.1, 100);
    const lampModelMx: mat4 = mat4.create();
    
    deg += (msdt * 0.001) * rotSpeed;
    mat4.rotate(lampModelMx, lampModelMx, getRadian(deg), [0, 1, 0]);
    mat4.translate(lampModelMx, lampModelMx, lampPos);
    mat4.scale(lampModelMx, lampModelMx, [0.2, 0.2, 0.2]);

    lampShader.use();
    lampShader.uniformMatrix4fv('uModel', lampModelMx);
    lampShader.uniformMatrix4fv('uView', viewMx);
    lampShader.uniformMatrix4fv('uPerspective', perspeciveMx);

    gl.bindVertexArray(lampVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    const cubeModelMx: mat4 = mat4.create();

    const lampWorldPos: vec3 = vec3.create();
    mat4.getTranslation(lampWorldPos, lampModelMx)

    cubeShader.use();
    cubeShader.uniformMatrix4fv('uModel', cubeModelMx);
    cubeShader.uniformMatrix4fv('uView', viewMx);
    cubeShader.uniformMatrix4fv('uPerspective', perspeciveMx);
    cubeShader.uniform3fv('light.position', lampWorldPos);
    cubeShader.uniform3fv('uViewPos', orbitCamera.position);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specularTexture);

    gl.bindVertexArray(cubeVao);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

}).start()


