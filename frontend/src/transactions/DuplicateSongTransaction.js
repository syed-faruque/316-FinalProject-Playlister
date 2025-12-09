/**
 * Syed Faruque
 * SBU-ID: 116340094
 */


import { BaseTransaction } from './BaseTransaction.js';

/**
 * DuplicateSong_Transaction
 * 
 * Represents a transaction that duplicates a song in the playlist.
 * This transaction can be executed and undone via a transaction stack.
 */
export default class DuplicateSong_Transaction extends BaseTransaction {
    constructor(initStore, initIndex) {
        super();
        this.store = initStore;  
        this.index = initIndex;   
        this.duplicateIndex = null;           
    }

    executeDo() {
        this.store.duplicateSong(this.index); 
        this.duplicateIndex = this.index + 1;
    }

    executeUndo() {
        if (this.duplicateIndex !== null) { 
            this.store.removeSong(this.duplicateIndex);
        }
    }
}
