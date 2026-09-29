/**
 * History manager hook for undo and redo operations.
 *
 * Maintains past and future snapshots of editor state (e.g. layout + zoneMap).
 * Includes debounce handling for fast continuous edits so each small keystroke
 * does not pollute the history stack.
 *
 * @package WooCommerce_Template_Builder
 */

import { useState, useRef, useCallback } from '@wordpress/element';

const MAX_HISTORY = 30;

export function useHistory( initialPresent ) {
	const [ past, setPast ] = useState( [] );
	const [ present, setPresentState ] = useState( initialPresent );
	const [ future, setFuture ] = useState( [] );

	const lastPushedRef = useRef( JSON.stringify( initialPresent ) );
	const debounceTimerRef = useRef( null );
	const pendingSnapshotRef = useRef( null );

	const canUndo = past.length > 0;
	const canRedo = future.length > 0;

	/**
	 * Set state with optional history recording.
	 *
	 * @param {*|Function} nextState Next state or updater function.
	 * @param {Object} [options]
	 * @param {boolean} [options.record=true] Whether to push to history.
	 * @param {boolean} [options.debounce=false] Debounce recording (e.g. typing).
	 */
	const setPresent = useCallback( ( nextState, options = {} ) => {
		const { record = true, debounce = false } = options;

		setPresentState( ( currentPresent ) => {
			const resolvedNext = typeof nextState === 'function' ? nextState( currentPresent ) : nextState;
			const nextStr = JSON.stringify( resolvedNext );

			if ( nextStr === lastPushedRef.current ) {
				return resolvedNext;
			}

			if ( ! record ) {
				lastPushedRef.current = nextStr;
				return resolvedNext;
			}

			if ( debounce ) {
				if ( ! pendingSnapshotRef.current ) {
					pendingSnapshotRef.current = currentPresent;
				}
				if ( debounceTimerRef.current ) {
					clearTimeout( debounceTimerRef.current );
				}
				debounceTimerRef.current = setTimeout( () => {
					if ( pendingSnapshotRef.current ) {
						const snapshotToPush = pendingSnapshotRef.current;
						pendingSnapshotRef.current = null;
						setPast( ( prevPast ) => [ ...prevPast.slice( -( MAX_HISTORY - 1 ) ), snapshotToPush ] );
						setFuture( [] );
						lastPushedRef.current = nextStr;
					}
				}, 400 );
			} else {
				if ( debounceTimerRef.current ) {
					clearTimeout( debounceTimerRef.current );
					debounceTimerRef.current = null;
				}
				const snapshot = pendingSnapshotRef.current || currentPresent;
				pendingSnapshotRef.current = null;

				setPast( ( prevPast ) => [ ...prevPast.slice( -( MAX_HISTORY - 1 ) ), snapshot ] );
				setFuture( [] );
				lastPushedRef.current = nextStr;
			}

			return resolvedNext;
		} );
	}, [] );

	/**
	 * Revert to the previous state.
	 */
	const undo = useCallback( () => {
		if ( debounceTimerRef.current ) {
			clearTimeout( debounceTimerRef.current );
			debounceTimerRef.current = null;
			pendingSnapshotRef.current = null;
		}

		setPast( ( prevPast ) => {
			if ( prevPast.length === 0 ) {
				return prevPast;
			}
			const previous = prevPast[ prevPast.length - 1 ];
			const newPast = prevPast.slice( 0, prevPast.length - 1 );

			setPresentState( ( currentPresent ) => {
				setFuture( ( prevFuture ) => [ currentPresent, ...prevFuture ] );
				lastPushedRef.current = JSON.stringify( previous );
				return previous;
			} );

			return newPast;
		} );
	}, [] );

	/**
	 * Re-apply the next state.
	 */
	const redo = useCallback( () => {
		if ( debounceTimerRef.current ) {
			clearTimeout( debounceTimerRef.current );
			debounceTimerRef.current = null;
			pendingSnapshotRef.current = null;
		}

		setFuture( ( prevFuture ) => {
			if ( prevFuture.length === 0 ) {
				return prevFuture;
			}
			const next = prevFuture[ 0 ];
			const newFuture = prevFuture.slice( 1 );

			setPresentState( ( currentPresent ) => {
				setPast( ( prevPast ) => [ ...prevPast, currentPresent ] );
				lastPushedRef.current = JSON.stringify( next );
				return next;
			} );

			return newFuture;
		} );
	}, [] );

	/**
	 * Reset history with a new baseline.
	 */
	const reset = useCallback( ( newPresent ) => {
		if ( debounceTimerRef.current ) {
			clearTimeout( debounceTimerRef.current );
			debounceTimerRef.current = null;
			pendingSnapshotRef.current = null;
		}
		setPast( [] );
		setFuture( [] );
		lastPushedRef.current = JSON.stringify( newPresent );
		setPresentState( newPresent );
	}, [] );

	return {
		present,
		setPresent,
		canUndo,
		canRedo,
		undo,
		redo,
		reset,
	};
}
