import { presets } from './presets.js';

const canvas = document.getElementById('glcanvas');
const gl = canvas.getContext('webgl');

const presetSelect = document.getElementById('preset');
Object.keys(presets).forEach(p => {
    const opt = document.createElement('option');
    opt.value = p;
    opt.textContent = p;
    presetSelect.appendChild(opt);
});

document.getElementById('upload').addEventListener('change', e => {
    const reader = new FileReader();
    reader.onload = event => {
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
            // NOTE: Full WebGL shader setup omitted for brevity
            alert("Image loaded. Full shader pipeline ready for extension.");
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});
