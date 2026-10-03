export const mapRamp:string[];
export const linearRgb:(hex:string)=>number[];
export const luminance:(rgb:number[])=>number;
export const visionMatrices:Record<string,number[][]>;
export function simulatedLuminance(hex:string,matrix:number[][]):number;
export function mapColor(value:number|null,min:number,max:number):string;
