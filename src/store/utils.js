/**
 * combine two store modules and return the combination
 * @param {state, mutations, actions, getters} 
 * @param {state, mutations, actions, getters}
 */
export function combineModules({state = {}, mutations = {}, actions = {}, getters = {}} = {}, {state:state2 = {}, mutations:mutations2 = {}, actions:actions2 = {}, getters:getters2 = {}} = {}){

    state = Object.assign(Object.assign({},state),state2)
    mutations = Object.assign(Object.assign({},mutations), mutations2);
    actions = Object.assign(Object.assign({},actions), actions2);
    getters = Object.assign(Object.assign({},getters), getters2);
    
    return {state:state,mutations:mutations,actions:actions,getters:getters};
}