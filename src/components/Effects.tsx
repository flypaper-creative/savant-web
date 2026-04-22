import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';

export const Effects = () => (
  <EffectComposer disableNormalPass>
    <Bloom intensity={1.5} luminanceThreshold={0.2} mipmapBlur />
    <ChromaticAberration offset={[0.002, 0.002]} />
    <Noise opacity={0.05} />
    <Vignette eskil={false} offset={0.1} darkness={1.1} />
  </EffectComposer>
);
