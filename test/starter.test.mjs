import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,writeFile,rm,open,unlink} from "node:fs/promises";
import {tmpdir} from "node:os";
import {resolve,join,sep} from "node:path";
import {createTask,loadTask,performCall,recoverTask,main,demo,feeAtomic} from "../starter.mjs";
const payer="0x1111111111111111111111111111111111111111";
async function fixture(fn){
 const base=resolve(tmpdir()),root=await mkdtemp(join(base,"agent-starter-"));
 try{await fn(root);}finally{assert.ok(resolve(root).startsWith(base+sep));await rm(root,{recursive:true,force:true});}
}
const prepare=directory=>createTask({directory,payer,example:"delivery-unknown",now:()=>new Date("2026-10-16T01:00:00Z")});
test("offline demo requires no wallet, network or SDK import",async()=>{
 const original=globalThis.fetch;globalThis.fetch=()=>{throw Error("Network must not be used");};
 try{const result=await demo();assert.equal(result.mode,"offline-demo");assert.equal(result.paid,false);assert.equal(result.walletUsed,false);}
 finally{globalThis.fetch=original;}
});
test("initialization persists a stable operation and refuses overwrite",()=>fixture(async root=>{
 const target=join(root,"task");await prepare(target);const {task,request}=await loadTask(target);
 assert.equal(task.maxFeeAtomic,"60000");assert.equal(task.synthetic,true);assert.equal(request.observed_at,"2026-10-16T01:00:00.000Z");
 assert.match(task.operationId,/^0x[0-9a-f]{64}$/);
 await assert.rejects(prepare(target),{code:"EEXIST"});assert.equal((await loadTask(target)).task.operationId,task.operationId);
}));
test("real evidence timestamps are never refreshed",()=>fixture(async root=>{
 const target=join(root,"real"),sample=join(root,"input.json");
 const initialized=join(root,"example");await prepare(initialized);
 const {request}=await loadTask(initialized);request.observed_at="2020-01-01T00:00:00Z";await writeFile(sample,JSON.stringify(request));
 await createTask({directory:target,payer,requestPath:sample});
 assert.equal((await loadTask(target)).request.observed_at,"2020-01-01T00:00:00Z");
 assert.equal((await loadTask(target)).task.synthetic,false);
}));
test("changed frozen input fails before any wallet call",()=>fixture(async root=>{
 await prepare(root+"/task");const file=join(root,"task/request.json");const body=JSON.parse(await readFile(file,"utf8"));body.current_state.content="changed";
 await writeFile(file,JSON.stringify(body));let count=0;
 await assert.rejects(performCall(root+"/task",{confirmed:true,createSession:async()=>{count++;}}),/task_binding_invalid/);assert.equal(count,0);
}));
test("a missing payment confirmation prevents all preparation and wallet use",()=>fixture(async root=>{
 let count=0;await assert.rejects(performCall(root,{createSession:async()=>{count++;}}),/requires_confirm_paid_call/);assert.equal(count,0);
}));
test("a live result is stored privately without a second status query",()=>fixture(async root=>{
 const dir=join(root,"task");await prepare(dir);let calls=0;
 const result=await performCall(dir,{confirmed:true,createSession:async()=>({call:async(request,opts)=>{
  calls++;assert.equal(opts.maxFeeAtomic,60000n);assert.equal(opts.confirmPaidCall,true);return {call_id:"call_local",result:{action_id:"check_status"}};
 },recover:()=>{throw Error("Do not let a status query discard business output");}})});
 assert.equal(result.saved,true);assert.equal(calls,1);assert.equal(JSON.parse(await readFile(result.resultPath,"utf8")).result.action_id,"check_status");
 await assert.rejects(performCall(dir,{confirmed:true,createSession:async()=>{calls++;}}),/result_already_exists/);assert.equal(calls,1);
}));
test("concurrent attempts cannot both invoke the paid session",()=>fixture(async root=>{
 const dir=join(root,"task");await prepare(dir);let calls=0;
 const options={confirmed:true,createSession:async()=>({call:async()=>{calls++;await new Promise(r=>setTimeout(r,20));return {call_id:"call_one"};}})};
 const results=await Promise.allSettled([performCall(dir,options),performCall(dir,options)]);
 assert.equal(results.filter(r=>r.status==="fulfilled").length,1);assert.equal(calls,1);
}));
test("an interruption keeps task identity and read-only recovery avoids result/key disclosure",()=>fixture(async root=>{
 const dir=join(root,"task");await prepare(dir);const before=(await loadTask(dir)).task;let paid=0;
 await assert.rejects(performCall(dir,{confirmed:true,createSession:async()=>({call:async()=>{paid++;throw Error("lost response");}})}),/lost response/);
 const recovered=await recoverTask(dir,{createSession:async loaded=>({recover:async()=>{
  assert.equal(loaded.task.operationId,before.operationId);return {callId:"call_old",paymentAttempted:true,service:{status:"response_sent",request_key:"secret",result:{private:true}},escrow:{status:1},next:"inspect"};
 }})});
 assert.equal(paid,1);assert.equal(recovered.serviceStatus,"response_sent");assert.ok(!JSON.stringify(recovered).includes("secret"));assert.ok(!JSON.stringify(recovered).includes("private"));
}));
test("a crash-held task lock fails closed",()=>fixture(async root=>{
 const dir=join(root,"task");await prepare(dir);const file=await open(join(dir,"call.lock"),"wx");await file.close();let count=0;
 await assert.rejects(performCall(dir,{confirmed:true,createSession:async()=>{count++;}}),{code:"EEXIST"});assert.equal(count,0);
 await unlink(join(dir,"call.lock"));
}));
test("caps are exact integer USDC values and cannot exceed 0.06",()=>{
 assert.equal(feeAtomic("0.06"),60000n);assert.equal(feeAtomic("0.000001"),1n);
 for(const value of ["0","-1","0.060001","1e-2","NaN","0.0000001"])assert.throws(()=>feeAtomic(value));
});
test("CLI rejects unknown commands and does not enable payment implicitly",async()=>{
 await assert.rejects(main(["call","--task","missing"]),/requires_confirm_paid_call/);
 await assert.rejects(main(["call","--task","x","--execute-actions"]),/unknown_or_duplicate_option/);
});
