export function environmentUrl(raw){const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw new Error('Use an HTTPS site URL without credentials, query parameters or fragments.');return u.origin;}
export function jsonDiff(a,b,path='$',out=[]){if(Object.is(a,b))return out;if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){for(const k of new Set([...Object.keys(a),...Object.keys(b)])){const p=path+'['+JSON.stringify(k)+']';if(!Object.hasOwn(a,k))out.push({path:p,change:'added',after:b[k]});else if(!Object.hasOwn(b,k))out.push({path:p,change:'removed',before:a[k]});else jsonDiff(a[k],b[k],p,out);}}else out.push({path,change:'changed',before:a,after:b});return out;}
export const docs=[
['BML overview','Language foundations for business logic in Configuration and Commerce.','BML','Content/BML/BMLOverview.htm'],
['BML function directory','Find built-in functions by name and category.','BML','Content/BML/FunctionsScripts/BMLFunctionsList.htm'],
['BMQL reference','Query data tables and understand query context and limitations.','BMQL','Content/BML/FunctionsScripts/BMQL.htm'],
['Function editor','Work with the Util Library editor and function properties.','BML','Content/BML/FunctionEditor/BML_Editor.htm'],
['Integration overview','Explore Oracle CPQ integration interfaces.','Integrations','Content/Integrating_With_BigMachines/Integration_Guides/Integration_Guide.htm'],
['Commerce integrations','Reference for integration types and Commerce setup.','Commerce','Content/Integrating_With_BigMachines/CommerceIntegrations/CommerceIntegrations.htm'],
['Pricing setup APIs','Documentation for pricing administration interfaces.','REST','Content/RestAPIs/cpqAPIs/pricingSetup.htm'],
['Transaction arrays in BML','Reference for working with transaction arrays.','Commerce','Content/Commerce_Process/Attributes/TransactionArrays/TransactionArraysBML.htm'],
['REST endpoint directory','Browse the official REST API endpoint catalog.','REST','https://docs.oracle.com/en/cloud/saas/configure-price-quote/cxcpq/rest-endpoints.html']
].map(([title,description,category,path])=>({title,description,category,url:path.startsWith('https:')?path:'https://help-cxsales.oraclecloud.com/cpq/'+path}));
