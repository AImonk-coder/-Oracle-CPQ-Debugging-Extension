const vscode=require('vscode'),fs=require('fs'),crypto=require('crypto');
const {getJSON,getToolkitArchive}=require('./client.cjs');
const {runConfiguration}=require('./runtime-client.cjs');
let panel,connection=null;
function activate(context){
 const forget=async()=>{connection=null;await context.secrets.delete('cpqAuth');await context.globalState.update('cpqOrigin',undefined);if(panel)panel.webview.postMessage({event:'disconnected'});};
 context.subscriptions.push(vscode.commands.registerCommand('ibits.disconnect',async()=>{await forget();vscode.window.showInformationMessage('IBITS: CPQ credentials removed.');}));
 async function connect(){
 const {environmentUrl}=await import('./core.mjs');
 const raw=await vscode.window.showInputBox({title:'IBITS · CPQ tenant',prompt:'HTTPS origin of your Oracle CPQ tenant',value:context.globalState.get('cpqOrigin',''),ignoreFocusOut:true,validateInput:v=>{try{environmentUrl(v);}catch(e){return e.message;}}});if(raw===undefined)throw Error('Connection cancelled.');
 const origin=environmentUrl(raw);let authorization;
 const saved=origin===context.globalState.get('cpqOrigin')?await context.secrets.get('cpqAuth'):undefined;
 const mode=await vscode.window.showQuickPick([...(saved?['Use saved credentials']:[]),'Bearer token','Basic authentication'],{title:'IBITS · REST authentication',placeHolder:'Choose a method supported by your CPQ tenant'});if(!mode)throw Error('Connection cancelled.');
 if(mode==='Use saved credentials')authorization=saved;
 else if(mode==='Bearer token'){const token=await vscode.window.showInputBox({title:'IBITS · Bearer token',password:true,ignoreFocusOut:true,validateInput:v=>!v.trim()||/[\r\n]/.test(v)?'Enter a non-empty token without line breaks.':undefined});if(token===undefined)throw Error('Connection cancelled.');authorization='Bearer '+token.trim();}
 else {const username=await vscode.window.showInputBox({title:'IBITS · REST username',ignoreFocusOut:true,validateInput:v=>!v||/[:\r\n]/.test(v)?'Enter a username without colons or line breaks.':undefined});if(username===undefined)throw Error('Connection cancelled.');const password=await vscode.window.showInputBox({title:'IBITS · REST password',password:true,ignoreFocusOut:true,validateInput:v=>v?'':'Password is required.'});if(password===undefined)throw Error('Connection cancelled.');authorization='Basic '+Buffer.from(username+':'+password).toString('base64');}
 if(mode!=='Use saved credentials'){const save=await vscode.window.showQuickPick(['Use for this session only','Save in VS Code SecretStorage'],{title:'IBITS · Credential storage'});if(!save)throw Error('Connection cancelled.');await context.secrets.delete('cpqAuth');if(save==='Save in VS Code SecretStorage')await context.secrets.store('cpqAuth',authorization);}
 await context.globalState.update('cpqOrigin',origin);connection={origin,authorization};return {origin};
 }
 async function open(){if(panel){panel.reveal();return;}panel=vscode.window.createWebviewPanel('ibits','IBITS CPQ Workbench',vscode.ViewColumn.One,{enableScripts:true,retainContextWhenHidden:true,localResourceRoots:[vscode.Uri.joinPath(context.extensionUri,'media')]});
 const current=panel,nonce=crypto.randomBytes(18).toString('base64');
 const resource=name=>current.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri,'media',name)).toString();
 let html=fs.readFileSync(vscode.Uri.joinPath(context.extensionUri,'media','index.html').fsPath,'utf8');
 html=html.replace('<!--CSP-->',`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${current.webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${current.webview.cspSource} data:;">`).replace('href="style.css"',`href="${resource('style.css')}"`).replace('src="app.js"',`nonce="${nonce}" src="${resource('app.js')}"`);current.webview.html=html;
 current.onDidDispose(()=>{panel=undefined;},null,context.subscriptions);
 current.webview.onDidReceiveMessage(async m=>{if(!m||!Number.isSafeInteger(m.id)||typeof m.type!=='string')return;try{let value;switch(m.type){
 case 'load':value=context.globalState.get('workbench',{envs:[],snippets:[]});break;
 case 'save':if(!Array.isArray(m.value?.envs)||!Array.isArray(m.value?.snippets)||JSON.stringify(m.value).length>2000000)throw Error('Invalid or oversized workspace data.');for(const e of m.value.envs){const {environmentUrl}=await import('./core.mjs');environmentUrl(e.url);}await context.globalState.update('workbench',m.value);value=true;break;
 case 'connect':value=await connect();break;
 case 'disconnect':await forget();value=true;break;
 case 'get':if(!connection)throw Error('Connect to a CPQ tenant first.');if(m.origin!==connection.origin)throw Error('Connection changed. Reconnect before retrieving.');value=await getJSON(connection.origin,m.path,connection.authorization);break;
 case 'runtime':if(!connection||m.origin!==connection.origin)throw Error('Connect this runtime panel to the current tenant first.');if(!m.config||typeof m.config!=='object'||JSON.stringify(m.config).length>1000000)throw Error('Invalid or oversized runtime settings.');const runtimeConnection=connection;value=await runConfiguration(runtimeConnection,m.config,{stillConnected:()=>connection===runtimeConnection,confirm:async req=>(await vscode.window.showWarningMessage('Execute Configuration logic on '+req.origin+'?',{modal:true,detail:req.path+'\n\n'+(req.action==='_configure'?'Creates a test configuration session.':'Changes the specified configuration cache.')+' Tenant rules will execute and may trigger integrations or other side effects. Review the request preview in the workbench before continuing.'},'Execute'))==='Execute'});break;
 case 'toolkit':if(!connection||m.origin!==connection.origin)throw Error('Connect the current tenant in the lab first.');const archiveConnection={...connection};const archivePath=await vscode.window.showSaveDialog({saveLabel:'Download Commerce BML archive',filters:{'ZIP archive':['zip']}});value=false;if(archivePath){const archive=await getToolkitArchive(archiveConnection.origin,m.version,archiveConnection.authorization);await vscode.workspace.fs.writeFile(archivePath,archive);value=true;}break;
 case 'importSource':const selected=await vscode.window.showOpenDialog({title:'Choose rule or BML source files',canSelectMany:true,filters:{'CPQ source':['bml','bmlt','txt','json','xml','js']}});value=[];if(selected){if(selected.length>30)throw Error('Select at most 30 source files.');let total=0;for(const file of selected){const stat=await vscode.workspace.fs.stat(file);if(total+stat.size>2000000)throw Error('Selected source files exceed 2 MB.');const bytes=await vscode.workspace.fs.readFile(file);total+=bytes.byteLength;if(total>2000000)throw Error('Selected source files exceed 2 MB.');value.push({name:file.path.split('/').pop(),text:Buffer.from(bytes).toString('utf8')});}}break;
 case 'openSource':if(typeof m.text!=='string'||m.text.length>2000000)throw Error('Source exceeds 2 MB.');const doc=await vscode.workspace.openTextDocument({content:m.text,language:'plaintext'});await vscode.window.showTextDocument(doc,{preview:false});value=true;break;
 case 'copy':if(typeof m.text!=='string'||m.text.length>5000000)throw Error('Invalid clipboard text.');await vscode.env.clipboard.writeText(m.text);value=true;break;
 case 'export':if(typeof m.text!=='string'||m.text.length>10000000)throw Error('Export exceeds 10 MB.');const destination=await vscode.window.showSaveDialog({defaultUri:vscode.Uri.file(m.name==='cpq-filtered.csv'?'cpq-filtered.csv':'cpq-response.json'),filters:{'Data files':['json','csv']}});if(destination)await vscode.workspace.fs.writeFile(destination,Buffer.from(m.text));value=!!destination;break;
 case 'open':const u=new URL(m.url);if(u.protocol!=='https:'||u.username||u.password)throw Error('Only HTTPS links without embedded credentials can be opened.');value=await vscode.env.openExternal(vscode.Uri.parse(u.href));break;
 default:throw Error('Unsupported request.');}
 current.webview.postMessage({id:m.id,value});}catch(e){current.webview.postMessage({id:m.id,error:e.message});}},null,context.subscriptions);
 }
 context.subscriptions.push(vscode.commands.registerCommand('ibits.open',open));
}
exports.activate=activate;exports.deactivate=()=>{connection=null;};
