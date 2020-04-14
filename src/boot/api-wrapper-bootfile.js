// import api from '../wrapper/APIWrapper'
import api from 'api-client-wrapper'

export default async ({ Vue, store }) => {
    api.setStore(store)

    Vue.prototype.$api = api;
  }