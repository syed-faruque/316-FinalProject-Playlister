/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import { BaseTransaction } from './BaseTransaction.js';

/**
 * MoveSong_Transaction
 * 
 * This class represents a transaction that moves a song
 * within the playlist. It will be managed by the transaction stack.
 */
export default class MoveSong_Transaction extends BaseTransaction {
    constructor(initStore, initFromIndex, initToIndex) {
        super();
        this.store = initStore;
        this.fromIndex = initFromIndex;
        this.toIndex = initToIndex;
    }

    executeDo() {
        this.store.moveSong(this.fromIndex, this.toIndex);
    }

    executeUndo() {
        this.store.moveSong(this.toIndex, this.fromIndex);
    }
}
