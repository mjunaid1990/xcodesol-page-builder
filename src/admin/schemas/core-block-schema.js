export const manifest = {
	widget: 'wordpress-core-block',
	type: 'xcopb/gb-core-block',
	aliases: [ 'xcosb/gb-core-block' ],
	controls: [ 'text', 'code' ],
};

export const CORE_BLOCK_SCHEMA = {
	type: manifest.type,
	version: 1,
	manifest,
	sections: [
		{ id: 'core', tab: 'content', title: 'WordPress block', defaultOpen: true },
		{ id: 'markup', tab: 'content', title: 'Block markup' },
	],
	controls: [
		{ id: 'core_label', type: 'text', label: 'Block name', tab: 'content', section: 'core', readOnly: true },
		{ id: 'core_markup', type: 'code', label: 'Serialized block', tab: 'content', section: 'markup', language: 'html', help: 'This is native WordPress block markup. The front end renders it with WordPress.' },
	],
};
