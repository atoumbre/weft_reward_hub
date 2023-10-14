export const ssr = false;

if (process.env.NODE_ENV !== 'development') {
	console.log = () => {
		return '';
	};
	console.debug = () => {
		return '';
	};
	console.info = () => {
		return '';
	};
	console.warn = () => {
		return '';
	};
}
