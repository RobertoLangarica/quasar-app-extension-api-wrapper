import axios from 'axios';
import RequestObject from './RequestObject';

/**
 * Object retrieved with each call
 * {
 * success:Boolean true/false depending on result
 * attempts:Number of attepts to call this request
 * data:(Data retrieved from the endpoint if the call was successfull)
 * info:String Info if an error ocurred
 * error:Error an error if ocurred
 * }
 * 
 * NOTE: In the case of a Bulk Call the data is an array containing a response for each call
 */
export class APIWrapper {
    constructor({maxAttemptsPerCall = 1, 
                baseURL = '',
                contentType = 'application/json',
                timeout = 10000,
                authorization = '', 
                simultaneousCalls = 5,
                ...config}={}){

        this.maxAttemptsPerCall = maxAttemptsPerCall < 1 ? 1 : maxAttemptsPerCall;
        this.baseURL = baseURL;
        this._timeout = timeout < 0 ? 0:timeout;
        this.simultaneousCalls = simultaneousCalls <= 0 ? 1 : simultaneousCalls;
        /*
        baseURL is not send as default config to allow raw calls to custom URL's
        @see call method
        */
        this.axiosInstance = axios.create(Object.assign(config,{timeout:this._timeout}));
        
        this.setContentType(contentType);
        this.setAuthorization(authorization);

        this.pendingRequests = [];
        this.bulkRequests = [];
        this.executingRequests = [];

        /**Vuex */
        this.store = undefined;
        /********/
        this.uploading = false;
        this.downloading = false;
        this.working = false;
    }

    set timeout(value){
        this._timeout = value;

        if(this.axiosInstance){
            this.axiosInstance.defaults.timeout = value;
        }
    }

    get timeout(){
        return this._timeout;
    }

    createResponse({success = false, attempts = 0, data = {}, info = "", error = null, ...rest} = {}){
        return Object.assign({ success:success, attempts:attempts, data:data, info:info, error:error }, rest);
    }

    commit(commitType,value){
        if(this.store){
            this.store.commit(commitType,value);
        }
    }

    /**
     * 
     * @param {*} path 
     * @param {*} conf
     */
    get(path='', conf = {}){
        if(Array.isArray(path)){
            console.warn('It seems that you are providing an array of paths, try using bulkGet')
            path = '';
        }
        return this.call(Object.assign(conf,{method:'get',url:path}));
    }

    /**
     * 
     * @param {*} requests =[path:string] || [conf:{}]
     * @param {*} continueWithFailure:Boolean 
     *          false:The bulk call fails with the first request that fail. 
     *          true: The bulk call continue until each sub request is completed or failed.
     */
    bulkGet(requests = [],continueWithFailure = false, onProgress = null){return this.bulkDecorator(requests, continueWithFailure, onProgress, 'get');}


    /**
     * 
     * @param {*} path 
     * @param {*} data 
     * @param {*} conf 
     */
    post(path='', data = {}, conf = {}){
        if(Array.isArray(path)){
            console.warn('It seems that you are providing an array of paths, try using bulkPost')
            path = '';
        }
        return this.call(Object.assign(conf,{method:'post',url:path, data:data}));
    }

    /**
     * 
     * @param {*} requests =[path:string] || [conf:{}]
     * @param {*} continueWithFailure:Boolean 
     *          false:The bulk call fails with the first request that fail. 
     *          true: The bulk call continue until each sub request is completed or failed.
     */
    bulkPost(requests = [],continueWithFailure = false, onProgress = null){return this.bulkDecorator(requests, continueWithFailure, onProgress, 'post');}
    
    /**
     * 
     * @param {*} path 
     * @param {*} data 
     * @param {*} conf 
     */
    patch(path='', data = {}, conf = {}){
        if(Array.isArray(path)){
            console.warn('It seems that you are providing an array of paths, try using bulkPatch')
            path = '';
        }
        return this.call(Object.assign(conf,{method:'patch',url:path, data:data}));
    }
    /**
     * 
     * @param {*} requests =[path:string] || [conf:{}]
     * @param {*} continueWithFailure:Boolean 
     *          false:The bulk call fails with the first request that fail. 
     *          true: The bulk call continue until each sub request is completed or failed.
     */
    bulkPatch(requests = [],continueWithFailure = false, onProgress = null){return this.bulkDecorator(requests, continueWithFailure, onProgress, 'patch');}

    /**
     * 
     * @param {*} path 
     * @param {*} data 
     * @param {*} conf 
     */
    put(path='', data = {}, conf = {}){
        if(Array.isArray(path)){
            console.warn('It seems that you are providing an array of paths, try using bulkPut')
            path = '';
        }
        return this.call(Object.assign(conf,{method:'put',url:path, data:data}));
    }
    /**
     * 
     * @param {*} requests =[path:string] || [conf:{}]
     * @param {*} continueWithFailure:Boolean 
     *          false:The bulk call fails with the first request that fail. 
     *          true: The bulk call continue until each sub request is completed or failed.
     */
    bulkPut(requests = [],continueWithFailure = false, onProgress = null){return this.bulkDecorator(requests, continueWithFailure, onProgress, 'put');}

