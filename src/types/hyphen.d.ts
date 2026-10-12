declare module 'hyphen/pt/index.js' {
  const hyphen: {
    hyphenateSync: (text: string, options?: { hyphenChar?: string; minWordLength?: number }) => string;
    hyphenate: (text: string, options?: { hyphenChar?: string; minWordLength?: number }) => Promise<string>;
  };
  export default hyphen;
}
