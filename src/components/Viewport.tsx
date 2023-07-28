import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import init, {render as renderCanvas, reset} from "wasm";
import {Devices, Parameters, RenderModes} from "../Settings";
import {useGesture} from '@use-gesture/react';

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

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
    const shader = gl.createShader(type)!!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    const program = gl.createProgram()!!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

const Viewport = (props: { params: Parameters }) => {
    const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
    const gpuCanvasRef = useRef<HTMLCanvasElement>(null);
    const [program, setProgram] = useState<WebGLProgram | null>(null);
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
        onDrag: ({offset: [dx, dy]}) => {
            setOffsetX(offsetX + (dx - shiftX) * scale);
            setOffsetY(offsetY + (dy - shiftY) * scale);
            setShiftX(dx);
            setShiftY(dy);
        },
        onPinch: ({offset: [d]}) => {
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
        target: cpuCanvasRef,
        eventOptions: {passive: false}
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
        const canvas = cpuCanvasRef.current;
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
        const canvas = cpuCanvasRef.current;
        if (!canvas)
            return;
        if (props.params.device !== Devices.CPU) {
            return
        }
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

    // GPU Canvas setup
    useEffect(() => {
        const canvas = gpuCanvasRef.current;
        if (!canvas)
            return;
        const gl = canvas.getContext('webgl');
        if (!gl) {
            return;
        }
        const vertexShaderSource = document?.getElementById('vertexShader')?.textContent;
        const fragmentShaderSource = document?.getElementById('fragmentShader')?.textContent;

        if (!vertexShaderSource || !fragmentShaderSource) {
            return;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)!!;
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)!!;

        const program = createProgram(gl, vertexShader, fragmentShader)!!;
        gl.useProgram(program);

        const positionLocation = gl.getAttribLocation(program, 'position');
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        const positions = [
            -1, -1,
            -1, 1,
            1, 1,
            1, -1,
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        setProgram(program);
    }, [])

    useEffect(() => {
        const canvas = gpuCanvasRef.current;
        if (!canvas)
            return;
        if (props.params.device !== Devices.GPU) {
            return;
        }
        const gl = canvas.getContext('webgl');
        if (!gl || !program) {
            return;
        }

        const resolutionLocation = gl.getUniformLocation(program, 'resolution')!!;
        gl.uniform2f(resolutionLocation, width, height);

        const offsetLocation = gl.getUniformLocation(program, 'offset')!!;
        gl.uniform2f(offsetLocation, offsetX, offsetY);

        const scaleLocation = gl.getUniformLocation(program, 'scale')!!;
        gl.uniform1f(scaleLocation, scale);

        const modeLocation = gl.getUniformLocation(program, 'mode')!!;
        gl.uniform1i(modeLocation, props.params.fractal.valueOf());

        const timeLocation = gl.getUniformLocation(program, 'time')!!;
        gl.uniform1f(timeLocation, window.performance.now());

        const gridLocation = gl.getUniformLocation(program, 'grid')!!;
        gl.uniform1i(gridLocation, props.params.grid ? 1 : 0);

        const noiseLocation = gl.getUniformLocation(program, 'noise')!!;
        gl.uniform1i(noiseLocation, props.params.noise ? 1 : 0);

        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    }, [scale, pixelBuffer, width, height, offsetX, offsetY, ready, props.params])

    return (
        <>
            <canvas width={window.innerWidth}
                    height={window.innerHeight}
                    ref={gpuCanvasRef}
                    onWheel={wheelHandler}
                    style={{opacity: props.params.device === Devices.GPU ? "100%" : "0"}}
            />
            <canvas width={window.innerWidth}
                    height={window.innerHeight}
                    ref={cpuCanvasRef}
                    onWheel={wheelHandler}
                    style={{opacity: props.params.device === Devices.CPU ? "100%" : "0"}}
            />
        </>
    );
};

export default Viewport;