    /**
     * 
     * @param {*} path 
     * @param {*} conf
     */
    delete(path='', conf = {}){
        if(Array.isArray(path)){
            console.warn('It seems that you are providing an array of paths, try using bulkDelete')
            path = '';
        }
        return this.call(Object.assign(conf,{method:'delete',url:path}));
    }

    /**
     * 
     * @param {*} requests =[path:string] || [conf:{}]
     * @param {*} continueWithFailure:Boolean 
     *          false:The bulk call fails with the first request that fail. 
     *          true: The bulk call continue until each sub request is completed or failed.
     */
    bulkDelete(requests = [],continueWithFailure = false, onProgress = null){return this.bulkDecorator(requests, continueWithFailure, onProgress, 'delete');}

    /**
     * 
     * @param {*} requests =[path:string] || [conf:{}]
     * @param {*} continueWithFailure:Boolean 
     *          false:The bulk call fails with the first request that fail. 
     *          true: The bulk call continue until each sub request is completed or failed.
     */
    bulkDecorator(requests = [], continueWithFailure = false, onProgress = null, method){
        let result = [];
        requests.forEach(request=>{
            if(typeof request === 'string'){
                // Only path
                result.push({method:method,url:request});
            } else if (typeof request === 'object'){
                // Config
                let url = request.url !== undefined ? request.url : request.path !== undefined ? request.path : '';
                result.push(Object.assign(request,{method:method,url:url}));
            }
        })
        return this.bulkCall(result, continueWithFailure, onProgress);
    }

    /**
     * -Call receive the complete axios configuration (see axios request configuration)
     * -Call receive also the compelte configuration for RequestObject
     * 
     */
    call({method = 'get', url = '', params = {}, data = {}, alias = null, ...rest} = {}){
        
        if(!axios[method]){
            console.log(`The specified method: ${method} is not allowed.`)
            // Error if the specified method is invalid
            let error = new Error(`The specified method: ${method} is not allowed.`)
            return Promise.resolve(this.createResponse({success:false,info:error.message,error:error}));
        }

        let request = this.getRequestObject(Object.assign({
                                        method:method,
                                        url:url, 
                                        params:params, 
                                        data:data, 
                                        attempts:this.maxAttemptsPerCall,
                                        alias: alias
                                        },rest));
        
        this.pendingRequests.push(request);
        this.commit('setRequestsCount',this.pendingRequests.length+this.executingRequests.length);
        
        this.executeNextRequest();

        return request.mainPromise;
    }

    /**
     * 
     * @param {*} configs:[] Array of config for each call
     * @param {*} continueWithFailure:Boolean 
     *          false:The bulk call fails with the first request that fail. 
     *          true: The bulk call continue until each sub request is completed or failed.
     */
    bulkCall(configs = [],continueWithFailure = false, onProgress = null){
        let invalidMethod = false;
        let invalidMethodInfo;
        let children = [];
        let parent = this.getRequestObject({continueWithFailure:continueWithFailure,onProgress:onProgress});

        configs.forEach(c=>{
            let request = this.getRequestObject(c);

            if(!axios[request.method]){
                // Error if the specified method is invalid
                invalidMethod = true;
                invalidMethodInfo = request.method;
            }
            children.push(request);
        });

        if(invalidMethod){
            let error = new Error(`The specified method: ${invalidMethodInfo} is not allowed.`)
            return Promise.resolve(this.createResponse({success:false,info:error.message,error:error}));
        } else {
            children.forEach(request => {
                //Added to its parent
                parent.addSubRequest(request);

                //Empty result
                request.result = this.createResponse();
                
                //Added to the pending list
                this.pendingRequests.push(request);
                this.commit('setRequestsCount',this.pendingRequests.length+this.executingRequests.length);
            })

            //Parent added to the bulk list
            this.bulkRequests.push(parent);
    
            this.executeNextRequest();
    
            return parent.mainPromise;
        }
    }

    getBulkRequestById(id){
        return this.bulkRequests.find(r=>r.id == id);
    }

    getRequestObject(config){
        return new RequestObject(config);
    }

    executeNextRequest(){
        if(this.pendingRequests.length == 0){
            // Nothing to call
            return;
        }
        
        if(this.executingRequests.length >= this.simultaneousCalls){
            // No more concurrent calls allowed
            return;
        }

        let next = this.pendingRequests.shift();
        next.status = RequestObject.Status.executing;
        next.attempts++;
        this.executingRequests.push(next);
        this.commit('setRequestsExecutingCount',this.executingRequests.length);
        this.updateWorkingStatus();

        let config = Object.assign({url: this.getComputedPath(next.url)},next.config);

        //Remote call
        this.axiosInstance(config)
        .then(result=>{
            this.evaluateRemoteResponse(next.id, result);
        })
        .catch(error=>{
            this.evaluateRemoteError(next.id, error);
        })

        //Recursive call until no more concurrent calls could be made
        this.executeNextRequest();
    }

