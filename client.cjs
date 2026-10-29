exports.getJSON=async function(origin,path,authorization,fetcher=fetch){
 const {validatePath}=await import('./rest-core.mjs');validatePath(path);
 const u=new URL(origin);if(u.protocol!=='https:'||u.origin!==origin)throw Error('An HTTPS tenant origin is required.');
 const response=await fetcher(origin+path,{method:'GET',redirect:'error',headers:{Accept:'application/json',Authorization:authorization},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`HTTP ${response.status}. ${response.status===401?'Reconnect with valid REST credentials.':response.status===403?'Your account cannot access this resource.':response.status===404?'Check version, variable names and endpoint availability.':'The tenant rejected the request.'}`);
 if(!response.headers.get('content-type')?.includes('json'))throw Error('The endpoint returned a non-JSON response. Check tenant REST authentication.');
 let text='',size=0;const reader=response.body.getReader(),decoder=new TextDecoder();
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>5000000){await reader.cancel();throw Error('Response exceeds 5 MB. Reduce the page size.');}text+=decoder.decode(value,{stream:true});}
 text+=decoder.decode();return {ok:true,status:response.status,data:JSON.parse(text)};
};
exports.getToolkitArchive=async function(origin,version,authorization,fetcher=fetch){
 if(!/^v\d+$/.test(version)||new URL(origin).origin!==origin||!origin.startsWith('https://'))throw Error('Invalid tenant or API version.');
 const r=await fetcher(origin+'/rest/'+version+'/adminMeta',{method:'GET',redirect:'error',headers:{Accept:'application/zip',Authorization:authorization},signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error('Toolkit download failed: HTTP '+r.status);
 if(!/application\/(zip|octet-stream|x-zip-compressed)/i.test(r.headers.get('content-type')||''))throw Error('Expected an archive, not a login or JSON response.');
 const reader=r.body.getReader(),chunks=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>50000000){await reader.cancel();throw Error('Toolkit archive exceeds 50 MB. Use Oracle Developer Toolkit directly.');}chunks.push(Buffer.from(value));}
 const zip=Buffer.concat(chunks);if(zip[0]!==0x50||zip[1]!==0x4b)throw Error('Response is not a ZIP archive.');return zip;
};
