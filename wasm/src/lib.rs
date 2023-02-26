extern crate xorshift;

use wasm_bindgen::prelude::*;
use xorshift::{Rand, Rng, SeedableRng, SplitMix64, Xoroshiro128};

// CPU
#[wasm_bindgen]
pub fn render(
    // Array with raw pixel data
    pixels: &mut [u8],
    /*
    Fractal to render:
    0 - Mandelbrot set
    1 - Julia set
    2 - Flaming ship
    3 - Newton fractal
     */
    fractal: u8,
    /*
    Render modes:
    0 - None
    1 - Frame
    2 - Random pixels
    3 - Random rows
    4 - Random columns
     */
    render_mode: u8,
    // Viewport size
    width: u32,
    height: u32,
    // Optimizations
    grid: bool,
    noise: bool,
    // Some info
    scale: f64,
    offset_x: f64,
    offset_y: f64,
    seed: u32
) {
    let mut sm: SplitMix64 = SeedableRng::from_seed(seed as u64);
    let mut rng: Xoroshiro128 = Rand::rand(&mut sm);
    let zero_x = width as f64 / 2.0 + (offset_x as f64 / scale);
    let zero_y = height as f64 / 2.0 + (offset_y as f64 / scale);
    let update_pixel = |pixels: &mut [u8], rng: &mut Xoroshiro128, x: u32, y: u32| {
        let mut color: (u8, u8, u8) = (0, 0, 0);
        let (x_coord, y_coord) = px2complex(x, y, zero_x, zero_y, scale);
        if fractal == 0 {
            let dev = iterate_mandelbrot(x_coord, y_coord, 100);
            color = paint_fractal(dev);
        } else if fractal == 1 {
            let dev = iterate_julia(x_coord, y_coord, 100);
            color = paint_fractal(dev);
        } else if fractal == 2 {
            let dev = iterate_flaming_ship(x_coord, y_coord, 100);
            color = paint_fractal(dev);
        } else if fractal == 3 {
            let dev = iterate_newton(x_coord, y_coord, 100);
            color = paint_fractal(dev);
        }
        let index = ((x + y * width) * 4) as usize;
        if grid && (x % 3 == 0 || y % 3 == 0) {
            pixels[index] = 0;
            pixels[index + 1] = 0;
            pixels[index + 2] = 0;
        } else if noise && rng.next_u32() % 128 < 24 {
            pixels[index] = 0;
            pixels[index + 1] = 0;
            pixels[index + 2] = 0;
        } else {
            pixels[index] = color.0;
            pixels[index + 1] = color.1;
            pixels[index + 2] = color.2;
        }
    };
    if render_mode == 0 {
        reset(pixels);
    } else if render_mode == 1 {
        for it in 0..width {
            for jt in 0..height {
                update_pixel(pixels, &mut rng, it, jt);
            }
        }
    } else if render_mode == 2 {
        for it in 0..(width * height / 60) {
            let x = rng.next_u32() % width;
            let y = rng.next_u32() % height;
            update_pixel(pixels, &mut rng, x, y);
        }
    } else if render_mode == 3 {
        for it in 0..(height / 90) {
            let row = rng.next_u32() % height;
            for jt in 0..width {
                update_pixel(pixels, &mut rng, jt, row);
            }
        }
    } else {
        for it in 0..(width / 90) {
            let column = rng.next_u32() % width;
            for jt in 0..height {
                update_pixel(pixels, &mut rng, column, jt);
            }
        }
    }
}

#[wasm_bindgen]
pub fn reset(pixels: &mut [u8]) {
    for i in (0..pixels.len()).step_by(4) {
        pixels[i] = 0;
        pixels[i + 1] = 0;
        pixels[i + 2] = 0;
        pixels[i + 3] = 255;
    }
}

pub fn px2complex(x: u32, y: u32, zero_x: f64, zero_y: f64, scale: f64) -> (f64, f64) {
    return ((x as f64 - zero_x) as f64 * scale * 0.01, (y as f64 - zero_y) as f64 * scale * 0.01)
}

fn iterate_mandelbrot(re: f64, im: f64, max: u32) -> f64 {
    let mut z_re = 0.0;
    let mut z_im = 0.0;
    for iters in 0..max {
        let z_re_new = z_re * z_re - z_im * z_im + re;
        let z_im_new = 2.0 * z_re * z_im + im;
        z_re = z_re_new;
        z_im = z_im_new;
        if z_re * z_re + z_im * z_im > 4.0 {
            return (iters as f64) / (max as f64);
        }
    }
    return 1.0;
}

