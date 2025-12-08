/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

/**
 * Base class for all playlist transactions
 */
export class BaseTransaction {
    constructor() {
        this.timestamp = new Date();
    }

    executeDo() {
        throw new Error('executeDo() must be implemented by subclass');
    }

    executeUndo() {
        throw new Error('executeUndo() must be implemented by subclass');
    }
}
