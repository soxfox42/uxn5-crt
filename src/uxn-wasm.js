// Uxn.wasm v0.2.0
// https://github.com/remko/uxn.wasm
var UxnWASM=(()=>{var a=(A,j)=>()=>(A&&(j=A(A=0)),j);var p=(A,j)=>()=>(j||A((j={exports:{}}).exports,j),j.exports);var n=(()=>{for(var A=new Uint8Array(128),j=0;j<64;j++)A[j<26?j+65:j<52?j+71:j<62?j-4:j*4-205]=j;return $=>{for(var r=$.length,k=new Uint8Array((r-($[r-1]=="=")-($[r-2]=="="))*3/4|0),t=0,e=0;t<r;){var v=A[$.charCodeAt(t++)],s=A[$.charCodeAt(t++)],u=A[$.charCodeAt(t++)],f=A[$.charCodeAt(t++)];k[e++]=v<<2|s>>4,k[e++]=s<<4|u>>2,k[e++]=u<<6|f}return k}})();var o,i=a(()=>{o=n("AGFzbQEAAAABFgVgAn9/AGABfwF/YAF/AGAAAGAAAX8CGwIGc3lzdGVtA2RlbwAABnN5c3RlbQNkZWkAAQMGBQIBAwQEBQMBAAIGCwJ/AUF/C38BQX8LBycFBGV2YWwAAgVyZXNldAAEBHdzdHAABQRyc3RwAAYGbWVtb3J5AgAIAQQK8E8Fsk8BBH8gAEUEQA8LQY+EBC0AAARADwsCQANAIAAtAAAhASAAQQFqIQACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQCABDoACAAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AAYEBggGDAYQBhQGGAYcBiAGJAYoBiwGMAY0BjgGPAZABkQGSAZMBlAGVAZYBlwGYAZkBmgGbAZwBnQGeAZ8BoAGhAaIBowGkAaUBpgGn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IQIjAEECai8BACEDIwBBAWskACMAIAIgA0Y6AAAMVwsjAC8BACECIwBBAmovAQAhAyMAQQFrJAAjACACIANHOgAADFYLIwAvAQAhAiMAQQJqLwEAIQMjAEEBayQAIwAgAyACSzoAAAxVCyMALwEAIQIjAEECai8BACEDIwBBAWskACMAIAMgAkk6AAAMVAsjAC8BACECIAIhAAxTCyMALwEAIQIjAEECai0AACEDIAMEQCACIQALDFILIwAvAQAhAiMBQQJrJAEjASAAOwEAIAIhAAxRCyMALwEAIQIjAUECayQBIwEgAjsBAAxQCyMALQAAIQIjAEECayQAIwAgAi8BABADOwEADE8LIwAtAAAhAiMAQQFqLwEAIQMgAiADEAM7AQAMTgsjAC0AACECIwBBAmskACMAIAAgAkEYdEEYdWovAQAQAzsBAAxNCyMALQAAIQIjAEEBai8BACEDIAAgAkEYdEEYdWogAxADOwEADEwLIwAvAQAhAiMAQQJrJAAjACACLwEAEAM7AQAMSwsjAC8BACECIwBBAmovAQAhAyACIAMQAzsBAAxKCyMALQAAIQIjAEECayQAIwAgAkEBahABOgAAIwBBAWogAhABOgAADEkLIwAtAAAhAiMAQQFqLQAAIQMjAEECai0AACEEQYCEBCACaiAEOgAAIAIgBBAAQYGEBCACaiADOgAAIAJBAWogAxAADEgLIwAvAQAhAiMAQQJqLwEAIQMjAEECayQAIwAgAyACajsBAAxHCyMALwEAIQIjAEECai8BACEDIwBBAmskACMAIAMgAms7AQAMRgsjAC8BACECIwBBAmovAQAhAyMAQQJrJAAjACADIAJsOwEADEULIwAvAQAhAiMAQQJqLwEAIQMjAEECayQAIwAgAkUEf0EABSADIAJuCzsBAAxECyMALwEAIQIjAEECai8BACEDIwBBAmskACMAIAMgAnE7AQAMQwsjAC8BACECIwBBAmovAQAhAyMAQQJrJAAjACADIAJyOwEADEILIwAvAQAhAiMAQQJqLwEAIQMjAEECayQAIwAgAyACczsBAAxBCyMALQAAIQIjAEEBai8BACEDIwBBAmskACMAIAMgAkEPcXYgAkEEdnQ7AQAMQAsjAUEBayQBIwEgAC0AADoAACAAQQFqIQAMPwsjAS0AACECIwFBAWskASMBIAJBAWo6AAAMPgsMPQsjAS0AACECIwFBAWskASMBIAI6AAAMPAsjAS0AACECIwFBAWotAAAhAyMBQQJrJAEjASADOgAAIwFBAWogAjoAAAw7CyMBLQAAIQIjAUEBai0AACEDIwFBAmotAAAhBCMBQQNrJAEjASAEOgAAIwFBAWogAjoAACMBQQJqIAM6AAAMOgsjAS0AACECIwFBAmskASMBIAI6AAAjAUEBaiACOgAADDkLIwEtAAAhAiMBQQFqLQAAIQMjAUEDayQBIwEgAzoAACMBQQFqIAI6AAAjAUECaiADOgAADDgLIwEtAAAhAiMBQQFqLQAAIQMjAUEBayQBIwEgAiADRjoAAAw3CyMBLQAAIQIjAUEBai0AACEDIwFBAWskASMBIAIgA0c6AAAMNgsjAS0AACECIwFBAWotAAAhAyMBQQFrJAEjASADIAJLOgAADDULIwEtAAAhAiMBQQFqLQAAIQMjAUEBayQBIwEgAyACSToAAAw0CyMBLQAAIQIgACACQRh0QRh1aiEADDMLIwEtAAAhAiMBQQFqLQAAIQMgAwRAIAAgAkEYdEEYdWohAAsMMgsjAS0AACECIwBBAmskACMAIAA7AQAgACACQRh0QRh1aiEADDELIwEtAAAhAiMAQQFrJAAjACACOgAADDALIwEtAAAhAiMBQQFrJAEjASACLQAAOgAADC8LIwEtAAAhAiMBQQFqLQAAIQMgAiADOgAADC4LIwEtAAAhAiMBQQFrJAEjASAAIAJBGHRBGHVqLQAAOgAADC0LIwEtAAAhAiMBQQFqLQAAIQMgACACQRh0QRh1aiADOgAADCwLIwEvAQAhAiMBQQFrJAEjASACLQAAOgAADCsLIwEvAQAhAiMBQQJqLQAAIQMgAiADOgAADCoLIwEtAAAhAiMBQQFrJAEjASACEAE6AAAMKQsjAS0AACECIwFBAWotAAAhA0GAhAQgAmogAzoAACACIAMQAAwoCyMBLQAAIQIjAUEBai0AACEDIwFBAWskASMBIAMgAmo6AAAMJwsjAS0AACECIwFBAWotAAAhAyMBQQFrJAEjASADIAJrOgAADCYLIwEtAAAhAiMBQQFqLQAAIQMjAUEBayQBIwEgAyACbDoAAAwlCyMBLQAAIQIjAUEBai0AACEDIwFBAWskASMBIAJFBH9BAAUgAyACbgs6AAAMJAsjAS0AACECIwFBAWotAAAhAyMBQQFrJAEjASADIAJxOgAADCMLIwEtAAAhAiMBQQFqLQAAIQMjAUEBayQBIwEgAyACcjoAAAwiCyMBLQAAIQIjAUEBai0AACEDIwFBAWskASMBIAMgAnM6AAAMIQsjAS0AACECIwFBAWotAAAhAyMBQQFrJAEjASADIAJBD3F2IAJBBHZ0OgAADCALIwFBAmskASMBIAAvAQAQAzsBACAAQQJqIQAMHwsjAS8BACECIwFBAmskASMBIAJBAWo7AQAMHgsMHQsjAS8BACECIwFBAmskASMBIAI7AQAMHAsjAS8BACECIwFBAmovAQAhAyMBQQRrJAEjASADOwEAIwFBAmogAjsBAAwbCyMBLwEAIQIjAUECai8BACEDIwFBBGovAQAhBCMBQQZrJAEjASAEOwEAIwFBAmogAjsBACMBQQRqIAM7AQAMGgsjAS8BACECIwFBBGskASMBIAI7AQAjAUECaiACOwEADBkLIwEvAQAhAiMBQQJqLwEAIQMjAUEGayQBIwEgAzsBACMBQQJqIAI7AQAjAUEEaiADOwEADBgLIwEvAQAhAiMBQQJqLwEAIQMjAUEBayQBIwEgAiADRjoAAAwXCyMBLwEAIQIjAUECai8BACEDIwFBAWskASMBIAIgA0c6AAAMFgsjAS8BACECIwFBAmovAQAhAyMBQQFrJAEjASADIAJLOgAADBULIwEvAQAhAiMBQQJqLwEAIQMjAUEBayQBIwEgAyACSToAAAwUCyMBLwEAIQIgAiEADBMLIwEvAQAhAiMBQQJqLQAAIQMgAwRAIAIhAAsMEgsjAS8BACECIwBBAmskACMAIAA7AQAgAiEADBELIwEvAQAhAiMAQQJrJAAjACACOwEADBALIwEtAAAhAiMBQQJrJAEjASACLwEAEAM7AQAMDwsjAS0AACECIwFBAWovAQAhAyACIAMQAzsBAAwOCyMBLQAAIQIjAUECayQBIwEgACACQRh0QRh1ai8BABADOwEADA0LIwEtAAAhAiMBQQFqLwEAIQMgACACQRh0QRh1aiADEAM7AQAMDAsjAS8BACECIwFBAmskASMBIAIvAQAQAzsBAAwLCyMBLwEAIQIjAUECai8BACEDIAIgAxADOwEADAoLIwEtAAAhAiMBQQJrJAEjASACQQFqEAE6AAAjAUEBaiACEAE6AAAMCQsjAS0AACECIwFBAWotAAAhAyMBQQJqLQAAIQRBgIQEIAJqIAQ6AAAgAiAEEABBgYQEIAJqIAM6AAAgAkEBaiADEAAMCAsjAS8BACECIwFBAmovAQAhAyMBQQJrJAEjASADIAJqOwEADAcLIwEvAQAhAiMBQQJqLwEAIQMjAUECayQBIwEgAyACazsBAAwGCyMBLwEAIQIjAUECai8BACEDIwFBAmskASMBIAMgAmw7AQAMBQsjAS8BACECIwFBAmovAQAhAyMBQQJrJAEjASACRQR/QQAFIAMgAm4LOwEADAQLIwEvAQAhAiMBQQJqLwEAIQMjAUECayQBIwEgAyACcTsBAAwDCyMBLwEAIQIjAUECai8BACEDIwFBAmskASMBIAMgAnI7AQAMAgsjAS8BACECIwFBAmovAQAhAyMBQQJrJAEjASADIAJzOwEADAELIwEtAAAhAiMBQQFqLwEAIQMjAUECayQBIwEgAyACQQ9xdiACQQR2dDsBAAwACwsLFgAgAEH/AXFBCHQgAEGA/gNxQQh2cgsZAEH/gQQkAEH/gwQkAUEAQQBBgIYE/AsACwQAIwALBAAjAQsAWgRuYW1lAAQDdXhuARgEAANkZW8BA2RlaQMEc3dhcAQFcmVzZXQCJAcAAAEAAgUAAnBjAQNpbnMCAXQDAW4EAWwDAQABdgQABQAGAAcNAgAEd3N0cAEEcnN0cA==")});var q=p((E,x)=>{i();function m(){let A,j,$,r=()=>{A.exports.reset()};this.init=async k=>(A=(await WebAssembly.instantiate(o,{system:k})).instance,this.ram=new Uint8Array(A.exports.memory.buffer,0,66304),this.dev=new Uint8Array(A.exports.memory.buffer,66048,256),j=new Uint8Array(A.exports.memory.buffer,65536,255),$=new Uint8Array(A.exports.memory.buffer,65792,255),this),this.load=k=>{r();for(let t=0,e=k.length;t<e;++t)this.ram[256+t]=k[t];return this},this.eval=k=>{A.exports.eval(k)},this.wst={get:k=>j[254-k],ptr:()=>65791-A.exports.wstp()},this.rst={get:k=>$[254-k],ptr:()=>66047-A.exports.rstp()}}x.exports=m});return q();})();
//# sourceMappingURL=uxn-wasm.js.map