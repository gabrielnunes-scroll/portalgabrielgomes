// ZIP store format: browser-side packaging avoids loading every R2 file in a Worker.
const encoder=new TextEncoder();
const table=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc(bytes:Uint8Array){let value=0xffffffff;for(const byte of bytes)value=table[(value^byte)&255]^(value>>>8);return (value^0xffffffff)>>>0;}
export class BackupZip{
 private parts:BlobPart[]=[];private directory:Uint8Array[]=[];private offset=0;
 add(path:string,bytes:Uint8Array){const name=encoder.encode(path);if(this.directory.length>=65535||this.offset+bytes.length>0xffffffff)throw Error('Backup excede o limite de ZIP. Exporte em partes.');const sum=crc(bytes),local=new Uint8Array(30+name.length),l=new DataView(local.buffer);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);l.setUint32(14,sum,true);l.setUint32(18,bytes.length,true);l.setUint32(22,bytes.length,true);l.setUint16(26,name.length,true);local.set(name,30);
 const central=new Uint8Array(46+name.length),c=new DataView(central.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,sum,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,this.offset,true);central.set(name,46);this.parts.push(local,bytes.slice().buffer);this.directory.push(central);this.offset+=local.length+bytes.length;}
 blob(){const size=this.directory.reduce((s,r)=>s+r.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,this.directory.length,true);v.setUint16(10,this.directory.length,true);v.setUint32(12,size,true);v.setUint32(16,this.offset,true);return new Blob([...this.parts,...this.directory.map(r=>r.slice().buffer),end.buffer],{type:'application/zip'});}
}
