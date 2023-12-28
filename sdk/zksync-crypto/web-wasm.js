import fs from 'fs';

const wasmFile = './dist/zksync-crypto-web_bg.wasm';
const jsFile = './dist/zksync-crypto-web.js';
const asmJsFile = './zksync-crypto-bundler_asm.js';

const wasmData = fs.readFileSync(wasmFile);

const brokenStrings = [
    `input = import.meta.url.replace`,
    `input = new URL`
];

let jsCode = fs.readFileSync(jsFile, 'utf8');

brokenStrings.forEach(str => {
    jsCode = jsCode.replace(new RegExp(str, 'g'), `// ${str}`);
});

jsCode += `
const base64WasmCode = \`${wasmData.toString('base64')}\`;

const base64ToArrayBuffer = base64 => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

const wasmBytes = base64ToArrayBuffer(base64WasmCode);

const wasmResponseInit = {
  "status" : 200,
  "statusText" : "ok",
  "headers": {
    'Content-Type': 'application/wasm',
    'Content-Length': wasmBytes.length
  }
};

export const wasmSupported = () => typeof WebAssembly === 'object';

export const loadZkSyncCrypto = async (wasmFileUrl = '') => {
  if (!wasmSupported()) {
    return import('${asmJsFile}');
  }
  const response = wasmFileUrl ? await fetch(wasmFileUrl) : new Response(wasmBytes, wasmResponseInit);
  await init(response);
};
`;

fs.writeFileSync(jsFile, jsCode);
