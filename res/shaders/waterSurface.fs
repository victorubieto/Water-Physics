varying vec2 v_uv;
varying vec3 v_worldNormal;
varying vec3 v_position;
varying vec3 v_worldPosition;

uniform vec3 u_local_light_position;
uniform vec3 u_local_camera_position;

// uniform samplerCube u_env_tex;
uniform samplerCube envMap;
// uniform sampler2D u_texture;

void main()
{
	// ray from camera to mesh
	vec3 cam2P = normalize(v_worldPosition - u_local_camera_position);
	vec3 light2P = normalize(v_worldPosition - u_local_light_position);

	vec3 finalColor = vec3(0.0);
	vec3 normalizedVWorldPosition = normalize(v_worldNormal);
	finalColor = textureCube( envMap, cam2P ).rgb;

	// hdr reflection only if looking above the plane
	// if (dot(cam2P, v_worldNormal) > 0.0)
	// {
	// 	vec3 reflection = cam2P - 2.0 * dot(cam2P, v_worldNormal) * v_worldNormal;
	// 	finalColor = textureCube( u_env_tex, vec3(0.0,1.0,0.0) ).rgb;
	// }
	// else // otherwise, refraction
	// {

	// }

	vec3 color = vec3(0.4, 0.8, 1.0);


	gl_FragColor = vec4(finalColor, 0.9);
}