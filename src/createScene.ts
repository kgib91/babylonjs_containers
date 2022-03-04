type Engine = import("@babylonjs/core/Engines/engine").Engine;
type Scene = import("@babylonjs/core/scene").Scene;
type Button = import("@babylonjs/gui").Button;

export interface OpenChangeLabelModalFunction { (lookupIndex: number, button: Button): void }

export interface CreateSceneClass {
    createScene: (  engine: Engine,
                    canvas: HTMLCanvasElement,
                    changeLabelFunc: OpenChangeLabelModalFunction) => Promise<Scene>;
    preTasks?: Promise<unknown>[];
}

export interface CreateSceneModule {
    default: CreateSceneClass;
}

export const getSceneModuleWithName = (
    name = 'demoForInterview'
): Promise<CreateSceneClass> => {
    return import('./scenes/' + name).then((module: CreateSceneModule)=> {
        return module.default;
    });
};

