export const debugResources={families:'Configuration · Product families',productLines:'Configuration · Product lines',models:'Configuration · Models',model:'Configuration · Model details',configAttributes:'Configuration · Model attributes',configArrays:'Configuration · Model array sets',layoutAttributes:'Configuration · Layout attributes',libraries:'BML · Library functions',deployed:'BML · Deployed library functions',folders:'BML · Library folders',library:'BML · Function source and references'};
export function debugPath(kind,c){
 if(!/^v\d+$/.test(c.version))throw Error('Use an API version such as v19.');
 const segment=k=>{if(!/^[A-Za-z0-9_-]+$/.test(c[k]||''))throw Error('Enter '+k+' using its exact CPQ variable name.');return c[k];};
 const base='/rest/'+c.version;
 if(kind==='library'){const name=c.functionName||'';if(!/^[\w-]+\.[\w-]+$/.test(name))throw Error('Enter the exact namespace.variableName, such as util.myFunction.');return base+'/bml/library/functions/'+name;}
 const fixed={libraries:'/bml/library/functions',deployed:'/bml/deployed/library/functions',folders:'/bml/library/folders',families:'/productFamilies'};
 if(fixed[kind])return base+fixed[kind];
 const family=segment('family');if(kind==='productLines')return base+'/productFamilies/'+family+'/productLines';
 const line=segment('productLine'),prefix=base+'/productFamilies/'+family+'/productLines/'+line+'/models';if(kind==='models')return prefix;
 const model=segment('model');if(kind==='layoutAttributes')return base+'/layoutCache/'+family+'/'+line+'/'+model+'/attributes';
 const suffix={model:'',configAttributes:'/attributes',configArrays:'/arraySets'}[kind];if(suffix===undefined)throw Error('Unknown debug resource.');return prefix+'/'+model+suffix;
}
export function codeLines(source,query=''){return String(source).split(/\r?\n/).map((code,i)=>({line:i+1,code})).filter(r=>r.code.toLowerCase().includes(query.toLowerCase()));}
export function sourceReferences(source){
 // Lexical hints only: mask quoted strings and comments while preserving line numbers.
 let masked='',mode='code',quote='';for(let i=0;i<source.length;i++){const c=source[i],n=source[i+1];if(mode==='line'){if(c==='\n'){mode='code';masked+='\n';}else masked+=' ';continue;}if(mode==='block'){if(c==='*'&&n==='/'){masked+='  ';i++;mode='code';}else masked+=c==='\n'?'\n':' ';continue;}if(mode==='string'){if(c==='\\'){masked+='  ';i++;}else if(c===quote){mode='code';masked+=' ';}else masked+=c==='\n'?'\n':' ';continue;}if(c==='/'&&n==='/'){mode='line';masked+='  ';i++;}else if(c==='/'&&n==='*'){mode='block';masked+='  ';i++;}else if(c==='"'||c==="'"){mode='string';quote=c;masked+=' ';}else masked+=c;}
 const out=[];let cursor=0,line=1;for(const m of masked.matchAll(/\b([A-Za-z_]\w*\.[A-Za-z_]\w*)\s*\(/g)){for(;cursor<m.index;cursor++)if(masked[cursor]==='\n')line++;out.push({reference:m[1],line});}return out;
}
