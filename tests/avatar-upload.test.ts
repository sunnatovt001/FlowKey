import test from "node:test";
import assert from "node:assert/strict";
import {avatarUpload,MAX_AVATAR_BYTES} from "../shared/avatar-upload";
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64');
const request=(body:Uint8Array|string,type:string)=>new Request('http://localhost/api/profile/avatar',{method:'POST',headers:{'Content-Type':type},body:typeof body==='string'?body:new Uint8Array(body).buffer});
test('avatar accepts a bounded PNG and preserves its content type',async()=>{const image=await avatarUpload(request(png,'image/png'));assert.equal(image.type,'image/png');assert.deepEqual(Buffer.from(image.bytes),png);});
test('avatar rejects SVG and disguised non-image uploads',async()=>{await assert.rejects(avatarUpload(request('<svg/>','image/svg+xml')),/JPG/);await assert.rejects(avatarUpload(request('<script>alert(1)</script>','image/png')),/JPG/);});
test('avatar enforces the streamed size limit without Content-Length',async()=>{await assert.rejects(avatarUpload(request(new Uint8Array(MAX_AVATAR_BYTES+1),'image/png')),/128 KB/);});

