/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import { BaseTransaction } from './BaseTransaction.js';

/**
 * This class represents a transaction that adds a song
 * to the playlist. It will be managed by the transaction stack.
 */
export default class AddSong_Transaction extends BaseTransaction {
    constructor(initStore, initIndex, initSong) {
        super();
        this.store = initStore;
        this.index = initIndex;
        this.song = initSong;
    }

    executeDo() {
        this.store.addSong(this.index, this.song);
    }

    executeUndo() {
        this.store.removeSong(this.index);
    }
}
