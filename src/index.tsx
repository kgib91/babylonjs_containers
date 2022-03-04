import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { getSceneModuleWithName } from "./createScene";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.uniformBuffer";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { Button, ModalHeader, ModalFooter, ModalTitle, ModalBody, Modal } from "react-bootstrap";

import { Button as GuiButton } from "@babylonjs/gui";

import 'bootstrap/dist/css/bootstrap.min.css';

interface IReactIndexState {
    show: boolean;
    selectedButton: GuiButton | null;
    currentLabel: string;
}

class ReactIndex extends React.Component<any, IReactIndexState> {
    private canvasRef: React.RefObject<HTMLCanvasElement>;
    private labelInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: any) {
        super(props);
        this.canvasRef = React.createRef();
        this.labelInputRef = React.createRef();
        this.state = { show: false, selectedButton: null, currentLabel: '' };
    }

    componentDidMount() {
        if(this.canvasRef.current != null) {
            var component = this;
            const getModuleToLoad = (): string | undefined =>
            location.search.split("scene=")[1]?.split("&")[0];

            const babylonInit = async (): Promise<void> => {
                // get the module to load
                const moduleName = getModuleToLoad();
                const createSceneModule = await getSceneModuleWithName(moduleName);
                const engineType =
                    location.search.split("engine=")[1]?.split("&")[0] || "webgl";
                // Execute the pretasks, if defined
                await Promise.all(createSceneModule.preTasks || []);
                // Get the canvas element
                const canvas: HTMLCanvasElement = this.canvasRef.current as HTMLCanvasElement;
                // Generate the BABYLON 3D engine
                let engine: Engine;
                if (engineType === "webgpu") {
                    const webGPUSupported = await WebGPUEngine.IsSupportedAsync;
                    if (webGPUSupported) {
                        const webgpu = engine = new WebGPUEngine(canvas, {
                            adaptToDeviceRatio: true,
                            antialiasing: true
                        });
                        await webgpu.initAsync();
                        engine = webgpu;
                    } else {
                        engine = new Engine(canvas, true);
                    }
                } else {
                    engine = new Engine(canvas, true);
                }

                // Create the scene
                const scene = await createSceneModule.createScene(engine, canvas, (lookupIndex, button) => {
                    var newState: IReactIndexState = {
                        show: true,
                        selectedButton: button,
                        currentLabel: '',
                    };
                    if( newState.selectedButton != null
                        && newState.selectedButton.textBlock != null
                    ) {
                        newState.currentLabel = newState.selectedButton.textBlock.text;
                    }
                    this.setState(newState);
                });

                // Register a render loop to repeatedly render the scene
                engine.runRenderLoop(function () {
                    scene.render();
                });

                // Watch for browser/canvas resize events
                window.addEventListener("resize", function () {
                    engine.resize();
                    component.forceUpdate();
                });
            };

            babylonInit().then(() => {
                // scene started rendering, everything is initialized
            });
        }
    }

    handleModalClose() {
        this.setState({ show: false });
    }

    onChangeLabelText(evnt: React.ChangeEvent<HTMLInputElement>) {
        if(evnt.target != null) {
            this.setState({currentLabel: evnt.target.value});
        }
    }

    saveButtonLabel() {
        if(this.labelInputRef.current != null) {
            if(this.state.selectedButton != null &&
                this.state.selectedButton.textBlock != null) {
                    this.state.selectedButton.textBlock.text = this.labelInputRef.current.value;
                    this.setState({selectedButton: null, currentLabel: '' });
            }
        }
    }

    render() {
        const opts: any = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        return  <div>
                    <canvas
                        {...opts}
                        key="babylonjsScene"
                        ref={this.canvasRef}
                        touch-action="none">
                    </canvas>
                    <Modal  show={this.state.show}
                            key="labelChangeModal">
                        <ModalHeader>
                            <ModalTitle>Change Label</ModalTitle>
                        </ModalHeader>
                    
                        <ModalBody>
                            <input
                                ref={this.labelInputRef}
                                type="text"
                                placeholder="Label Name"
                                onChange={(evnt) => this.onChangeLabelText(evnt)}
                                value={this.state.currentLabel}
                            ></input>
                        </ModalBody>
                    
                        <ModalFooter>
                            <Button variant="secondary" onClick={() => this.handleModalClose()}>Close</Button>
                            <Button variant="primary" onClick={() => this.saveButtonLabel()}>Update label</Button>
                        </ModalFooter>
                    </Modal>
                </div>;
    }
}
ReactDOM.render(<ReactIndex />, document.getElementById("react-root"));