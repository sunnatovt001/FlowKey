export const MAX_AVATAR_BYTES=128*1024;
export async function avatarUpload(req:Request){
 if(Number(req.headers.get('content-length'))>MAX_AVATAR_BYTES)throw new Error('Rasm 128 KB dan oshmasin.');
 const reader=req.body?.getReader();if(!reader)throw new Error('Rasm tanlanmagan.');
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_AVATAR_BYTES){await reader.cancel();throw new Error('Rasm 128 KB dan oshmasin.');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 const type=req.headers.get('content-type');
 const valid=type==='image/png'?bytes.length>8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b):type==='image/jpeg'?bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255:type==='image/webp'?bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP':false;
 if(!valid)throw new Error('JPG, PNG yoki WebP rasm tanlang.');return {bytes,type:type!};
}
