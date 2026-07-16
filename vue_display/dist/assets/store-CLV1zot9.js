import{at as r,l,s as p}from"./vue-core-agGEqk3H.js";/*!
 * pinia v3.0.2
 * (c) 2025 Eduardo San Martin Morote
 * @license MIT
 */const u=Symbol();var s;(function(t){t.direct="direct",t.patchObject="patch object",t.patchFunction="patch function"})(s||(s={}));function h(){const t=r(!0),o=t.run(()=>l({}));let c=[],n=[];const a=p({install(e){a._a=e,e.provide(u,a),e.config.globalProperties.$pinia=a,n.forEach(i=>c.push(i)),n=[]},use(e){return this._a?c.push(e):n.push(e),this},_p:c,_a:null,_e:t,_s:new Map,state:o});return a}export{h as c};
