enum Fractals {
    MANDELBROT_SET,
    JULIA_SET,
    FLAMING_SHIP,
    NEWTON_FRACTAL
}

enum RenderModes {
    NONE,
    FRAME,
    PIXELS,
    ROWS,
    COLUMNS
}

enum Devices {
    CPU,
    GPU
}

interface Parameters {
    grid: boolean;
    noise: boolean;
    fractal: Fractals;
    renderMode: RenderModes;
    device: Devices;
}

export {Fractals, RenderModes, Devices};
export type { Parameters };
