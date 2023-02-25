extern crate xorshift;

use std::thread;
use wasm_bindgen::prelude::*;
use xorshift::{Rand, Rng, SeedableRng, SplitMix64, Xoroshiro128};

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
        let (xCoord, yCoord) = px2complex(x, y, zero_x, zero_y, scale);
        if fractal == 0 {
            color = paint_fractal(xCoord, yCoord, 100);
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

fn paint_fractal(re: f64, im: f64, max: u32) -> (u8, u8, u8) {
    let dev = iterate_mandelbrot(re, im, max);
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
