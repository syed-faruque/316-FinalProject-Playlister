/**
 * Syed Faruque
 * SBU-ID: 116340094
 */

import { BaseTransaction } from './BaseTransaction.js';

/**
 * RemoveSong_Transaction
 * 
 * This class represents a transaction that removes a song
 * from the playlist. It will be managed by the transaction stack.
 */
export default class RemoveSong_Transaction extends BaseTransaction {
    constructor(initStore, initIndex, initSongItem) {
        super();
        this.store = initStore;
        this.index = initIndex;
        this.songItem = JSON.parse(JSON.stringify(initSongItem));
    }

    executeDo() {
        this.store.removeSong(this.index);
    }

    executeUndo() {
        this.store.addSong(this.index, this.songItem);
    }
}
