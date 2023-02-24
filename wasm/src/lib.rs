use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn iterate_mandelbrot(re: f64, im: f64, max: u32) -> f64 {
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
    return max as f64;
}

