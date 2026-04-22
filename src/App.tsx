import React from 'react';
import { useLoading } from './context/LoadingContext';
import { SavantPreloader3D } from './components/SavantPreloader3D';
import Layout from './Layout';

export default function App() {
  const { progress, isComplete } = useLoading();

  return (
    <>
      {/* This MUST be the 3D version we just wrote */}
      <SavantPreloader3D progress={progress} phase={isComplete ? 'complete' : 'loading'} />
      {isComplete && <Layout />}
    </>
  );
}
