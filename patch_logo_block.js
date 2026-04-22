function hash3(x, y, z) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}

function applyChippedObsidian(geometry, amplitude = 0.08) {
  let geo = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  const pos = geo.attributes.position;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  for (let i = 0; i < pos.count; i += 3) {
    vA.fromBufferAttribute(pos, i);
    vB.fromBufferAttribute(pos, i + 1);
    vC.fromBufferAttribute(pos, i + 2);

    centroid.copy(vA).add(vB).add(vC).multiplyScalar(1 / 3);
    normal.copy(vB).sub(vA).cross(vC.clone().sub(vA)).normalize();

    const chip = (hash3(centroid.x * 2.7, centroid.y * 2.7, centroid.z * 2.7) - 0.5) * amplitude;

    vA.addScaledVector(normal, chip);
    vB.addScaledVector(normal, chip);
    vC.addScaledVector(normal, chip);

    pos.setXYZ(i, vA.x, vA.y, vA.z);
    pos.setXYZ(i + 1, vB.x, vB.y, vB.z);
    pos.setXYZ(i + 2, vC.x, vC.y, vC.z);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function makeObsidianGoldMaterial(shaderStore) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x030303,
    metalness: 1.0,
    roughness: 0.24,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 3.5,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vPos;'
    ).replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvPos = position;'
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\nuniform float uTime; varying vec3 vPos;'
    ).replace(
      '#include <emissivemap_fragment>',
      `
      float sweep = fract(vPos.x * 0.5 + vPos.y * -0.3 + uTime * 0.7);
      float glow = smoothstep(0.45, 0.5, sweep) * (1.0 - smoothstep(0.5, 0.55, sweep));
      totalEmissiveRadiance += vec3(1.0, 0.7, 0.2) * glow * 4.0;
      `
    );

    shaderStore.push(shader);
  };

  return mat;
}
