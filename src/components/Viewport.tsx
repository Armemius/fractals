import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import init, {render as renderCanvas, reset} from "wasm";
import {Parameters, RenderModes} from "../Settings";
import {useGesture, usePinch} from '@use-gesture/react';

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

const Viewport = (props: { params: Parameters }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pixelBuffer, setPixelBuffer] = useState<ImageData | null>(null);
    const [width, height] = useWindowSize();
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [scale, setScale] = useState(1);
    const [ready, setReady] = useState(false);
    // Movement
    const [shiftX, setShiftX] = useState(0);
    const [shiftY, setShiftY] = useState(0);
    const [pitch, setPitch] = useState<number | null>(null);

    useGesture({
        onDrag: ({ offset: [dx, dy]}) => {
            setOffsetX(offsetX + (dx - shiftX) * scale);
            setOffsetY(offsetY + (dy - shiftY) * scale);
            setShiftX(dx);
            setShiftY(dy);
        },
        onPinch: ({ offset: [d]}) => {
            console.log(d);
            if (pitch) {
                if (pitch > d) {
                    setScale(scale * 1.05)
                } else {
                    setScale(scale * 0.952)
                }
            }
            setPitch(d);
        }
    }, {
        target: canvasRef,
        eventOptions: { passive: false }
    })

    const wheelHandler = (event: React.WheelEvent<HTMLCanvasElement>) => {
        if (event.deltaY > 0) {
            setScale(scale * 1.1)
        } else if (event.deltaY < 0) {
            setScale(scale * 0.9)
        }
    }

    // Initialize wasm
    useEffect(() => {
        init().then(() => {
            setReady(true);
        })
    }, [])

    // Handle viewport changes
    useEffect(() => {
        if (!ready)
            return;
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        if (width > 0 && height > 0) {
            const imageData = ctx.createImageData(width, height);
            setPixelBuffer(imageData);
            reset(imageData.data as unknown as Uint8Array);
            ctx.putImageData(imageData, 0, 0);
        }

    }, [width, height, ready, props.params.fractal])

    // Handle fractal changes
    useEffect(() => {
        setScale(1);
        setOffsetX(0);
        setOffsetY(0);
    }, [props.params.fractal])

    // Render
    useEffect(() => {
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
        const fractal = props.params.fractal;
        const renderMode = props.params.renderMode;
        const useGrid = props.params.grid;
        const useNoise = props.params.noise;

        let frameId: number;
        const render = () => {
            renderCanvas(pixelData as unknown as Uint8Array,
                fractal.valueOf(),
                renderMode.valueOf(),
                width,
                height,
                useGrid,
                useNoise,
                scale,
                offsetX,
                offsetY,
                window.performance.now());
            ctx.putImageData(buffer, 0, 0);
            if (renderMode !== RenderModes.NONE && renderMode !== RenderModes.FRAME) {
                frameId = requestAnimationFrame(render);
            }
        }
        frameId = requestAnimationFrame(render);


        return () => {
          cancelAnimationFrame(frameId);
        };
    }, [scale, pixelBuffer, width, height, offsetX, offsetY, ready, props.params])

    return (
        <canvas width={window.innerWidth}
                height={window.innerHeight}
                ref={canvasRef}
                onWheel={wheelHandler}/>
    );
};

export default Viewport;