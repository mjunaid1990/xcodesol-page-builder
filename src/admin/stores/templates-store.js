/**
 * Templates data store (wp.data registry).
 *
 * @package WooCommerce_Template_Builder
 */

import { registerStore } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

const STORE_KEY = 'xcosb/templates';

const DEFAULT_STATE = {
	template: null,
	loading: false,
	saving: false,
	error: null,
	notice: null,
};

const actions = {
	setTemplate( template ) {
		return { type: 'SET_TEMPLATE', template };
	},
	setLoading( loading ) {
		return { type: 'SET_LOADING', loading };
	},
	setSaving( saving ) {
		return { type: 'SET_SAVING', saving };
	},
	setError( error ) {
		return { type: 'SET_ERROR', error };
	},
	setNotice( notice ) {
		return { type: 'SET_NOTICE', notice };
	},
	clearNotice() {
		return { type: 'SET_NOTICE', notice: null };
	},
	fetchTemplate( templateId ) {
		return async ( { dispatch } ) => {
			dispatch.setLoading( true );
			dispatch.setError( null );

			try {
				const template = await apiFetch( {
					path: `/xcosb/v1/templates/${ templateId }`,
				} );

				dispatch.setTemplate( template );
			} catch ( e ) {
				dispatch.setError(
					( e && e.message ) || __( 'Could not load template.', 'xcodesol-page-builder' )
				);
			} finally {
				dispatch.setLoading( false );
			}
		};
	},
	saveTemplate( templateId, payload ) {
		return async ( { dispatch } ) => {
			dispatch.setSaving( true );
			dispatch.setNotice( null );
			dispatch.setError( null );

			try {
				const updated = await apiFetch( {
					path: `/xcosb/v1/templates/${ templateId }`,
					method: 'POST',
					data: payload,
				} );

				dispatch.setTemplate( updated );
				dispatch.setNotice( __( 'Template saved successfully.', 'xcodesol-page-builder' ) );
				return updated;
			} catch ( e ) {
				dispatch.setError(
					( e && e.message ) || __( 'Could not save template.', 'xcodesol-page-builder' )
				);
				return null;
			} finally {
				dispatch.setSaving( false );
			}
		};
	},
	exportTemplate( templateId ) {
		return async ( { dispatch } ) => {
			try {
				return await apiFetch( {
					path: `/xcosb/v1/templates/${ templateId }/export`,
				} );
			} catch ( e ) {
				dispatch.setError(
					( e && e.message ) || __( 'Could not export template.', 'xcodesol-page-builder' )
				);
				return null;
			}
		};
	},
	importTemplate( document ) {
		return async ( { dispatch } ) => {
			try {
				return await apiFetch( {
					path: '/xcosb/v1/templates/import',
					method: 'POST',
					data: document,
				} );
			} catch ( e ) {
				dispatch.setError(
					( e && e.message ) || __( 'Could not import template.', 'xcodesol-page-builder' )
				);
				return null;
			}
		};
	},
};

const reducer = ( state = DEFAULT_STATE, action ) => {
	switch ( action.type ) {
		case 'SET_TEMPLATE':
			return { ...state, template: action.template };
		case 'SET_LOADING':
			return { ...state, loading: action.loading };
		case 'SET_SAVING':
			return { ...state, saving: action.saving };
		case 'SET_ERROR':
			return { ...state, error: action.error };
		case 'SET_NOTICE':
			return { ...state, notice: action.notice };
		default:
			return state;
	}
};

const selectors = {
	getTemplate( state ) {
		return state.template;
	},
	isLoading( state ) {
		return state.loading;
	},
	isSaving( state ) {
		return state.saving;
	},
	getError( state ) {
		return state.error;
	},
	getNotice( state ) {
		return state.notice;
	},
};

export function registerTemplatesStore() {
	const store = registerStore( STORE_KEY, {
		reducer,
		actions,
		selectors,
	} );

	return store;
}
