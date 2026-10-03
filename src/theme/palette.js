// iACADEMY brand colors; light-surface text uses navy/ink, never gold.
export const colors = {
  navy: {50:"#f0f3ff",100:"#e5eaff",200:"#c3cff5",300:"#98abe2",400:"#617bc3",500:"#3f5b9e",600:"#304c87",700:"#24396f",800:"#16255a",900:"#0f1a3d",950:"#070b1f"},
  gold: {50:"#fff9e8",100:"#fbf1cf",200:"#f4e0a8",300:"#ecd68b",400:"#e8c874",500:"#d4af37",600:"#b8952c",700:"#806411",800:"#665014",900:"#4d3d13"},
  neutral: {50:"#f7f5f0",100:"#eeeae2",200:"#e0e3eb",300:"#c8cfde",400:"#9ca6bb",500:"#647086",600:"#4b5563",700:"#374151",800:"#1f2937",900:"#111827"},
  cobalt: {500:"#3b5bff",bright:"#5b7fff"},
  pop: {cyan:"#2dd4dc",coral:"#ff5c5c",amber:"#ffc93c"},
  paper:"#f7f5f0", ink:"#111827",
  // Sequential blue luminance ramp for future density layers; density is not disease risk.
  density: ["#edf2ff","#c6d6ff","#8daeff","#5b7fff","#3b5bff","#24396f","#070b1f"],
  risk: {
    low:{ink:"#24396f",surface:"#edf1ff",border:"#8192bf"},
    moderate:{ink:"#614708",surface:"#fff3cf",border:"#ae8b2d"},
    high:{ink:"#8e1e29",surface:"#ffeaec",border:"#c98388"},
    insufficient:{ink:"#374151",surface:"#eeeae2",border:"#9ca6bb"},
  },
  source: {
    community:{ink:"#61437a",surface:"#f3edfa",border:"#a18ab5"},
    official:{ink:"#24396f",surface:"#edf1ff",border:"#8192bf"},
  },
};
