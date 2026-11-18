import test from 'node:test';import assert from 'node:assert/strict';
import {nextIncident,markSent} from '../ops/reliability/incident.mjs';
test('monitor waits for confirmation, retries unsent alerts, suppresses repeats and sends recovery once',()=>{
 let {state,kind}=nextIncident({},true,1000);assert.equal(kind,null);
 ({state,kind}=nextIncident(state,true,2000));assert.equal(kind,'failure');
 ({state,kind}=nextIncident(state,true,3000));assert.equal(kind,'failure');
 state=markSent(state,kind,3000);
 ({state,kind}=nextIncident(state,true,4000));assert.equal(kind,null);
 ({state,kind}=nextIncident(state,true,3603000));assert.equal(kind,'failure');
 state=markSent(state,kind,3603000);
 ({state,kind}=nextIncident(state,false,3604000));assert.equal(kind,'recovery');
 state=markSent(state,kind,3604000);
 ({state,kind}=nextIncident(state,false,3605000));assert.equal(kind,null);assert.equal(state.failures,0);
});