    evaluateRemoteResponse(requestId,remoteResult){
        let request = this.executingRequests.find(r=>r.id == requestId);

        // There is not executing request matching this one (could be a bulk call remanent)
        if(!request){
            this.executeNextRequest();
            return;
        }

        //Evaluate response
        let successfull = false;
        if(remoteResult.status >= 200 && remoteResult.status < 300){
            successfull = true;
        }

        request.status = RequestObject.Status.completed;
        let result =  this.createResponse(Object.assign({success:successfull}, remoteResult));
        this.requestCompletion(request, result)

        this.executeNextRequest();
    }
    evaluateRemoteError(requestId,error){
        let request = this.executingRequests.find(r=>r.id == requestId);
        
        // There is not executing request matching this one (could be a bulk call remanent)
        if(!request){
            this.executeNextRequest();
            return;
        }
        
        let timedOut = false;
        if(error.code == 'ETIMEDOUT' || error.code == 'ECONNABORTED'){
            if(error.code == 'ECONNABORTED'){
                // Could be aborted for other reasons
                if(error.message.includes('timeout')){
                    timedOut = true;
                }
            } else {
                timedOut = true;
            }
        }

        // Can be repeated
        if(timedOut && request.attempts < request.maxAttempts){
            this.removeRequestFromLists(request.id);
            request.status = RequestObject.Status.waiting;
            // request.config.timeout = request.config.timeout ? request.config.timeout*10:this._timeout*10;
            this.pendingRequests.push(request);
        } else {
            //Permanent failure
            request.status = RequestObject.Status.failed;
            let result =  this.createResponse(Object.assign(error.response || {} ,{ success:false, info:error.message, error:error }));
            this.requestCompletion(request, result)
        }

        this.executeNextRequest();
    }

    requestCompletion(request, result){
        // Remove the request from any list
        this.removeRequestFromLists(request.id);

        request.resolve(result);

        // Was a subrequest?
        if(request.isSubRequest){
            this.evaluateBulkCompletion(request.parentId);
        }

        this.updateWorkingStatus();
    }

    evaluateBulkCompletion(requestId){
        let request = this.getBulkRequestById(requestId);

        if(!request){
            //No bulk request found
            return;
        }

        request.updateStatusBySubRequests();
        request.updateSubrequestsProgress();

        if(request.status == RequestObject.Status.failed || request.status == RequestObject.Status.completed){
            //Failed or completed
            let index = this.bulkRequests.findIndex(r=>r.id == request.id);
            this.bulkRequests.splice(index,1);
            let success = request.status == RequestObject.Status.failed ? false:true;
            request.resolve(this.createResponse({success:success,data:request.getSubrequestsPayload()}));

            //Remove any subrequest
            for(let i = 0; i < request.subRequests.length; i++){
                this.removeRequestFromLists(request.subRequests[i].id);
            }
        }
    }

    updateWorkingStatus(){
        let uploading = false;
        let downloading = false;
        let working;

        for(let i = 0; i < this.executingRequests.length; i++){
            if(this.executingRequests[i].method == 'get'){
                downloading = true;
            } else {
                uploading = true;
            }

            if(uploading && downloading){break;}
        }
        
        working = uploading || downloading;
        
        // Commit only if the state change
        if(this.working != working){
            this.working = working;
            this.commit('setWorking',this.working);
        }
        
        if(this.uploading != uploading){
            this.uploading = uploading;
            this.commit('setUploading',this.uploading);
        }
        
        if(this.downloading != downloading){
            this.downloading = downloading;
            this.commit('setDownloading',this.downloading);
        }
    }

    removeRequestFromLists(id){
        let index = this.pendingRequests.findIndex(r=>r.id == id);
        if(index >= 0){this.pendingRequests.splice(index,1);}
        
        index = this.executingRequests.findIndex(r=>r.id == id);
        if(index >= 0){this.executingRequests.splice(index,1);}

        this.commit('setRequestsCount',this.pendingRequests.length+this.executingRequests.length);
        this.commit('setRequestsExecutingCount',this.executingRequests.length);
    }

    setContentType(type){
        if(type){
            this.axiosInstance.defaults.headers.post['Content-Type'] = type;
            this.axiosInstance.defaults.headers.patch['Content-Type'] = type;
            this.axiosInstance.defaults.headers.put['Content-Type'] = type;
        }
    }

    /**
     * 
     * @param {*} token 
     * @param {*} type
     */
    setAuthorization(token, type = 'Bearer'){
        this.axiosInstance.defaults.headers.common['Authorization'] = type + token;
    }

    getComputedPath(path){
        let result = path.toLowerCase();
        
        //the provided path is relative and need the base URL?
        if(result.indexOf('http') != 0){
            result = this.baseURL + result;
        } 

        return result;
    }
}

export default new APIWrapper();