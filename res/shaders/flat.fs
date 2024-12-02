varying vec2 v_uv;
varying vec3 v_position;

void main() {
    gl_FragColor = vec4(v_position, 1.0);
}