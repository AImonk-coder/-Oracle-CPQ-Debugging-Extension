const {getJSON}=require('./client.cjs');
exports.runConfiguration=async function(connection,config,{fetcher=fetch,confirm=async()=>false,stillConnected=()=>true}={}){
 const {runtimeRequest}=await import('./runtime-core.mjs');const req=runtimeRequest(config),url=new URL(connection.origin);
 if(url.protocol!=='https:'||url.origin!==connection.origin)throw Error('Invalid HTTPS tenant origin.');
 if(req.mutates&&!await confirm({origin:connection.origin,path:req.path,action:config.action,body:req.body}))return {cancelled:true};
 if(!stillConnected())throw Error('Connection changed before execution. Reconnect and retry.');
 const started=Date.now();let r;
 try{r=await fetcher(connection.origin+req.path,{method:'POST',redirect:'error',headers:{Authorization:connection.authorization,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(req.body),signal:AbortSignal.timeout(30000)});}catch(e){throw Error('Configuration request failed. '+(req.mutates?'The session may have changed; load the cache before retrying. ':'')+e.message);}
 if(!r.ok)throw Error('Configuration request returned HTTP '+r.status+'. Check authentication, permissions, model names and cache validity.');
 if(!r.headers.get('content-type')?.includes('json'))throw Error('Expected a JSON Configuration response.');
 const reader=r.body.getReader(),decoder=new TextDecoder();let text='',size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>5000000){await reader.cancel();throw Error('Configuration response exceeds 5 MB. Reduce criteria fields or child collections.');}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();
 const data=JSON.parse(text);let metadata=null,metadataError='';
 // A failed metadata read must not hide a successful runtime response.
 if(config.includeMetadata!==false){try{metadata=(await getJSON(connection.origin,req.metadataPath,connection.authorization,fetcher)).data;}catch(e){metadataError=e.message;}}
 return {data,metadata,metadataError,status:r.status,elapsedMs:Date.now()-started,path:req.path,origin:connection.origin};
};
