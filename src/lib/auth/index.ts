/**
 * Public Auth API
 */

export { session } from './session.svelte.js';
export { can, type CanContext } from './can.js';
export {
	getAccessibleOutlets,
	isInScope,
	assertInScope,
	DEMO_OUTLETS,
	ALL_OUTLET_IDS
} from './scope.js';
