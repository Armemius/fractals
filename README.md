# Fractals <a href="https://www.typescriptlang.org/" title="Typescript"><img src="https://github.com/get-icon/geticon/raw/master/icons/typescript-icon.svg" alt="Typescript" width="21px" height="21px"></a> <a href="https://reactjs.org/" title="React"><img src="https://github.com/get-icon/geticon/raw/master/icons/react.svg" alt="React" width="21px" height="21px"></a> <a href="https://www.rust-lang.org/" title="Rust"><img src="https://github.com/get-icon/geticon/raw/master/icons/rust.svg" alt="Rust" width="21px" height="21px"></a> <a href="https://webassembly.org/" title="Wasm"><img src="https://github.com/get-icon/geticon/raw/master/icons/webassembly.svg" alt="Typescript" width="21px" height="21px"></a>
I made a project for fractals a few years ago, and since lots of time passed I decided to recreate this using new technologies and languages (the last version was written with C++ using SFML library) to make them more portable. 

Now you can browse what I've done using Github pages:<br>
<a href="https://armemius.github.io/fractals/" style="text-decoration: none; color: #34a853">armemius.github.io/fractals</a>

## Fractals
* Mandelbrot set
* Julia set (C = [-0.67, -0.36])
* Flaming ship
* Newton fractal (Roots: [1.0, 0.0], [-0.5, 0.866], [-0.5, -0.866])

## Settings
### Visual
* Grid - applies grid to the viewport, which reduces the number of calculations for fractal each frame, improves speed by quality
* Noise - same as a grid, but pixels to skip are chosen randomly
### Render modes
* None - pretty self-explanatory, just doesn't render at all
* Frame - renders whole frame of fractal (can be really slow)
* Random pixels - updates random pixels on a frame (default)
* Random rows - updates random rows of pixels on a frame
* Random columns - updates random columns of pixels on a frame

<b>In future it might be possible to select the device to render on (CPU/GPU)</b>

## Gradient
For colouring, I used inversed ultra fractal gradient, how it looks like you can see below:

<img src="./img/gradient.png" alt="Gradient">

## Screenshots
<img src="./img/mandelbrot_set.jpg" alt="Mandelbrot set">
<img src="./img/julia_set.jpg" alt="Julia set">
<img src="./img/flaming_ship.jpg" alt="Flaming ship">
<img src="./img/newton_fractal.jpg" alt="Newton fractal">