fn iterate_julia(re: f64, im: f64, max: u32) -> f64 {
    let c_re = -0.67;
    let c_im = -0.36;
    let mut z_re = re;
    let mut z_im = im;
    for iters in 0..max {
        let z_re_sq = z_re * z_re;
        let z_im_sq = z_im * z_im;
        if z_re_sq + z_im_sq > 4.0 {
            return iters as f64 / max as f64;
        }
        let z_re_new = z_re_sq - z_im_sq + c_re;
        let z_im_new = 2.0 * z_re * z_im + c_im;
        z_re = z_re_new;
        z_im = z_im_new;
    }
    return 1.0;
}

fn iterate_flaming_ship(re: f64, im: f64, max: u32) -> f64 {
    let mut z_re = re;
    let mut z_im = im;

    for iters in 0..max {
        let z_re_new = z_re * z_re - z_im * z_im + re;
        let z_im_new = (2.0 * z_re * z_im).abs() + im;

        if z_re_new * z_re_new + z_im_new * z_im_new > 4.0 {
            return iters as f64 / max as f64;
        }

        z_re = z_re_new;
        z_im = z_im_new;
    }

    return 1.0;
}

fn iterate_newton(re: f64, im: f64, max: u32) -> f64 {
    let mut z_prev = (0.0, 0.0);
    let mut z_curr = (re, im);

    for iters in 0..max {
        let derivative = get_derivative(z_curr);
        if derivative.0 == 0.0 && derivative.1 == 0.0 {
            return 1.0;
        }

        let delta = divide(compute_polynomial(z_curr), derivative);
        z_prev = z_curr;
        z_curr = subtract(z_curr, delta);

        const THRESHOLD: f64 = 0.001;
        if get_distance(z_curr, z_prev) < THRESHOLD {
            return iters as f64 / max as f64;
        }
    }
    return 1.0;
}

fn get_derivative(z: (f64, f64)) -> (f64, f64) {
    let epsilon = 0.00001;
    let z_plus_epsilon = (z.0 + epsilon, z.1);
    let polynomial_at_z = compute_polynomial(z);
    let polynomial_at_z_plus_epsilon = compute_polynomial(z_plus_epsilon);
    let difference = subtract(polynomial_at_z_plus_epsilon, polynomial_at_z);
    return ((difference.0 / epsilon), (difference.1 / epsilon));
}

fn compute_polynomial(z: (f64, f64)) -> (f64, f64) {
    let mut result = (1.0, 0.0);

    const ROOTS: [(f64, f64); 3] = [
        (1.0, 0.0),
        (-0.5, 0.866),
        (-0.5, -0.866),
    ];

    for root in &ROOTS {
        let term = subtract(z, *root);
        result = multiply(result, term);
    }

    return result;
}

fn divide(a: (f64, f64), b: (f64, f64)) -> (f64, f64) {
    let denominator = b.0 * b.0 + b.1 * b.1;
    let re = (a.0 * b.0 + a.1 * b.1) / denominator;
    let im = (a.1 * b.0 - a.0 * b.1) / denominator;
    return (re, im);
}

fn subtract(a: (f64, f64), b: (f64, f64)) -> (f64, f64) {
    let re = a.0 - b.0;
    let im = a.1 - b.1;
    return (re, im);
}

fn multiply(a: (f64, f64), b: (f64, f64)) -> (f64, f64) {
    let re = a.0 * b.0 - a.1 * b.1;
    let im = a.0 * b.1 + a.1 * b.0;
    return (re, im);
}

fn get_distance(a: (f64, f64), b: (f64, f64)) -> f64 {
    let dx = a.0 - b.0;
    let dy = a.1 - b.1;
    return (dx * dx + dy * dy).sqrt()
}

fn paint_fractal(dev: f64) -> (u8, u8, u8) {
    if dev == 1.0 {
        return (0, 0, 0);
    }
    if dev > 0.813 {
        let delta = (dev - 0.813) * 5.346;
        return (32 - (32.0 * delta) as u8, 107 - (100.0 * delta) as u8, 203 - (103.0 * delta) as u8);
    }
    if dev > 0.5054 {
        let delta = (dev - 0.5054) * 3.2509;
        return (237 - (205.0 * delta) as u8, 255 - (148.0 * delta) as u8, 255 - (52.0 * delta) as u8);
    }
    if dev > 0.2527 {
        let delta = (dev - 0.2527) * 3.957;
        return (255 - (18.0 * delta) as u8, 170 + (85.0 * delta) as u8, (255.0 * delta) as u8);
    }
    let delta = dev * 3.957;
    return ((255.0 * delta) as u8, (170.0 * delta) as u8, 0);
}