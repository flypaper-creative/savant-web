import * as THREE from 'three';

export const ObsidianTransmissionMaterial = {
  backside: true,
  samples: 16,
  resolution: 1024,
  transmission: 0.95,
  roughness: 0.05,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  thickness: 5,
  ior: 1.85,
  chromaticAberration: 0.8,
  anisotropy: 1,
  distortion: 0.5,
  distortionScale: 0.5,
  temporalDistortion: 0.1,
  color: new THREE.Color('#ffffff'),
  emissive: new THREE.Color('#e6c03b'),
  emissiveIntensity: 0.2
};
