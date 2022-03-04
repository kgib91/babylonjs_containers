/*import { Camera, Color3, FloatArray, IndicesArray, Mesh, Nullable, Scene, VertexData } from "@babylonjs/core";

interface IContainerLookup {
    lookupIndex: number;
    container: IContainer;
}

interface IContainer {
    width: number;
    height: number;
    x: number;
    y: number;
    color: Color3;
    depth: number;
    borderRadius: number;
    thickness: number;
}

interface IContainersObjectOptions {
    iterations: number;
}

class ContainersObject {
    private name: String;
    private scene: Scene;
    private camera: Camera;
    private containerLookups: IContainerLookup[];
    private options: IContainersObjectOptions;

    private containersMesh: Mesh;
    private indices: Int32Array;
    private positions: Float32Array;
    private normals: Float32Array;
    private uvs: Float32Array;
    private uvs2: Float32Array;

    GlowyGrid(
        name: string,
        scene: Scene,
        camera: Camera,
        options: IContainersObjectOptions) {

        this.name = name;
        this.scene = scene;
        this.camera = camera;
        this.containerLookups = [];
        
        this.options = options || {
            iterations: 25
        };
        this.containersMesh = new Mesh(`${name}_indexedSizeColorPositionMesh`, this.scene);

        this.indices = new Float32Array();
        this.positions = new Float32Array();
        this.normals = new Float32Array();
        this.uvs = new Float32Array();
        this.uvs2 = new Float32Array();

    }

    private findNextLookupIndex(): number {
        return this.containerLookups.length;
    }

    addContainer(container: IContainer) {
        var existingContainerLookup = this.containerLookups.find(q => q.container == container);
        if(existingContainerLookup !== undefined) {
            return;
        }

        var lookupStride = this.options.iterations * 4;
        this.positions = new Float32Array(this.positions.length + lookupStride);
        this.indices = new Float32Array

        var containerLookup = {
            lookupIndex: this.findNextLookupIndex(),
            container
        };

        this.createRoundedBoxMesh(
            containerLookup.lookupIndex,
            container.depth,
            container.borderRadius,
            container.thickness);

        this.containerLookups.push(containerLookup);
    }
    
    private createRoundedBoxMesh(
        lookupIndex: number,
        depth: number,
        radius: number,
        thickness: number) {

        var maxElements = 32 * 32;
        var maxElementsSqrt = Math.sqrt(maxElements);
        var indices: Int32Array = this.indices;
        var positions: Float32Array = this.positions;
        var uvs: Float32Array = this.uvs;   
        var uvs2: Float32Array = this.uvs2; 
        var normals: Float32Array = this.normals;
            
        var s0 = this.options.iterations / 4;
        var s1 = s0 * 2;
        var s2 = s0 * 3;
        var i1 = this.options.iterations * 1;
        var i2 = this.options.iterations * 2;
        var i3 = this.options.iterations * 3;
        var step = (Math.PI * 2) / this.options.iterations;
        var angle = step*0.5;

        function addUvInfo(vertexOffset: number, iteration: number) {
            if(iteration < s0) {
                uvs.set([1,1], vertexOffset);
            }
            if(iteration >= s0 && iteration < s1) {
                uvs.set([-1,1], vertexOffset);
            }
            if(iteration >= s1 && iteration < s2) {
                uvs.set([-1,-1], vertexOffset);
            }
            if(iteration >= s2) {
                uvs.set([1,-1], vertexOffset);
            }
        }

        var vertexOffset = lookupIndex * (this.options.iterations * 4);
        var lookupCoords = [(lookupIndex%maxElementsSqrt)/maxElementsSqrt,Math.floor(lookupIndex/maxElementsSqrt)/maxElementsSqrt];

        for(var i = 0; i < this.options.iterations; ++i) {
            var a = vertexOffset + i;
            var n = vertexOffset + ((i+1)%this.options.iterations);
            var c = vertexOffset + ((i+this.options.iterations)%i2);
            var d = vertexOffset + ((n+this.options.iterations)%i2);

            var x = Math.cos(step*i+angle)*radius*1.04;
            var z = Math.sin(step*i+angle)*radius*1.04;
            addUvInfo(vertexOffset+i*2, i);
            uvs2.set(lookupCoords, vertexOffset+i*2);
            positions.set([x, depth, z], vertexOffset+i*3);
            
            indices.set([a, c, n], vertexOffset+i*3);
            indices.set([n, c, d], vertexOffset+(i+1)*3);

            indices.set([d, i2+a, c], vertexOffset+i1+(i*3));
            indices.set([d, i2+n, i2+a], vertexOffset+i1+((i+1)*3));

            indices.set([c, i3+a, d], vertexOffset+i2+(i*3));
            indices.set([i3+a, i3+n, d], vertexOffset+i2+((i+1)*3));
        }
        
        for(var i = 0; i < this.options.iterations; ++i) {
            var x = Math.cos(step*i+angle)*(radius+thickness)*0.96;
            var z = Math.sin(step*i+angle)*(radius+thickness)*0.96;
            addUvInfo(vertexOffset + i1 + i*2, i);
            uvs2.set(lookupCoords, vertexOffset + i1 + i * 2);
            positions.set([x, depth, z], vertexOffset + i1 + i*2);
        }
        
        for(var i = 0; i < this.options.iterations; ++i) {
            var x = Math.cos(step*i+angle)*radius;
            var z = Math.sin(step*i+angle)*radius;
            addUvInfo(vertexOffset+i2+i*2, i);
            uvs2.set(lookupCoords, vertexOffset+i2+i);
            positions.set([x, 0, z], vertexOffset+i2+i);
        }
        
        for(var i = 0; i < this.options.iterations; ++i) {
            var x = Math.cos(step*i+angle)*(radius+thickness);
            var z = Math.sin(step*i+angle)*(radius+thickness);
            addUvInfo(vertexOffset+i3+i, i);
            uvs2.set(lookupCoords, vertexOffset+i3+i);
            positions.set([x, 0, z], vertexOffset+i3+i);
        }

        VertexData.ComputeNormals(positions, indices, normals);
            
        this.vertexData.applyToMesh(this.containersMesh);
    }
}*/