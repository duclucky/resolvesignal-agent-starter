#!/usr/bin/env node
// Agent Starter: deterministic pay-per-call client. No autonomous action execution.
import {createHash,randomBytes} from "node:crypto";
import {mkdir,open,readFile,lstat,unlink,rename} from "node:fs/promises";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";

const here=dirname(fileURLToPath(import.meta.url));
const address=v=>typeof v==="string" && /^0x[0-9a-fA-F]{40}$/.test(v) && !/^0x0{40}$/i.test(v);
const hash=v=>typeof v==="string" && /^0x[0-9a-f]{64}$/.test(v);
const digest=bytes=>createHash("sha256").update(bytes).digest("hex");
const json=value=>JSON.stringify(value,null,2)+"\n";
const readJson=async path=>JSON.parse(await readFile(path,"utf8"));
export const EXAMPLES=["delivery-unknown","review-proposal"];
export const MAX_FEE_ATOMIC=60_000n;

async function privateWrite(path,bytes){
 const file=await open(path,"wx",0o600);
 try{await file.writeFile(bytes);await file.sync();}finally{await file.close();}
}
async function plainFile(path){
 const state=await lstat(path);
 if(state.isSymbolicLink() || !state.isFile())throw Error("starter_private_file_required");
}
function hasBlank(value){
 if(typeof value==="string")return !value.trim();
 if(Array.isArray(value))return value.some(hasBlank);
 if(value && typeof value==="object")return Object.entries(value).some(([k,v])=>!k.trim() || hasBlank(v));
 return false;
}
export function validateRequest(request){
 if(!request || typeof request!=="object" || Array.isArray(request) || hasBlank(request))throw Error("starter_request_invalid");
 for(const key of ["objective","current_state","observations","policy","capabilities","facts","previous_attempts","observed_at","locale"]){
  if(request[key]===undefined)throw Error("starter_request_missing_"+key);
 }
 if(request.current_state?.status!=="provided" || !Array.isArray(request.observations) || !request.observations.length ||
  !["en","vi"].includes(request.locale) || typeof request.observed_at!=="string" ||
  !/(Z|[+-]\d{2}:\d{2})$/.test(request.observed_at) || !Number.isFinite(Date.parse(request.observed_at)))throw Error("starter_request_invalid");
 // Lightweight local shape checks; the live API applies the authoritative full schema/admission.
 return request;
}
export function feeAtomic(value="0.06"){
 if(!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(value))throw Error("starter_fee_invalid");
 const [whole,fraction=""]=value.split(".");const amount=BigInt(whole)*1_000_000n+BigInt(fraction.padEnd(6,"0"));
 if(amount<=0n || amount>MAX_FEE_ATOMIC)throw Error("starter_fee_cap_exceeds_006");return amount;
}
export async function createTask({directory,payer,requestPath,example,maxFee="0.06",now=()=>new Date()}){
 if(!address(payer))throw Error("starter_payer_required");
 if(Boolean(requestPath)===Boolean(example))throw Error("starter_choose_one_input");
 if(example && !EXAMPLES.includes(example))throw Error("starter_unknown_example");
 const cap=feeAtomic(maxFee);
 const request=await readJson(requestPath??join(here,"examples",example+".json"));
 if(example)request.observed_at=now().toISOString(); // Synthetic scenario creation only; never refresh real evidence.
 validateRequest(request);
 const bytes=json(request),target=resolve(directory);
 await mkdir(dirname(target),{recursive:true,mode:0o700});
 await mkdir(target,{mode:0o700}); // Existing directory means an existing operation: never overwrite it.
 const task={version:1,chainId:5042,payer,operationId:"0x"+randomBytes(32).toString("hex"),salt:"0x"+randomBytes(32).toString("hex"),
  maxFeeAtomic:String(cap),requestSha256:digest(bytes),synthetic:Boolean(example),createdAt:now().toISOString()};
 await privateWrite(join(target,"request.json"),bytes);
 await privateWrite(join(target,"task.json"),json(task));
 return {directory:target,payer,synthetic:task.synthetic,maxFeeUSDC:`${cap/1_000_000n}.${String(cap%1_000_000n).padStart(6,"0")}`,operationId:task.operationId};
}
export async function loadTask(directory){
 const target=resolve(directory),state=await lstat(target);
 if(state.isSymbolicLink() || !state.isDirectory())throw Error("starter_private_task_directory_required");
 await plainFile(join(target,"task.json"));await plainFile(join(target,"request.json"));
 const task=await readJson(join(target,"task.json")),bytes=await readFile(join(target,"request.json"));
 if(task.version!==1 || task.chainId!==5042 || !address(task.payer) || !hash(task.operationId) || !hash(task.salt) ||
  typeof task.maxFeeAtomic!=="string" || !/^[1-9][0-9]*$/.test(task.maxFeeAtomic) || BigInt(task.maxFeeAtomic)>MAX_FEE_ATOMIC ||
  typeof task.synthetic!=="boolean" || task.requestSha256!==digest(bytes))throw Error("starter_task_binding_invalid");
 return {directory:target,task,request:validateRequest(JSON.parse(bytes))};
}
async function liveSession(loaded){
 const [{ResolveSignalX402Session},{CircleCliResolveSignalWallet,FileResolveSignalSessionStore},{createPublicClient,http}]=await Promise.all([
  import("@agent-commitments/sdk"),import("@agent-commitments/sdk/resolvesignal-node"),import("viem")]);
 const wallet=new CircleCliResolveSignalWallet();
 return new ResolveSignalX402Session({payer:loaded.task.payer,operationId:loaded.task.operationId,wallet,
  store:new FileResolveSignalSessionStore(join(loaded.directory,"recovery")),reader:createPublicClient({transport:http("https://rpc.mainnet.arc.io")})});
}
export async function performCall(directory,{confirmed=false,resumeQuote=false,createSession=liveSession}={}){
 if(!confirmed)throw Error("starter_paid_call_requires_confirm_paid_call");
 const loaded=await loadTask(directory);
 const lock=await open(join(loaded.directory,"call.lock"),"wx",0o600);
 let resultFile;
 try{
  // Reserve the result sink before using the wallet. Persist output before any financial queries.
  resultFile=await open(join(loaded.directory,"result.pending.json"),"wx",0o600);
  try{await lstat(join(loaded.directory,"result.json"));throw Error("starter_result_already_exists");}
  catch(error){if(error.code!=="ENOENT")throw error;}
  const session=await createSession(loaded);
  const response=await session.call(loaded.request,{salt:loaded.task.salt,maxFeeAtomic:BigInt(loaded.task.maxFeeAtomic),confirmPaidCall:true,resumeQuote});
  await resultFile.writeFile(json(response));await resultFile.sync();await resultFile.close();resultFile=undefined;
  await rename(join(loaded.directory,"result.pending.json"),join(loaded.directory,"result.json"));
  return {saved:true,resultPath:join(loaded.directory,"result.json"),callId:response.call_id,status:response.status??"response_received",
   next:"Read the private result. Run recover to inspect settlement. Recommendation execution is your responsibility."};
 }finally{
  if(resultFile){await resultFile.close();await unlink(join(loaded.directory,"result.pending.json"));}
  await lock.close();await unlink(join(loaded.directory,"call.lock"));
 }
}
export async function recoverTask(directory,{createSession=liveSession}={}){
 const loaded=await loadTask(directory),result=await(await createSession(loaded)).recover();
 return {operationId:loaded.task.operationId,callId:result.callId,paymentAttempted:result.paymentAttempted,
  serviceStatus:result.service?.status,serviceHttpStatus:result.serviceHttpStatus,escrowStatus:result.escrow?.status,next:result.next,
  note:"Read-only status. A refund status is not proof that your wallet received funds; inspect Circle payment logs/token receipts."};
}
export async function doctor(payer,{fetcher=fetch}={}){
 if(payer!==undefined && !address(payer))throw Error("starter_payer_invalid");
 const get=async path=>{const r=await fetcher("https://resolvesignal.com"+path,{redirect:"error",signal:AbortSignal.timeout(20_000)});if(!r.ok)throw Error("starter_service_unavailable");return r.json();};
 const [health,form]=await Promise.all([get("/health"),get("/v2/form")]);
 if(health.status!=="ok" || form.mode!=="live" || String(form.protocol_version)!=="2" || form.payment_metadata?.backend!=="escrow_v3" || form.payment_metadata?.payer_control_proof_required!==true)throw Error("starter_service_protocol_changed");
 const [{verifyResolveSignalSeller,RESOLVESIGNAL_SELLER,RESOLVESIGNAL_USDC},{createPublicClient,http,parseAbi}]=await Promise.all([import("@agent-commitments/sdk"),import("viem")]);
 const reader=createPublicClient({transport:http("https://rpc.mainnet.arc.io")});
 await verifyResolveSignalSeller(reader,RESOLVESIGNAL_SELLER);
 let wallet={checked:false,note:"Pass --payer YOUR_CIRCLE_WALLET to check mainnet login, wallet ownership and USDC balance."};
 if(payer){
  const {CircleCliResolveSignalWallet}=await import("@agent-commitments/sdk/resolvesignal-node");
  await new CircleCliResolveSignalWallet().checkWallet(payer);
  const balance=await reader.readContract({address:RESOLVESIGNAL_USDC,abi:parseAbi(["function balanceOf(address) view returns(uint256)"]),functionName:"balanceOf",args:[payer]});
  wallet={checked:true,mainnetSessionReady:true,payer,balanceAtomic:String(balance),fundedFor006:balance>=MAX_FEE_ATOMIC};
 }
 return {ready:!payer || wallet.fundedFor006===true,mode:"read-only",chainId:5042,service:"https://resolvesignal.com",perCallCapUSDC:"0.060000",wallet,
  note:"No signature/payment. Funds and wallet policy are rechecked by Circle at payment; the admitted x402 quote is authoritative."};
}
export async function demo(){
 const request=await readJson(join(here,"examples","delivery-unknown.json"));
 return {mode:"offline-demo",synthetic:true,paid:false,walletUsed:false,
  objective:request.objective.statement,simulatedRecommendation:{action_id:"check_status",parameters:{order_ref:"ORDER-123"},
   reason:"A timeout does not establish final delivery. Read the authoritative status before considering a retry."},
  note:"Illustrative canned output, not an AI decision or evidence of a real call. No network, wallet, payment or action execution."};
}
function parse(argv){
 const [command,...rest]=argv;const options={};
 const allowed={demo:[],doctor:["payer"],init:["payer","task","example","request","max-fee"],call:["task","confirm-paid-call","resume-quote"],recover:["task"]};
 if(!allowed[command])throw Error("starter_usage: demo | doctor [--payer ADDRESS] | init --payer ADDRESS --task DIR --example delivery-unknown | call --task DIR --confirm-paid-call | recover --task DIR");
 for(let i=0;i<rest.length;i++){
  const key=rest[i]?.slice(2);
  if(!rest[i]?.startsWith("--") || !allowed[command].includes(key) || options[key]!==undefined)throw Error("starter_unknown_or_duplicate_option");
  if(["confirm-paid-call","resume-quote"].includes(key))options[key]=true;
  else{if(!rest[i+1] || rest[i+1].startsWith("--"))throw Error("starter_option_value_required");options[key]=rest[++i];}
 }
 return {command,options};
}
export async function main(argv,{emit=value=>console.log(json(value)),createSession=liveSession}={}){
 if(!argv.length || ["--help","help"].includes(argv[0]))return emit({name:"ResolveSignal Agent Starter",commands:{demo:"Offline, free illustration",doctor:"Read-only readiness; optional --payer ADDRESS",init:"--payer ADDRESS --task NEW_DIR --example delivery-unknown (or --request FILE)",call:"--task DIR --confirm-paid-call; can spend up to 0.06 USDC",recover:"--task DIR; read-only original operation"},documentation:"README.md"});
 const {command,options:o}=parse(argv);
 if(command==="demo")return emit(await demo());
 if(command==="doctor")return emit(await doctor(o.payer));
 if(typeof o.task!=="string")throw Error("starter_task_directory_required");
 if(command==="init")return emit(await createTask({directory:o.task,payer:o.payer,requestPath:o.request,example:o.example,maxFee:o["max-fee"]}));
 if(command==="call")return emit(await performCall(o.task,{confirmed:o["confirm-paid-call"]===true,resumeQuote:o["resume-quote"]===true,createSession}));
 return emit(await recoverTask(o.task,{createSession}));
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main(process.argv.slice(2)).catch(error=>{
  let code=typeof error.message==="string" && /^(starter_|resolvesignal_)[a-z0-9_]+$/.test(error.message)?error.message:"starter_operation_failed_use_recover";
  if(error.code==="ERR_MODULE_NOT_FOUND")code="starter_dependencies_missing";
  if(error.code==="EEXIST")code="starter_existing_task_lock_or_pending_output";
  const help={
   starter_dependencies_missing:"Run npm ci --ignore-scripts from the cloned starter directory.",
   starter_paid_call_requires_confirm_paid_call:"A call can spend up to 0.06 USDC. Add --confirm-paid-call only when you authorize that purchase.",
   starter_existing_task_lock_or_pending_output:"The task, active lock or pending output already exists. Preserve it and inspect the original operation; do not create a replacement task as a payment retry.",
   starter_task_binding_invalid:"Prepared input or task metadata changed. Preserve the original task and investigate before using the wallet.",
   resolvesignal_circle_cli_not_installed:"Install Circle CLI using its official instructions and authenticate your existing wallet separately.",
   resolvesignal_circle_mainnet_session_required:"Your Circle mainnet session is missing or expired. Complete Circle login directly; the starter never accepts terms or handles OTPs.",
   resolvesignal_circle_wallet_not_in_session:"The configured payer is not in the current mainnet agent-wallet session. Check circle wallet list --chain ARC --type agent.",
  };
  console.error(json({ok:false,code,message:help[code]??"The operation could not be verified or completed.",next:"For a paid-call interruption run recover on the same task directory. Never create a new task as a retry. See README for setup and recovery."}));process.exitCode=1;
 });
}
