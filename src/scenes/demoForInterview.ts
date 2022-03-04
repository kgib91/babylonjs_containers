import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";
import { CreateTorus } from "@babylonjs/core/Meshes/Builders/torusBuilder";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { CustomMaterial } from "@babylonjs/materials";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui";
import { CreateSceneClass, OpenChangeLabelModalFunction } from "../createScene";

// If you don't need the standard material you will still need to import it since the scene requires it.
// import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import { AbstractMesh, Color3, CreatePlane, CreateTorusKnot, CreateTube, Effect, EnvironmentTextureTools, GlowLayer, HighlightLayer, Mesh, Plane, RawTexture, Ray, ShaderMaterial, VertexData } from "@babylonjs/core";

export class DemoForInterview implements CreateSceneClass {

    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement,
        openChangeLabelModal: OpenChangeLabelModalFunction
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);
    
        // This creates and positions a free camera (non-mesh)
        const camera = new ArcRotateCamera(
            "mainSceneCamera",
            Math.PI * 0.25,
            Math.PI / 4,
            30,
            new Vector3(0, 0, 0),
            scene
        );
        camera.lowerBetaLimit = Math.PI * 0.05;
        camera.upperBetaLimit = Math.PI * 0.35;
        camera.lowerRadiusLimit = 10;
        camera.setTarget(Vector3.Zero());
    
        const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
    

        function storeShaders(name: string, vertex: string[], fragment: string[]) {
            Effect.ShadersStore[`${name}VertexShader`] = vertex.join('\r\n');
            Effect.ShadersStore[`${name}FragmentShader`] = fragment.join('\r\n');
        }
        
        storeShaders('scanLine', 
        [
            "precision highp float;",
            "// Attributes", 
            "attribute vec3 position;", 
            "attribute vec2 uv;", 
            "// Uniforms", 
            "uniform mat4 worldViewProjection;", 
            "uniform mat4 worldView;",
            "uniform float time;",
            "// Varying", 
            "varying vec3 vertex;", 
            "void main(void) {", 
                "gl_Position = worldViewProjection * vec4(position, 1.0);", 
                "vertex = position.xyz;",
            "}"
        ],
        [
            "precision highp float;",
            "// Uniforms",
            "uniform float time;",
            "// Varying",
            "varying vec3 vertex;",
            "void main(void) {",
            
            "float alpha = abs(cos(vertex.y*6.28*8.0-time*6.0));",
            "gl_FragColor = vec4(vec3(1.0, 0.498, 0.313), alpha + alpha * 1.0-cos((4.0 + vertex.y)*4.0*3.14));",
            
            "}"
        ]);
    
        var scanlineMaterial = new ShaderMaterial(
            "shader",
            scene,
            {
              vertex: "scanLine",
              fragment: "scanLine",
            },
            {
              attributes: ["position", "normal", "uv"],
              uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "time"],
              needAlphaBlending: true
            },
          );

        
        var boxyGlow = new GlowLayer("glow", scene, {
            blurKernelSize: 32
        });
        boxyGlow.customEmissiveColorSelector = function(mesh, subMesh, material, result) {
            if (mesh.name === "boxy") {
                result.set(1, 0.498, 0.313, 1);
            }
        }
        boxyGlow.intensity = 0.5;
        

        var dbgPlane: Mesh | null = null;

        var containersMesh = new Mesh("indexedSizeColorPositionMesh", scene);
        containersMesh.alwaysSelectAsActiveMesh = true;

        var adt = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        var totalEntities = 50;
        var spacing = 0.5;
        var iterations = 24;
        var maxElements = 32 * 32;
        var maxElementsSqrt = Math.sqrt(maxElements);
        var indices: number[] = [];
        var positions: number[] = [];
        var uvs: number[] = [];   
        var uvs2: number[] = [];

        function createRoundedBoxMesh(
            lookupIndex: number,
            depth: number,
            radius: number,
            thickness: number) {

            var s0 = iterations / 4;
            var s1 = s0 * 2;
            var s2 = s0 * 3;
            var i2 = iterations * 2;
            var i3 = iterations * 3;
            var step = (Math.PI * 2) / iterations;
            var angle = step*0.5;

            function addUvInfo(iteration: number) {
                if(iteration < s0) {
                    uvs.push(1,1);
                }
                if(iteration >= s0 && iteration < s1) {
                    uvs.push(-1,1);
                }
                if(iteration >= s1 && iteration < s2) {
                    uvs.push(-1,-1);
                }
                if(iteration >= s2) {
                    uvs.push(1,-1);
                }
            }

            var vertexOffset = lookupIndex * (iterations * 4);
            var lookupCoords = [(lookupIndex%maxElementsSqrt)/maxElementsSqrt,Math.floor(lookupIndex/maxElementsSqrt)/maxElementsSqrt];

            for(var i = 0; i < iterations; ++i) {
                var a = vertexOffset + i;
                var n = vertexOffset + ((i+1)%iterations);
                var c = vertexOffset + ((i+iterations)%i2);
                var d = vertexOffset + ((n+iterations)%i2);

                var x = Math.cos(step*i+angle)*radius*1.04;
                var z = Math.sin(step*i+angle)*radius*1.04;
                addUvInfo(i);
                uvs2.push(...lookupCoords);
                positions.push(x, depth, z);
                
                indices.push(a, c, n);
                indices.push(n, c, d);

                indices.push(d, i2+a, c);
                indices.push(d, i2+n, i2+a);

                indices.push(c, i3+a, d);
                indices.push(i3+a, i3+n, d);
            }
            
            for(var i = 0; i < iterations; ++i) {
                var x = Math.cos(step*i+angle)*(radius+thickness)*0.96;
                var z = Math.sin(step*i+angle)*(radius+thickness)*0.96;
                addUvInfo(i);
                uvs2.push(...lookupCoords);
                positions.push(x, depth, z);
            }
            
            for(var i = 0; i < iterations; ++i) {
                var x = Math.cos(step*i+angle)*radius;
                var z = Math.sin(step*i+angle)*radius;
                addUvInfo(i);
                uvs2.push(...lookupCoords);
                positions.push(x, 0, z);
            }
            
            for(var i = 0; i < iterations; ++i) {
                var x = Math.cos(step*i+angle)*(radius+thickness);
                var z = Math.sin(step*i+angle)*(radius+thickness);
                addUvInfo(i);
                uvs2.push(...lookupCoords);
                positions.push(x, 0, z);
            }
        }

        function packColor(color: Color3): number {
            var r = Math.floor(color.r * 255.0);
            var g = Math.floor(color.g * 255.0);
            var b = Math.floor(color.b * 255.0);
            return Math.floor(r) +
            Math.floor(g * 256.0) +
            Math.floor(b * 256.0 * 256.0);
        }        

        var indexedSizeColorPositionMaterial = new CustomMaterial(
            "indexedSizeColorPositionMaterial", scene);

        var indexedSizeColorData = new Float32Array(maxElements * 3);
        var indexedPositionData = new Float32Array(maxElements * 2);

        indexedSizeColorData[0] = 15;
        indexedSizeColorData[1] = 15;
        indexedSizeColorData[2] = packColor(new Color3(0.392, 0.584, 0.929));
        indexedPositionData[0] = 0;
        indexedPositionData[1] = 0;
        createRoundedBoxMesh(0, 0.25, 0.33, 0.25);

        var indexedSizeColorTexture = new RawTexture(indexedSizeColorData, maxElementsSqrt, maxElementsSqrt, Engine.TEXTUREFORMAT_RGB, scene, false, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT);
        var indexedPositionTexture = new RawTexture(indexedPositionData, maxElementsSqrt, maxElementsSqrt, Engine.TEXTUREFORMAT_RG, scene, false, false, Texture.NEAREST_SAMPLINGMODE, Engine.TEXTURETYPE_FLOAT);
        
        var idealSizeX: number = 0;
        var idealSizeY: number = 0;

        var nodesMinX: number;
        var nodesMaxX: number;
        var nodesMinY: number;
        var nodesMaxY: number;


        var tinyBoxRadius = 0.165;
        var tinyBoxThickness = 0.05;

        var meshes: AbstractMesh[] = [];

        function placeEntities(create: boolean) {
            nodesMinX = Number.MAX_VALUE;
            nodesMaxX = -Number.MAX_VALUE;
            nodesMinY = Number.MAX_VALUE;
            nodesMaxY = -Number.MAX_VALUE;

            var startX = indexedPositionData[0];
            var startY = indexedPositionData[1];
            var minX = startX - indexedSizeColorData[0] * 0.5 + (0.33*0.5) + (0.25 * 0.5);
            var minY = startY - indexedSizeColorData[1] * 0.5 + (0.33*0.5) + (0.25 * 0.5);
            var maxX = startX + indexedSizeColorData[0] * 0.5 - (0.33*0.5) + (0.25 * 0.5);
            var maxY = startY + indexedSizeColorData[1] * 0.5 - (0.33*0.5) + (0.25 * 0.5);
            if(idealSizeX == 0) {
                idealSizeX = (((maxX - minX)-(spacing*9)) / 10);
            }
            if(idealSizeY == 0) {
                idealSizeY = (((maxY - minY)-(spacing*9)) / 10);
            }

            var posX = minX + (idealSizeX*0.5) - tinyBoxRadius + tinyBoxThickness;
            var posY = minY + (idealSizeY*0.5) - tinyBoxRadius + tinyBoxThickness;
          
            for(var lookupIndex = 1; lookupIndex < (totalEntities + 1); ++lookupIndex) {
                var sizeColorIdx = lookupIndex * 3;
                var posIdx = lookupIndex * 2;

                indexedPositionData[posIdx + 0] = posX;
                indexedPositionData[posIdx + 1] = posY;

                if(create) {
                    var mesh = CreateBox('boxy', { width: idealSizeX * 0.5, depth: idealSizeY * 0.5, height: Math.max(idealSizeY, idealSizeX) * 0.5 }, scene);
                    mesh.position = new Vector3(posX, idealSizeX*0.5, posY);
                    mesh.hasVertexAlpha = true;
                    mesh.material = scanlineMaterial;
                    meshes[lookupIndex-1] = mesh;
                    boxyGlow.addIncludedOnlyMesh(mesh);

                    var btn = Button.CreateSimpleButton('btn'+lookupIndex, `Boxy #${lookupIndex}`);
                    btn.width = "64px";
                    btn.height = "20px";
                    btn.color = "white";
                    btn.background = "rgba(0, 0, 0, 0.85)";
                    btn.cornerRadius = 5;
                    btn.fontSize = 12;
                    btn.fontFamily = "Verdana";
                    (function(index, button, boxy: AbstractMesh) {
                        button.onPointerDownObservable.add(function(evt) {
                            window.document.body.style.cursor = 'auto';
                            openChangeLabelModal(index, button);
                            boxy.scaling = new Vector3(1, 1, 1);
                            button.scaleX = 1;
                            button.scaleY = 1;
                        });
    
                        button.onPointerEnterObservable.add(function(evt) {
                            window.document.body.style.cursor = "pointer";
                            boxy.scaling = new Vector3(1.5, 1.5, 1.5);
                            button.scaleX = 1.5;
                            button.scaleY = 1.5;
                        });
    
                        button.onPointerOutObservable.add(function(evt) {
                            window.document.body.style.cursor = 'auto';
                            boxy.scaling = new Vector3(1, 1, 1);
                            button.scaleX = 1;
                            button.scaleY = 1;
                        });
                    })(lookupIndex, btn, mesh);

                    adt.addControl(btn);
                    btn.linkWithMesh(mesh);
                    btn.linkOffsetY = -10;

                    indexedSizeColorData[sizeColorIdx + 0] = idealSizeX - tinyBoxRadius*2 - tinyBoxThickness*2;
                    indexedSizeColorData[sizeColorIdx + 1] = idealSizeY - tinyBoxRadius*2 - tinyBoxThickness*2;
                    indexedSizeColorData[sizeColorIdx + 2] = packColor(new Color3(0.5, 0.5, 0.5));
                    createRoundedBoxMesh(lookupIndex, 0.15, tinyBoxRadius, tinyBoxThickness);
                }

                posX += indexedSizeColorData[sizeColorIdx + 0] + tinyBoxRadius*2 + tinyBoxThickness*2 + spacing;
                if(posX + indexedSizeColorData[sizeColorIdx + 0] * 0.5 > maxX) {
                    posX = minX + (idealSizeX*0.5) - tinyBoxRadius + tinyBoxThickness;
                    posY = posY + indexedSizeColorData[sizeColorIdx + 0] + tinyBoxRadius*2 + tinyBoxThickness*2 + spacing;
                }

                nodesMinX = Math.min(nodesMinX, indexedPositionData[posIdx + 0] - (indexedSizeColorData[sizeColorIdx + 0])*0.5 - spacing);
                nodesMaxX = Math.max(nodesMaxX, indexedPositionData[posIdx + 0] + (indexedSizeColorData[sizeColorIdx + 0])*0.5 + spacing);
                nodesMinY = Math.min(nodesMinY, indexedPositionData[posIdx + 1] - (indexedSizeColorData[sizeColorIdx + 1])*0.5 - spacing);
                nodesMaxY = Math.max(nodesMaxY, indexedPositionData[posIdx + 1] + (indexedSizeColorData[sizeColorIdx + 1])*0.5 + spacing);
                
            }
            /*
            if(dbgPlane != null) {
                dbgPlane.dispose();
                dbgPlane = null;
            }

            if(dbgPlane == null) {
                dbgPlane = GroundBuilder.CreateGround(
                    "ground2",
                    {
                        width: nodesMaxX-nodesMinX,
                        height: nodesMaxY-nodesMinY
                    },
                    scene
                );
                dbgPlane.position.x = (nodesMaxX+nodesMinX)*0.5;
                dbgPlane.position.z = (nodesMaxY+nodesMinY)*0.5;
            }
            */
            indexedSizeColorTexture.update(indexedSizeColorData);
            indexedPositionTexture.update(indexedPositionData);
        }

        placeEntities(true);

        indexedSizeColorPositionMaterial.AddAttribute('uv');
        indexedSizeColorPositionMaterial.AddAttribute('uv2');
        indexedSizeColorPositionMaterial.AddUniform('sizeColorLookupTexture', 'sampler2D', indexedSizeColorTexture);
        indexedSizeColorPositionMaterial.AddUniform('positionLookupTexture', 'sampler2D', indexedPositionTexture);
        indexedSizeColorPositionMaterial.Vertex_Definitions([
            "attribute vec2 uv;", 
            "attribute vec2 uv2;", 
            "// Varying",
            "varying vec3 color;",
            "// Const",
            "vec3 unpackColor(float f) {",
                "vec3 color;",
                "color.b = floor(f / 256.0 / 256.0);",
                "color.g = floor((f - (color.b * 256.0 * 256.0)) / 256.0);",
                "color.r = floor(f - (color.b * 256.0 * 256.0) - (color.g * 256.0));",
                "return color / 256.0;",
            "}",
        ].join('\r\n'));
        indexedSizeColorPositionMaterial.Vertex_Before_PositionUpdated([
            "vec2 posTex = texture(positionLookupTexture, uv2).rg; ",
            "vec3 sizeColorTex = texture(sizeColorLookupTexture, uv2).rgb; ",
            "vec2 offset2 = sizeColorTex.rg * uv;",
            "vec3 offset3 = vec3(posTex.x + offset2.x * 0.5, 0, posTex.y + offset2.y * 0.5);",
            "color = unpackColor(sizeColorTex.b);",
            "positionUpdated += offset3;"
        ].join('\r\n'));
        indexedSizeColorPositionMaterial.Fragment_Definitions([            
            "varying vec3 color;"
        ].join('\r\n'));
        indexedSizeColorPositionMaterial.Fragment_Custom_Diffuse([
            "baseColor.rgb = color;",
        ].join('\r\n'));

        var normals = new Float32Array(positions.length);
        VertexData.ComputeNormals(positions, indices, normals);
            
        var vertexData = new VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.uvs = uvs;
        vertexData.uvs2 = uvs2;
        vertexData.normals = normals;
        vertexData.applyToMesh(containersMesh);

        containersMesh.material = indexedSizeColorPositionMaterial;
    
        var collisionPlane = Plane.FromPositionAndNormal(Vector3.Zero(), Vector3.Up());
        collisionPlane.transform(containersMesh.getWorldMatrix());

        var glowLayer = new GlowLayer("glow", scene, {
            blurKernelSize: 32
        });
        glowLayer.setMaterialForRendering(containersMesh, indexedSizeColorPositionMaterial);
        glowLayer.customEmissiveColorSelector = function(mesh, subMesh, material, result) {
            if (mesh.name === "indexedSizeColorPositionMesh") {
                result.set(0.392, 0.584, 0.929, 1);
            } else {
                result.set(0, 0, 0, 0);
            }
        }
        glowLayer.intensity = 0.5;       
        glowLayer.addIncludedOnlyMesh(containersMesh);

        camera.attachControl(canvas, true);

        var dragging = false;
        var dragStartVertex = Vector3.Zero();
        var dragWidth = indexedSizeColorData[0 + 0];
        var dragHeight = indexedSizeColorData[0 + 1];
        var dragOriginX = indexedPositionData[0 + 0];
        var dragOriginZ = indexedPositionData[0 + 1];

        scene.onPointerMove = function(evnt, pickInfo, type) {
                
            if(dragging) {
                var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
                var rayDistance = ray.intersectsPlane(collisionPlane);
                if(rayDistance != null) {
                    
                    placeEntities(false);

                    var dragVertex = ray.origin.clone()
                        .add(ray.direction.clone().scale(rayDistance));
                    var dragDelta = dragVertex.subtract(dragStartVertex);
                    
                    var deltaX = dragDelta.x;
                    var deltaZ = dragDelta.z;
                    if(evnt.shiftKey) {
                        deltaX = Math.floor(deltaX);
                        deltaZ = Math.floor(deltaZ);
                    }
                    var newSizeX = Math.max(0, dragWidth + deltaX);
                    var newSizeY = Math.max(0, dragHeight + deltaZ);
                    var newPosX = Math.max(dragOriginX-dragWidth*0.5, dragOriginX + deltaX*0.5);
                    var newPosY = Math.max(dragOriginZ-dragHeight*0.5, dragOriginZ + deltaZ*0.5);

                    var startX = newPosX;
                    var startY = newPosY;
                    var minX = startX - newSizeX * 0.5 + (0.33*0.5) + (0.25 * 0.5);
                    var minY = startY - newSizeY * 0.5 + (0.33*0.5) + (0.25 * 0.5);
                    var maxX = startX + newSizeX * 0.5 - (0.33*0.5) + (0.25 * 0.5);
                    var maxY = startY + newSizeY * 0.5 - (0.33*0.5) + (0.25 * 0.5);
                    var sizeX = (maxX - minX);
                    var sizeY = (maxY - minY);
                    var maxArea = sizeX * sizeY;
                    
                    var totalArea = 0.33*2+0.25*2;
                    var sw = nodesMaxX-nodesMinX;
                    var sh = nodesMaxY-nodesMinY;
                    var totalArea = sw*sh;
                    
                    if(totalArea < maxArea) {
                        indexedSizeColorData[0 + 0] = newSizeX;
                        indexedSizeColorData[0 + 1] = newSizeY;
                        indexedPositionData[0 + 0] = newPosX;
                        indexedPositionData[0 + 1] = newPosY;

                        indexedSizeColorTexture.update(indexedSizeColorData);
                        indexedPositionTexture.update(indexedPositionData);

                    } else {
                        if(sh > newSizeY) {
                            var sizeDelta = Math.max(0, sh - newSizeY);
                            indexedSizeColorData[0 + 0] = Math.max(newSizeX, idealSizeX + spacing);
                            indexedPositionData[0 + 0] = Math.max(newPosX,  dragOriginX - dragWidth * 0.5 + idealSizeX - spacing * 0.5);

                            indexedSizeColorData[0 + 1] = sh;
                            indexedPositionData[0 + 1] = newPosY + (sizeDelta * 0.5);
                            
                            indexedSizeColorTexture.update(indexedSizeColorData);
                            indexedPositionTexture.update(indexedPositionData);
    
                        } else {
                            indexedSizeColorData[0 + 0] = newSizeX;
                            indexedPositionData[0 + 0] = newPosX;

                            indexedSizeColorTexture.update(indexedSizeColorData);
                            indexedPositionTexture.update(indexedPositionData);
                        }
                    }
                }
            }
        }

        scene.onPointerDown = function(evnt, pickInfo, type) {
            
            var vec3 = new Vector3(
                indexedPositionData[0] + indexedSizeColorData[0] * 0.5,
                0,
                indexedPositionData[1] + indexedSizeColorData[1] * 0.5
            );

            var coordinates = Vector3.Project(vec3,
                Matrix.Identity(),
                scene.getTransformMatrix(),
                camera.viewport.toGlobal(
                engine.getRenderWidth(),
                engine.getRenderHeight(),
                ));
            var pointer = new Vector3(scene.pointerX, scene.pointerY);

            if(coordinates.subtract(pointer).lengthSquared() < 1000 &&
                evnt.button == 0) {
                    dragging = true;
                    
                var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);
                var rayDistance = ray.intersectsPlane(collisionPlane);
                if(rayDistance != null) {
                    dragStartVertex = ray.origin.clone()
                        .add(ray.direction.clone().scale(rayDistance));
                    dragWidth = indexedSizeColorData[0 + 0];
                    dragHeight = indexedSizeColorData[0 + 1];
                    dragOriginX = indexedPositionData[0 + 0];
                    dragOriginZ = indexedPositionData[0 + 1];
                }

                camera.detachControl();
            }
        };

        scene.onPointerUp = function(evnt, pickInfo, type) {
            if(evnt.button == 0) {
                dragging = false;
                camera.attachControl(canvas, true);
            }
        }

        var t = 0;
        engine.runRenderLoop(function() {
            var dt = engine.getDeltaTime()/1000;
            t += dt;

            scanlineMaterial.setFloat("time", t);

            for(var i = 1; i < totalEntities+1; ++i) {
                var meshIdx = i - 1;
                var mesh = meshes[meshIdx];
                var mx = indexedPositionData[i*2+0];
                var mz = indexedPositionData[i*2+1];
                var dis = Math.sqrt(mx*mx+mz*mz) * 0.25;
                mesh.position.x = mx;
                mesh.position.z = mz;
                mesh.position.y = 0.5 + Math.cos(dis+Math.PI*2*t*0.1) *
                                    Math.sin(dis+Math.PI*2*t*0.1) * 0.5;
            }
        });

        
        storeShaders('grid', 
        [
            "precision highp float;",
            "// Attributes", 
            "attribute vec3 position;", 
            "attribute vec2 uv;", 
            "// Uniforms", 
            "uniform mat4 worldViewProjection;", 
            "uniform mat4 worldView;",
            "// Varying", 
            "varying vec3 vertex;", 
            "void main(void) {", 
                "gl_Position = worldViewProjection * vec4(position, 1.0);", 
                "vertex = position.xyz;",
            "}"
        ],
        [
            "precision highp float;",
            "varying vec3 vertex;",
            "void main(void) {",

            "vec2 coord = vertex.xz;",
            "vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);",
            "float line = min(grid.x, grid.y);",
            "float color = 1.0 - min(line, 1.0);",
            "color = pow(color, 1.0 / 2.2);",

            "coord = vertex.xz * 0.5;",
            "grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);",
            "line = min(grid.x, grid.y);",
            "float color2 = 1.0 - min(line, 1.0);",
            "color += pow(color2, 1.0 / 2.2) * 0.5;",

            "gl_FragColor = vec4(vec3(color), (1.0 * color - length(vertex) * 0.01) * 0.05);",
            
            "}"
        ]);
    
        var gridMaterial = new ShaderMaterial(
            "shader",
            scene,
            {
              vertex: "grid",
              fragment: "grid",
            },
            {
              attributes: ["position", "normal", "uv"],
              uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
              needAlphaBlending: true
            },
          );
      
          const ground = CreateGround(
            "ground",
            { width: 1024, height: 1024 },
            scene
        );
        ground.material = gridMaterial;

        return scene;
    };
}

export default new DemoForInterview();