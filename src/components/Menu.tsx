import React, {useState} from 'react';
import {Devices, Fractals, Parameters, RenderModes} from "../Settings";
import {FaBars} from "react-icons/fa";

const Selectable = (props: {selected: boolean, active: boolean, name: string, action: () => void}) => {
    let className = "selectable"
        + (props.selected ? " selected" : "")
        + (props.active ? " active" : "");
    return (
        <div className={className} onClick={props.active ? props.action : ()=>{}}>{props.name}</div>
    )
}

const Menu = (props: {params: Parameters, setParams: React.Dispatch<React.SetStateAction<Parameters>>}) => {
    const [isOpen, setOpened] = useState(true);

    const toggle = () => setOpened(!isOpen);

    const updateParam = (name: string, value: any) => {
        return () => props.setParams({...props.params, [name]: value})
    }

    return (
        <div className={isOpen ? "menu" : "menu hidden"}>
            <div className="top-section">
                <span className="top-section-header">
                    <h1>Settings</h1>
                </span>
                <span className="top-section-logo">
                    <FaBars onClick={toggle}/>
                </span>
            </div>
            <div className="params-section">
                <div className="section">
                    <h2>Fractals</h2>
                    <Selectable selected={props.params.fractal === Fractals.MANDELBROT_SET} active={isOpen} name={"Mandelbrot set"} action={updateParam('fractal', Fractals.MANDELBROT_SET)}/>
                    <Selectable selected={props.params.fractal === Fractals.JULIA_SET} active={isOpen} name={"Julia set"} action={updateParam('fractal', Fractals.JULIA_SET)}/>
                    <Selectable selected={props.params.fractal === Fractals.FLAMING_SHIP} active={isOpen} name={"Flaming ship"} action={updateParam('fractal', Fractals.FLAMING_SHIP)}/>
                    <Selectable selected={props.params.fractal === Fractals.NEWTON_FRACTAL} active={isOpen} name={"Newton fractal"} action={updateParam('fractal', Fractals.NEWTON_FRACTAL)}/>
                </div>
                <div className="section">
                    <h2>Visuals</h2>
                    <Selectable selected={props.params.grid} active={isOpen} name={"Grid"} action={updateParam('grid', !props.params.grid)}/>
                    <Selectable selected={props.params.noise} active={isOpen} name={"Noise"} action={updateParam('noise', !props.params.noise)}/>
                </div>
                <div className="section">
                    <h2>Render mode</h2>
                    <Selectable selected={props.params.renderMode === RenderModes.NONE} active={isOpen} name={"None"} action={updateParam('renderMode', RenderModes.NONE)}/>
                    <Selectable selected={props.params.renderMode === RenderModes.FRAME} active={isOpen} name={"Frame"} action={updateParam('renderMode', RenderModes.FRAME)}/>
                    <Selectable selected={props.params.renderMode === RenderModes.PIXELS} active={isOpen} name={"Random pixels"} action={updateParam('renderMode', RenderModes.PIXELS)}/>
                    <Selectable selected={props.params.renderMode === RenderModes.ROWS} active={isOpen} name={"Random rows"} action={updateParam('renderMode', RenderModes.ROWS)}/>
                    <Selectable selected={props.params.renderMode === RenderModes.COLUMNS} active={isOpen} name={"Random columns"} action={updateParam('renderMode', RenderModes.COLUMNS)}/>
                </div>
                {/* DEVICES SELECTION MAY BE AVAILABLE IN THE FUTURE */}
                {/*<div className="section">*/}
                {/*    <h2>Device</h2>*/}
                {/*    <Selectable selected={props.params.device === Devices.CPU} active={isOpen} name={"CPU"} action={updateParam('device', Devices.CPU)}/>*/}
                {/*    <Selectable selected={props.params.device === Devices.GPU} active={isOpen} name={"GPU"} action={updateParam('device', Devices.GPU)}/>*/}
                {/*</div>*/}
            </div>
        </div>
    );
}

export default Menu;