
import { presets } from './presets.js';

const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

let program, texture;

const vertexSrc = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;
void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
}`;

const fragmentSrc = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_tone;
uniform float u_warmth;
uniform float u_contrast;
uniform float u_vibrance;

vec3 applyContrast(vec3 color, float c) {
    return (color - 0.5) * c + 0.5;
}

vec3 applyVibrance(vec3 color, float v) {
    float avg = (color.r + color.g + color.b) / 3.0;
    return mix(vec3(avg), color, v);
}

void main() {
    vec4 tex = texture2D(u_image, v_texCoord);
    vec3 color = tex.rgb;

    float lum = dot(color, vec3(0.299,0.587,0.114));
    color += u_tone * (0.5 - lum);

    color.r += u_warmth;
    color.b -= u_warmth;

    color = applyContrast(color, u_contrast);
    color = applyVibrance(color, u_vibrance);

    gl_FragColor = vec4(clamp(color,0.0,1.0), tex.a);
}`;

function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function initGL() {
    const vs = createShader(gl.VERTEX_SHADER, vertexSrc);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentSrc);

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1,-1, 1,-1, -1,1,
        -1,1, 1,-1, 1,1
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0,1, 1,1, 0,0,
        0,0, 1,1, 1,0
    ]), gl.STATIC_DRAW);

    const texLoc = gl.getAttribLocation(program, "a_texCoord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);
}

function updateUniforms(settings) {
    gl.uniform1f(gl.getUniformLocation(program,"u_tone"), settings.tone);
    gl.uniform1f(gl.getUniformLocation(program,"u_warmth"), settings.warmth);
    gl.uniform1f(gl.getUniformLocation(program,"u_contrast"), settings.contrast);
    gl.uniform1f(gl.getUniformLocation(program,"u_vibrance"), settings.vibrance);
}

function draw() {
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function loadTexture(image) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

function computeHistogram() {
    const histCanvas = document.getElementById("histogram");
    const ctx = histCanvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    histCanvas.width = w;

    const pixels = new Uint8Array(w*h*4);
    gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);

    const hist = new Array(256).fill(0);
    for (let i=0;i<pixels.length;i+=4){
        const lum = 0.299*pixels[i] + 0.587*pixels[i+1] + 0.114*pixels[i+2];
        hist[Math.floor(lum)]++;
    }

    ctx.clearRect(0,0,w,100);
    const max = Math.max(...hist);
    for (let i=0;i<256;i++){
        const val = hist[i]/max*100;
        ctx.fillRect(i*(w/256),100-val,(w/256),val);
    }
}

function autoTone() {
    document.getElementById("contrast").value = 1.2;
    document.getElementById("vibrance").value = 1.15;
    render();
}

function render() {
    const settings = {
        tone: +document.getElementById("tone").value,
        warmth: +document.getElementById("warmth").value,
        contrast: +document.getElementById("contrast").value,
        vibrance: +document.getElementById("vibrance").value
    };
    updateUniforms(settings);
    draw();
    computeHistogram();
}

document.getElementById("upload").addEventListener("change", e=>{
    const reader = new FileReader();
    reader.onload = ev=>{
        const img = new Image();
        img.onload = ()=>{
            canvas.width = img.width;
            canvas.height = img.height;
            gl.viewport(0,0,canvas.width,canvas.height);
            initGL();
            loadTexture(img);
            render();
        };
        img.src = ev.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

document.querySelectorAll("input[type=range]").forEach(sl=>{
    sl.addEventListener("input", render);
});

document.getElementById("download").onclick = ()=>{
    const link = document.createElement("a");
    link.download = "styled-image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
};

document.getElementById("autoTone").onclick = autoTone;

const presetSelect = document.getElementById("preset");
Object.keys(presets).forEach(p=>{
    const opt = document.createElement("option");
    opt.value=p; opt.textContent=p;
    presetSelect.appendChild(opt);
});

presetSelect.onchange = ()=>{
    const p = presets[presetSelect.value];
    document.getElementById("tone").value=p.tone;
    document.getElementById("warmth").value=p.warmth;
    document.getElementById("contrast").value=p.contrast;
    document.getElementById("vibrance").value=p.vibrance;
    render();
};
