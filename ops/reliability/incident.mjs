export function nextIncident(previous={},failed,now=Date.now()){
 const state={failures:0,alerted:false,lastSent:0,...previous};
 if(failed){state.failures++;return {state,kind:state.failures>=2&&(!state.alerted||now-state.lastSent>=3600000)?'failure':null};}
 state.failures=0;return {state,kind:state.alerted?'recovery':null};
}
export function markSent(state,kind,now=Date.now()){return {...state,alerted:kind==='failure',lastSent:now};}
