import React, {useState} from 'react';
import './App.css';
import Viewport from "./components/Viewport";
import {Devices, Fractals, Parameters, RenderModes} from "./Settings";
import Menu from "./components/Menu";

function App() {
  const [params, setParams] = useState<Parameters>({
      grid: false,
      noise: false,
      fractal: Fractals.MANDELBROT_SET,
      renderMode: RenderModes.PIXELS,
      device: Devices.CPU
  })
  return (
    <>
      <Viewport/>
      <Menu params={params} setParams={setParams}/>
    </>
  );
}

export default App;
