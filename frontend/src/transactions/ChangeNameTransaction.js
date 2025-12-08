/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import { BaseTransaction } from './BaseTransaction.js';

/**
 * ChangeName_Transaction
 * 
 * This class represents a transaction that changes the playlist name.
 * It will be managed by the transaction stack.
 */
export default class ChangeName_Transaction extends BaseTransaction {
    constructor(initStore, initOldName, initNewName) {
        super();
        this.store = initStore;
        this.oldName = initOldName;
        this.newName = initNewName;
    }

    executeDo() {
        this.store.setName(this.newName);
    }

    executeUndo() {
        this.store.setName(this.oldName);
    }
}
