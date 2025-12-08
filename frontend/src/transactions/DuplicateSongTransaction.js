/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import { BaseTransaction } from './BaseTransaction.js';

/**
 * DuplicateSong_Transaction
 * 
 * This class represents a transaction that duplicates a song
 * in the playlist. It will be managed by the transaction stack.
 */
export default class DuplicateSong_Transaction extends BaseTransaction {
    constructor(initStore, initIndex) {
        super();
        this.store = initStore;
        this.index = initIndex;
    }

    executeDo() {
        this.store.duplicateSong(this.index);
    }

    executeUndo() {
        this.store.removeSong(this.index + 1);
    }
}
