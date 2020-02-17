const uuidv4 = require('uuid/v4');

export default class RequestObject {
    static Status = {
        waiting:0,
        executing:1,
        completed:2,
        failed:3
    }

    constructor({method = 'get',url = '',attempts = 1, params={},data = {},alias = null, continueWithFailure = false, onProgress = null, ...rest}={}){
        this.maxAttempts = attempts < 1 ? 1 : attempts;
        this.attempts = 0;
        this.result = {};
        this.alias = alias;
        this.continueWithFailure = continueWithFailure; //Used in bulk calls. false: The nulkCall fails with the first subrequest that fails, true: Continue until all the calls complete
        this.onProgress = onProgress; //Used in bulk calls to report progress
        this.progress = 0;
        /**Axios related */
        this.url = url;
        this.method = method.toLowerCase();
        this.data = data;
        this.params = params;
        /*****************/

        //La url se completa despues
        this.config = Object.assign(rest, {method:this.method, params:this.params, data:this.data}); 
        this.id = uuidv4();
        this.mainPromise = new Promise(this.promiseResolver.bind(this));
        this.isSubRequest = false;
        this.status = RequestObject.Status.waiting;
        this.subRequests = [];
    }

    addSubRequest(request){
        request.parentId = this.id;
        request.isSubRequest = true;
        this.subRequests.push(request);
    }

    getSubrequestsPayload(){
        let result = {};
        for(let i = 0; i < this.subRequests.length; i++){
            let alias = this.subRequests[i].alias != null ? this.subRequests[i].alias:i;
            result[alias] = Object.assign({alias:alias}, this.subRequests[i].result); ;  
        }

        return result;
    }

    updateStatusBySubRequests(){
        /**
         * When continueWithFailure == false
         * -If any children is failed then the complete request is failed
         * -If any child is executing or waiting then the request is waiting
         * -If all the children are completed then the request is completed
         * 
         * When continueWithFailure == true
         * -If any child is executing or waiting then the request is waiting
         * -When no children is executing or waiting then:
         *      -If all the children are completed then the request is completed
         *      -If any children is failed then the complete request is failed
         * 
        **/
       let completedCount = 0;
       let failed = false;

       if(!this.continueWithFailure){
           for(let i = 0; i < this.subRequests.length; i++){
               if(this.subRequests[i].status == RequestObject.Status.failed){
                   // Failed
                   this.status = RequestObject.Status.failed;
                   break;
               } else if(this.subRequests[i].status == RequestObject.Status.completed){
                   completedCount++;
               } else {
                   // Waiting
                   this.status = RequestObject.Status.waiting;
                   break;
               }
           }

           if(completedCount == this.subRequests.length){
                // Completed
                this.status = RequestObject.Status.completed;
            }
       } else {
           
            for(let i = 0; i < this.subRequests.length; i++){
                if(this.subRequests[i].status == RequestObject.Status.failed){
                    // Failed
                    failed = true;
                    completedCount++;
                } else if(this.subRequests[i].status == RequestObject.Status.completed){
                    completedCount++;
                } else {
                    // Waiting
                    this.status = RequestObject.Status.waiting;
                    break;
                }
            }

            if(completedCount == this.subRequests.length){
                this.status = failed ? RequestObject.Status.failed : RequestObject.Status.completed;
            }
       }
    }

    /**
     * Report progress in the range [0-1]
     */
    updateSubrequestsProgress(){
        let completedCount = 0.0;
        for(let i = 0; i < this.subRequests.length; i++){
            if(this.subRequests[i].status == RequestObject.Status.failed || this.subRequests[i].status == RequestObject.Status.completed){
                // Failed or completed
                completedCount++;
            }
        }

        this.progress = completedCount/this.subRequests.length;
        
        if(this.onProgress){
            this.onProgress(this.progress);
        }
    }

    promiseResolver(resolve, reject){
        this.resolvePromise = resolve;
        this.rejectPromise = reject;
    }

    resolve(result){
        result.attempts = this.attempts;
        if(this.alias != null){
            this.result = Object.assign({alias:this.alias}, result);
        } else {
            this.result = result;
        }
        this.resolvePromise(this.result);
    }

    reject(result){
        result.attempts = this.attempts;
        if(this.alias != null){
            this.result = Object.assign({alias:this.alias}, result);
        } else {
            this.result = result;
        }
        this.rejectPromise(this.result);
    }
}