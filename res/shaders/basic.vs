varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_worldNormal;
varying vec3 v_position;
varying vec3 v_worldPosition;

void main() {
    v_uv = uv;
    v_normal = normal;
    v_worldNormal = (modelMatrix * vec4(normal, 0.0)).xyz;
    v_position = position;
    v_worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
}