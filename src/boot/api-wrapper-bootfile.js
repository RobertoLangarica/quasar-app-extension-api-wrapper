import api from '../wrapper/APIWrapper'
import api_state from '../store/WrapperState'

export default async ({ Vue, store }) => {
    api.store = (store !== undefined && store !== null) ? store:undefined;

    if(api.store){
      api.store.registerModule('api-wrapper',api_state);
    }

    Vue.prototype.$api = api;
  }