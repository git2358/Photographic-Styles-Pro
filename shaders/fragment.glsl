precision mediump float;

varying vec2 v_texCoord;
uniform sampler2D u_image;

uniform float u_tone;
uniform float u_warmth;
uniform float u_contrast;
uniform float u_vibrance;

vec3 applyContrast(vec3 color, float contrast) {
    return (color - 0.5) * contrast + 0.5;
}

vec3 applyVibrance(vec3 color, float vibrance) {
    float avg = (color.r + color.g + color.b) / 3.0;
    return mix(vec3(avg), color, vibrance);
}

void main() {

    vec4 tex = texture2D(u_image, v_texCoord);
    vec3 color = tex.rgb;

    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    float toneShift = u_tone * (0.5 - luminance);
    color += toneShift;

    color.r += u_warmth;
    color.b -= u_warmth;

    color = applyContrast(color, u_contrast);
    color = applyVibrance(color, u_vibrance);

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), tex.a);
}
