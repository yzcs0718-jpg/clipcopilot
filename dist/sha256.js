// Local SHA-256 fallback for previews without the browser's secure-context digest API.
const primes=[];for(let n=2;primes.length<64;n++){if(primes.every(p=>n%p!==0))primes.push(n)}
const fraction=x=>Math.floor((x-Math.floor(x))*4294967296)>>>0,K=primes.map(p=>fraction(Math.cbrt(p))),initial=primes.slice(0,8).map(p=>fraction(Math.sqrt(p))),rotate=(v,n)=>(v>>>n)|(v<<(32-n));
export function sha256(input){
 const source=input instanceof Uint8Array?input:new Uint8Array(input),n=source.byteLength,length=Math.ceil((n+9)/64)*64,data=new Uint8Array(length);data.set(source);data[n]=128;const view=new DataView(data.buffer);view.setUint32(length-8,Math.floor(n/536870912));view.setUint32(length-4,(n*8)>>>0);
 const H=[...initial],W=new Uint32Array(64);
 for(let offset=0;offset<length;offset+=64){for(let i=0;i<16;i++)W[i]=view.getUint32(offset+i*4);for(let i=16;i<64;i++){const a=W[i-15],b=W[i-2],s0=rotate(a,7)^rotate(a,18)^(a>>>3),s1=rotate(b,17)^rotate(b,19)^(b>>>10);W[i]=(W[i-16]+s0+W[i-7]+s1)>>>0}
  let[a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const S1=rotate(e,6)^rotate(e,11)^rotate(e,25),ch=(e&f)^(~e&g),t1=(h+S1+ch+K[i]+W[i])>>>0,S0=rotate(a,2)^rotate(a,13)^rotate(a,22),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0}
  const state=[a,b,c,d,e,f,g,h];for(let i=0;i<8;i++)H[i]=(H[i]+state[i])>>>0;
 }
 const out=new Uint8Array(32),result=new DataView(out.buffer);H.forEach((v,i)=>result.setUint32(i*4,v));return out;
}
