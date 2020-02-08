import api from '../wrapper/APIWrapper'

export default async ({ Vue }) => {
    Vue.prototype.$api = api;
  }