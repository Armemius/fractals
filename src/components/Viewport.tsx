import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import init, {greet, add, InitOutput as FractalsModule} from "wasm";

const useWindowSize = () => {
    const [size, setSize] = useState([0, 0]);
    useLayoutEffect(() => {
        function updateSize() {
            setSize([window.innerWidth, window.innerHeight]);
        }
        window.addEventListener('resize', updateSize);
        updateSize();
        return () => window.removeEventListener('resize', updateSize);
    }, []);
    return size;
}

const Viewport = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pixelBuffer, setPixelBuffer] = useState<ImageData | null>(null);
    const [active, setActive] = useState(false);
    const [width, height] = useWindowSize();
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [scale, setScale] = useState(1);
    const [wasm, setWasm] = useState<FractalsModule | null>(null);

    useEffect(() => {
        init().then((module) => {
            setWasm(module);
        })
    }, [])

    const mouseHandler = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        if (active) {
            setOffsetX(offsetX + event.movementX);
            setOffsetY(offsetY + event.movementY);
        }
    }

    const wheelHandler = (event: React.WheelEvent<HTMLCanvasElement>) => {
        if (event.deltaY > 0) {
            setScale(scale * 1.1)
        } else if (event.deltaY < 0) {
            setScale(scale * 0.909)
        }
    }

    useEffect(() => {
        if (!wasm)
            return;
        console.log(wasm.add(666.66, 22.44));
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        if (width > 0 && height > 0) {
            const imageData = ctx.createImageData(width, height);
            setPixelBuffer(imageData);
            const pixelData = imageData.data;
            for (let it = 0; it < width; ++it) {
                for (let jt = 0; jt < height; ++jt) {
                    const index = (it + jt * canvas.width) * 4;
                    pixelData[index] = 0;
                    pixelData[index + 1] = 0;
                    pixelData[index + 2] = 0;
                    pixelData[index + 3] = 255;
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }

    }, [width, height, wasm])

    useEffect(() => {
        const zeroX = (width / 2 + offsetX * scale) | 0;
        const zeroY = (height / 2 + offsetY * scale) | 0;
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const buffer = pixelBuffer;
        if (!buffer)
            return;
        const pixelData = buffer.data;

        const setPixel = (x: number, y: number, r: number, g: number, b: number) => {
            const index = (x + y * canvas.width) * 4;
            pixelData[index] = r;
            pixelData[index + 1] = g;
            pixelData[index + 2] = b;
            pixelData[index + 3] = 255;
        }

        let frameId: number;
        const render = () => {
            setPixel(zeroX, zeroY, 255, 255, 255);
            ctx.putImageData(buffer, 0, 0);
            frameId = requestAnimationFrame(render);
        }
        frameId = requestAnimationFrame(render);


        return () => {
          cancelAnimationFrame(frameId);
        };
    }, [scale, pixelBuffer, width, height, offsetX, offsetY])

    return (
        <canvas width={window.innerWidth}
                height={window.innerHeight}
                ref={canvasRef}
                onMouseMove={mouseHandler}
                onMouseDown={() => setActive(true)}
                onMouseUp={() => setActive(false)}
                onMouseLeave={() => setActive(false)}
                onWheel={wheelHandler}/>
    );
};

export default Viewport;