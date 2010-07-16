/*
 * Workflow jQuery Plugin
 * @author: Jinpu Hu <jinpu.hu@qunar.com>
 */
(function($) {

    // Class Operation
    function Operation(options) {

        var options = options || {};

        var callbackQueue = [];

        var chain = (options.chain && options.chain === true) ? true : false;

        var started = false;

        // if operation is asynchronous, innerChain will be a new Operation chain instance
        var innerChain = null; 

        this.result = undefined;

        this.state = 'running';
        this.completed = false;

        this.ok = function(result) {
            var self = this;

            if (!chain) {
                self.result = result;
                self.state = 'completed';
                self.completed = true;
            } else {
                started = true;
                self.result = result;
                self.state = 'chain running';
                self.completed = false;
            }

            setTimeout(function() {
                if (!innerChain) {
                    while (callbackQueue.length > 0) {
                        var callback = callbackQueue.shift();
                        if (chain) {
                            callbackResult = callback(self.result);
                            self.result = callbackResult;

                            if (callbackResult && callbackResult instanceof Operation) {
                                innerChain = _chain();

                                while (callbackQueue.length > 0) {
                                    innerChain.next(callbackQueue.shift());
                                }

                                innerChain.next(function(result) {
                                    self.result = result;
                                    self.state = 'completed';
                                    self.completed = true;

                                    return result;
                                });

                                callbackResult.next(function(result) {
                                    self.result = result;
                                    innerChain.start(result);
                                });
                            }
                        } else {
                            callback(self.result);
                        }
                    }

                    if (!innerChain) {
                        self.state = 'completed'; 
                        self.completed = true;
                    }
                } else {
                    while (callbackQueue.length > 0) {
                        innerChain.next(callbackQueue.shift());
                    }
                    innerChain.next(function(result) {
                        self.result = result;
                        self.state = 'completed';
                        self.completed = true;
                        return result;
                    });
                }    
            }, 1);

            return this;
        };

        this.start = function(initialArgument) {
            return this.ok(initialArgument);
        };

        this.next = function(callback) {
            callbackQueue.push(callback);
            if (this.completed || (chain && started)) {
                this.ok(this.result);
            }
            return this;
        };
    };

    function _chain(firstFunction) {
        var chain = new Operation({ chain: true });
        if (firstFunction) {
            chain.next(firstFunction);
        }
        return chain;
    };

    $.generateOperation = function() {
        return new Operation(); 
    };

    $.workflow = function(firstFunction) {
        return _chain(firstFunction);
    };
})(jQuery);
