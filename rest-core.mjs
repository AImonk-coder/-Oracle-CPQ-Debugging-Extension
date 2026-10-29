export const presets={attributes:'Attribute definitions',documents:'Document metadata',actions:'Action metadata',arrays:'Array set metadata',pricing:'Pricing rules',eligibility:'Eligibility rules',transaction:'Transaction data',lines:'Transaction lines',custom:'Custom REST GET'};
export function buildPath(kind,{version='v19',process='',document='',resource='',id='',line='',custom=''}={}){
 if(!/^v\d+$/.test(version))throw Error('API version must look like v19.');
 const part=(s,label)=>{if(!/^[\w-]+$/.test(s))throw Error(`Enter a valid ${label} (letters, digits, underscores or hyphens).`);return s;};
 const base='/rest/'+version;
 if(kind==='custom')return validatePath(custom);
 if(kind==='pricing')return base+'/pricingSetup/rules';
 if(kind==='eligibility')return base+'/eligibilityRule';
 if(['transaction','lines'].includes(kind)){const p=base+'/'+part(resource,'resourceVarName')+'/'+part(id,'transaction ID');return kind==='lines'?p+'/'+part(line,'sub-document variable name'):p;}
 const p=base+'/commerceProcesses/'+part(process,'process variable name')+'/documents';
 if(kind==='documents')return p;
 const d=p+'/'+part(document,'document variable name');
 const suffix={attributes:'attributes',actions:'actionDefs',arrays:'arraySets'}[kind];
 if(!suffix)throw Error('Unknown resource type.');return d+'/'+suffix;
}
export function validatePath(path){if(typeof path!=='string'||!/^\/rest\/v\d+\//.test(path)||/[\\#\s]/.test(path)||/%(?:2e|2f|5c)/i.test(path)||path.split('?')[0].split('/').some(p=>p==='.'||p==='..')||/\/actions(?:\/|\?|$)/i.test(path))throw Error('Use a relative /rest/v19/... read endpoint. Traversal, fragments and action calls are not allowed.');return path;}
export function nextPath(data,origin,current){const links=data?.links;const value=Array.isArray(links)?links.find(l=>l.rel==='next')?.href:links?.next?.href||links?.next;if(!value)return null;const u=new URL(value,new URL(current,origin));if(u.origin!==origin||u.username||u.password)throw Error('Pagination points outside the connected tenant.');return validatePath(u.pathname+u.search);}
export function records(data){if(Array.isArray(data))return data;if(Array.isArray(data?.items))return data.items;return data&&typeof data==='object'?Object.entries(data).map(([field,value])=>({field,value})): [{value:data}];}
export function cellText(v){if(v===undefined)return '';if(v===null)return 'null';return typeof v==='object'?JSON.stringify(v):String(v);}
export function csv(rows,columns){const quote=v=>'"'+cellText(v).replace(/^[\s]*[=+@-]/,m=>"'"+m).replace(/"/g,'""')+'"';return [columns.map(quote).join(','),...rows.map(r=>columns.map(c=>quote(r?.[c])).join(','))].join('\r\n');}
// Serialized by chrome.scripting: keep this function self-contained.
export async function tenantGet(expectedOrigin,path){
 try{
 if(location.origin!==expectedOrigin||location.protocol!=='https:')throw Error('The connected tab changed site. Reconnect on your CPQ tenant.');
 if(!/^\/rest\/v\d+\//.test(path)||/[\\#\s]/.test(path)||/%(?:2e|2f|5c)/i.test(path)||path.split('?')[0].split('/').some(p=>p==='.'||p==='..')||/\/actions(?:\/|\?|$)/i.test(path))throw Error('Invalid REST read path.');
 const response=await fetch(new URL(path,expectedOrigin).href,{method:'GET',credentials:'same-origin',redirect:'error',cache:'no-store',headers:{Accept:'application/json'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`HTTP ${response.status}. ${response.status===401?'Sign in to CPQ again.':response.status===403?'Your CPQ account cannot access this resource.':response.status===404?'Check API version, variable names and resource availability.':'The tenant rejected this request.'}`);
 if(!response.headers.get('content-type')?.includes('json'))throw Error('Expected JSON but received a login page or non-JSON response. Your tenant may require REST authentication beyond a browser session.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let text='',size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>5000000){await reader.cancel();throw Error('Response exceeds 5 MB. Narrow the query or reduce the page size.');}text+=decoder.decode(value,{stream:true});}
 text+=decoder.decode();return {ok:true,data:JSON.parse(text),status:response.status};
 }catch(e){return {ok:false,error:e.message};}
}
