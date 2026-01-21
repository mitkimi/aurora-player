declare module 'ogl' {
  interface OGLWebGLRenderingContext extends WebGLRenderingContext {
    canvas: HTMLCanvasElement;
  }

  interface OGLWebGL2RenderingContext extends WebGL2RenderingContext {
    canvas: HTMLCanvasElement;
  }

  export class Renderer {
    gl: OGLWebGLRenderingContext | OGLWebGL2RenderingContext;
    canvas: HTMLCanvasElement;
    constructor(options?: {
      alpha?: boolean;
      premultipliedAlpha?: boolean;
      antialias?: boolean;
      dpr?: number;
    });
    setSize(width: number, height: number): void;
    render(options: { scene: Mesh }): void;
  }

  export class Program {
    uniforms: {
      [key: string]: {
        value: any;
      };
    };
    constructor(
      gl: OGLWebGLRenderingContext | OGLWebGL2RenderingContext,
      options: {
        vertex: string;
        fragment: string;
        uniforms?: {
          [key: string]: {
            value: any;
          };
        };
      }
    );
  }

  export class Mesh {
    constructor(
      gl: OGLWebGLRenderingContext | OGLWebGL2RenderingContext,
      options: {
        geometry: Geometry;
        program: Program;
      }
    );
  }

  export class Geometry {
    attributes: {
      [key: string]: any;
      uv?: any;
    };
    constructor(gl: OGLWebGLRenderingContext | OGLWebGL2RenderingContext);
  }

  export class Triangle extends Geometry {
    constructor(gl: OGLWebGLRenderingContext | OGLWebGL2RenderingContext);
  }

  export class Color {
    r: number;
    g: number;
    b: number;
    constructor(color: string | number | number[]);
    constructor(r: number, g: number, b: number);
  }

  export class Vec3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
  }
}
