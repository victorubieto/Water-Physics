varying vec2 v_uv;
varying vec3 v_worldNormal;
varying vec3 v_position;
varying vec3 v_worldPosition;

uniform vec3 u_light_position;
uniform vec3 u_camera_position;

uniform samplerCube u_cube_map;

void main()
{
	vec3 camera_intersection_dir = normalize(v_worldPosition - u_camera_position);
	vec3 light_intersection_dir = normalize(v_worldPosition - u_light_position);

	vec3 finalColor = vec3(0.0);

	// hdr reflection only if looking above the plane
	if (dot(-camera_intersection_dir, v_worldNormal) > 0.0)
	{
		vec3 reflectedDirection = normalize(reflect(camera_intersection_dir, v_worldNormal));
    	reflectedDirection.x = -reflectedDirection.x;
		
		finalColor = textureCube( u_cube_map, reflectedDirection ).rgb;
	}
	else // otherwise, refraction
	{
		finalColor = textureCube( u_cube_map, camera_intersection_dir ).rgb;
	}

	gl_FragColor = vec4(finalColor, 0.5);
}