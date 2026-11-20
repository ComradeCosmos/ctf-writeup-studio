import React from 'react';
import { CtfStudio } from './components/ctf-studio';
import { Toaster } from 'sonner';

export function App() {
  return (
    <>
      <CtfStudio />
      <Toaster theme="dark" position="bottom-right" richColors />
    </>
  );
}

export default App;
