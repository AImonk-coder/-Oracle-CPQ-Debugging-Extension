export const runtimeActions={_loadData:'Load cached configuration',_configure:'Start test configuration',_update:'Run Configuration rules'};
export function runtimeRequest(c){
 const part=k=>{if(!/^[\w-]+$/.test(c[k]||''))throw Error('Enter the exact '+k+' variable name.');return c[k];};
 if(!/^v\d+$/.test(c.version||''))throw Error('Use a version such as v19.');
 if(!Object.hasOwn(runtimeActions,c.action))throw Error('Unsupported Configuration runtime action.');
 const family=part('family'),line=part('productLine'),model=part('model');
 const object=(v,label)=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error(label+' must be a JSON object.');return v;};
 const body={criteria:{...object(c.criteria??{},'Criteria'),state:true}};
 if(c.action==='_configure')body.cacheInstanceId='-1';
 else {if(typeof c.cacheInstanceId!=='string'||!c.cacheInstanceId.trim()||c.cacheInstanceId==='-1'||c.cacheInstanceId.length>4096||/[\r\n]/.test(c.cacheInstanceId))throw Error('Enter a valid cacheInstanceId, or start a test configuration first.');body.cacheInstanceId=c.cacheInstanceId;}
 if(c.action!=='_loadData')body.configData=object(c.configData??{},'Configuration inputs');
 if(JSON.stringify(body).length>500000)throw Error('Request exceeds 500 KB. Narrow the inputs and criteria.');
 return {path:'/rest/'+c.version+'/config'+family+'.'+line+'.'+model+'/actions/'+c.action,body,metadataPath:'/rest/'+c.version+'/productFamilies/'+family+'/productLines/'+line+'/models/'+model+'/attributes',mutates:c.action!=='_loadData'};
}
export function runtimeRows(response,metadata){
 const items=Array.isArray(metadata?.items)?metadata.items:[],meta=new Map(items.filter(x=>x&&typeof x.variableName==='string').map(x=>[x.variableName,x]));
 const rows=[];const own=(o,k)=>o!=null&&Object.hasOwn(o,k);const text=v=>v==null?'':typeof v==='object'?JSON.stringify(v):String(v);
 function visit(node,path,depth){if(!node||typeof node!=='object'||depth>12||rows.length>=5000)return;const state=node._state||{};
 if(path==='$')rows.push({path,kind:'Configuration',variable:'(configuration)',value:undefined,...flags(state),state});
 for(const [key,a] of Object.entries(state.actions||{})){if(rows.length>=5000)break;rows.push({path:path+'._state.actions['+JSON.stringify(key)+']',kind:'Action',variable:key,value:undefined,...flags(a),state:a});}
 const keys=new Set([...Object.keys(node),...Object.keys(state.attributes||{})]);
 for(const key of keys){if(rows.length>=5000)break;if(['_state','links','cacheInstanceId'].includes(key))continue;const v=node[key];const attributeState=state.attributes?.[key]??v?._state??{};const def=path==='$'?meta.get(key):undefined;const val=own(v,'value')?v.value:v;const current=path+'['+JSON.stringify(key)+']';
 rows.push({path:current,kind:'Attribute',variable:key,label:def?.label??def?.name??'',type:text(def?.type?.displayValue??def?.type??(val===null?'null':Array.isArray(val)?'array':typeof val)),value:val,displayValue:v?.displayValue,...flags(attributeState),state:attributeState,metadata:def});
 if(v&&typeof v==='object'&&Array.isArray(v.items))v.items.forEach((item,i)=>visit(item,current+'.items['+i+']',depth+1));
 }
 }
 function flags(s){return {required:s.required,visible:s.visible,hidden:s.hidden,updatable:s.updatable,enabled:s.enabled,hasError:s.hasError,hasWarning:s.hasWarning,messages:s.messages};}
 visit(response?.configData??{},'$',0);return rows;
}
export function compareRuntime(previous,current){const before=new Map(previous.map(r=>[r.path,r])),after=new Map(current.map(r=>[r.path,r])),out=[];
 for(const p of new Set([...before.keys(),...after.keys()])){const a=before.get(p),b=after.get(p);if(!a||!b){out.push({path:p,change:a?'Removed':'Added',before:a,after:b});continue;}const relevant=r=>({value:r.value,state:r.state,displayValue:r.displayValue});if(JSON.stringify(relevant(a))!==JSON.stringify(relevant(b)))out.push({path:p,change:'Changed',before:relevant(a),after:relevant(b)});}return out;
}
