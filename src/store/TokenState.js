export default{
    state:{
        token:null,
        type:'' // Token type (Bearer and)
    },
    mutations:{
        setToken(state, value){
            state.token = value;
        },
        setTokenType(state, value){
            state.type = value;
        },
    }
}